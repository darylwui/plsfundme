import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/dispute-concerns/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/email/resend", () => ({
  FROM: "noreply@test",
  ADMIN_EMAIL: "admin@test",
  getResend: vi.fn(() => ({
    emails: { send: vi.fn().mockResolvedValue({ data: {}, error: null }) },
  })),
}));

import { createClient } from "@/lib/supabase/server";
import { getResend } from "@/lib/email/resend";

const mockCreateClient = vi.mocked(createClient);

// Build a Supabase client mock whose `.from(table)` returns one of two
// behaviors depending on the table name: pledges → ownership check,
// dispute_concerns → insert. Profiles are looked up only on the success
// path (for the email body) and we shortcut them.
function buildClient(opts: {
  user: { id: string; email?: string } | null;
  pledge: { id: string; project_id: string; backer_id: string; project: { title: string; slug: string } } | null;
  pledgeError?: { message: string } | null;
  insertResult?: { data: { id: string; created_at: string } | null; error: { message: string } | null };
}) {
  const pledgeChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: opts.pledge,
      error: opts.pledgeError ?? null,
    }),
  };
  const insertChain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      opts.insertResult ?? {
        data: { id: "concern-1", created_at: "2026-04-26T12:00:00Z" },
        error: null,
      },
    ),
  };
  const profileChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { display_name: "Test Backer" },
      error: null,
    }),
  };
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user } }),
    },
    from: vi.fn((table: string) => {
      if (table === "pledges") return pledgeChain;
      if (table === "dispute_concerns") return insertChain;
      if (table === "profiles") return profileChain;
      throw new Error(`unexpected table: ${table}`);
    }),
    _chains: { pledgeChain, insertChain, profileChain },
  };
}

function makeReq(body: unknown) {
  return new NextRequest("http://localhost/api/dispute-concerns", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/dispute-concerns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("auth", () => {
    it("returns 401 when not signed in", async () => {
      const client = buildClient({ user: null, pledge: null });
      mockCreateClient.mockResolvedValue(client as never);

      const res = await POST(makeReq({ pledgeId: "p-1", message: "ten chars!" }));
      expect(res.status).toBe(401);
    });
  });

  describe("validation", () => {
    const validUser = { id: "backer-1", email: "b@t" };

    it("rejects missing pledgeId", async () => {
      const client = buildClient({ user: validUser, pledge: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(makeReq({ message: "long enough message" }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/pledge/i);
    });

    it("rejects message shorter than 10 chars", async () => {
      const client = buildClient({ user: validUser, pledge: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(makeReq({ pledgeId: "p-1", message: "short" }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/between 10 and 2000/);
    });

    it("rejects message > 2000 chars", async () => {
      const client = buildClient({ user: validUser, pledge: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(makeReq({ pledgeId: "p-1", message: "x".repeat(2001) }));
      expect(res.status).toBe(400);
    });

    it("rejects milestoneNumber outside 1-3", async () => {
      const client = buildClient({ user: validUser, pledge: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ pledgeId: "p-1", milestoneNumber: 4, message: "long enough message" }),
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/Milestone/);
    });

    it("accepts milestoneNumber = null (whole-campaign)", async () => {
      const client = buildClient({
        user: validUser,
        pledge: {
          id: "p-1",
          project_id: "proj-1",
          backer_id: validUser.id,
          project: { title: "Test", slug: "test" },
        },
      });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ pledgeId: "p-1", milestoneNumber: null, message: "long enough message" }),
      );
      expect(res.status).toBe(201);
    });
  });

  describe("pledge ownership", () => {
    const validUser = { id: "backer-1", email: "b@t" };

    it("returns 404 when pledge not found for user", async () => {
      const client = buildClient({ user: validUser, pledge: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(makeReq({ pledgeId: "p-1", message: "long enough message" }));
      expect(res.status).toBe(404);
      expect((await res.json()).error).toMatch(/not found/i);
    });

    it("returns 500 when pledge query errors", async () => {
      const client = buildClient({
        user: validUser,
        pledge: null,
        pledgeError: { message: "db boom" },
      });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(makeReq({ pledgeId: "p-1", message: "long enough message" }));
      expect(res.status).toBe(500);
    });
  });

  describe("happy path", () => {
    const validUser = { id: "backer-1", email: "b@t" };
    const validPledge = {
      id: "p-1",
      project_id: "proj-1",
      backer_id: validUser.id,
      project: { title: "Test Project", slug: "test-project" },
    };

    it("returns 201 + concernId on success", async () => {
      const client = buildClient({ user: validUser, pledge: validPledge });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ pledgeId: "p-1", milestoneNumber: 2, message: "Ten chars min" }),
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.concernId).toBe("concern-1");
    });

    it("inserts row with backer_id from auth, not from request body", async () => {
      const client = buildClient({ user: validUser, pledge: validPledge });
      mockCreateClient.mockResolvedValue(client as never);
      await POST(
        makeReq({
          pledgeId: "p-1",
          milestoneNumber: 1,
          message: "Ten chars min",
          // hostile field that should be ignored
          backerId: "spoofed-id",
        }),
      );
      const insertCall = client._chains.insertChain.insert.mock.calls[0]?.[0];
      expect(insertCall.backer_id).toBe(validUser.id);
      expect(insertCall.backer_id).not.toBe("spoofed-id");
    });

    it("trims whitespace from message before insert + length check", async () => {
      const client = buildClient({ user: validUser, pledge: validPledge });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ pledgeId: "p-1", message: "   short   " }), // 5 chars after trim
      );
      expect(res.status).toBe(400);
    });

    it("sends admin email after successful insert", async () => {
      const sendMock = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.mocked(getResend).mockReturnValue({ emails: { send: sendMock } } as never);

      const client = buildClient({ user: validUser, pledge: validPledge });
      mockCreateClient.mockResolvedValue(client as never);
      await POST(
        makeReq({ pledgeId: "p-1", milestoneNumber: 3, message: "Ten chars min here" }),
      );
      expect(sendMock).toHaveBeenCalledOnce();
      const sendArgs = sendMock.mock.calls[0]?.[0];
      expect(sendArgs.to).toBe("admin@test");
      expect(sendArgs.subject).toMatch(/Concern.*Test Project.*M3/);
    });

    it("still returns 201 if email send throws (best-effort notify)", async () => {
      const sendMock = vi.fn().mockRejectedValue(new Error("resend down"));
      vi.mocked(getResend).mockReturnValue({ emails: { send: sendMock } } as never);

      const client = buildClient({ user: validUser, pledge: validPledge });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ pledgeId: "p-1", message: "Ten chars min" }),
      );
      expect(res.status).toBe(201);
      expect((await res.json()).success).toBe(true);
    });

    it("returns 500 if insert fails", async () => {
      const client = buildClient({
        user: validUser,
        pledge: validPledge,
        insertResult: { data: null, error: { message: "RLS violation" } },
      });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ pledgeId: "p-1", message: "Ten chars min" }),
      );
      expect(res.status).toBe(500);
      expect((await res.json()).error).toMatch(/RLS/);
    });
  });
});
