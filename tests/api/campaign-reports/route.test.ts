import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/campaign-reports/route";
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

function buildClient(opts: {
  user: { id: string; email?: string } | null;
  project: { id: string; title: string; slug: string; creator_id: string } | null;
  projectError?: { message: string } | null;
  insertResult?: { data: { id: string; created_at: string } | null; error: { message: string } | null };
}) {
  const projectChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: opts.project,
      error: opts.projectError ?? null,
    }),
  };
  const insertChain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      opts.insertResult ?? {
        data: { id: "report-1", created_at: "2026-04-26T12:00:00Z" },
        error: null,
      },
    ),
  };
  const profileChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { display_name: "Test Reporter" },
      error: null,
    }),
  };
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user } }),
    },
    from: vi.fn((table: string) => {
      if (table === "projects") return projectChain;
      if (table === "campaign_reports") return insertChain;
      if (table === "profiles") return profileChain;
      throw new Error(`unexpected table: ${table}`);
    }),
    _chains: { projectChain, insertChain, profileChain },
  };
}

function makeReq(body: unknown) {
  return new NextRequest("http://localhost/api/campaign-reports", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/campaign-reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("auth", () => {
    it("returns 401 when not signed in", async () => {
      const client = buildClient({ user: null, project: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ projectId: "proj-1", category: "fraud", message: "ten chars!" }),
      );
      expect(res.status).toBe(401);
    });
  });

  describe("validation", () => {
    const validUser = { id: "reporter-1", email: "r@t" };

    it("rejects missing projectId", async () => {
      const client = buildClient({ user: validUser, project: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(makeReq({ category: "fraud", message: "long enough message" }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/project/i);
    });

    it("rejects unknown category", async () => {
      const client = buildClient({ user: validUser, project: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ projectId: "p-1", category: "made_up", message: "long enough message" }),
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/category/i);
    });

    it("rejects missing category", async () => {
      const client = buildClient({ user: validUser, project: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(makeReq({ projectId: "p-1", message: "long enough message" }));
      expect(res.status).toBe(400);
    });

    it("rejects message shorter than 10 chars", async () => {
      const client = buildClient({ user: validUser, project: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(makeReq({ projectId: "p-1", category: "fraud", message: "short" }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/between 10 and 2000/);
    });

    it("rejects message > 2000 chars", async () => {
      const client = buildClient({ user: validUser, project: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ projectId: "p-1", category: "fraud", message: "x".repeat(2001) }),
      );
      expect(res.status).toBe(400);
    });

    it("accepts each valid category", async () => {
      const validProject = {
        id: "proj-1",
        title: "T",
        slug: "t",
        creator_id: "creator-1",
      };
      for (const category of [
        "fraud",
        "ip_infringement",
        "illegal_regulated",
        "inappropriate",
        "other",
      ]) {
        const client = buildClient({ user: validUser, project: validProject });
        mockCreateClient.mockResolvedValue(client as never);
        const res = await POST(
          makeReq({ projectId: "proj-1", category, message: "ten chars min" }),
        );
        expect(res.status, `category=${category}`).toBe(201);
      }
    });
  });

  describe("project lookup", () => {
    const validUser = { id: "reporter-1", email: "r@t" };

    it("returns 404 when project not found", async () => {
      const client = buildClient({ user: validUser, project: null });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ projectId: "missing", category: "fraud", message: "ten chars min" }),
      );
      expect(res.status).toBe(404);
    });

    it("returns 500 when project query errors", async () => {
      const client = buildClient({
        user: validUser,
        project: null,
        projectError: { message: "db boom" },
      });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ projectId: "p-1", category: "fraud", message: "ten chars min" }),
      );
      expect(res.status).toBe(500);
    });

    it("returns 400 when reporter is the creator (self-report)", async () => {
      const client = buildClient({
        user: validUser,
        project: {
          id: "proj-1",
          title: "T",
          slug: "t",
          creator_id: validUser.id,
        },
      });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ projectId: "proj-1", category: "fraud", message: "ten chars min" }),
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/own campaign/i);
    });
  });

  describe("happy path", () => {
    const validUser = { id: "reporter-1", email: "r@t" };
    const validProject = {
      id: "proj-1",
      title: "Test Project",
      slug: "test-project",
      creator_id: "creator-1",
    };

    it("returns 201 + reportId on success", async () => {
      const client = buildClient({ user: validUser, project: validProject });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ projectId: "proj-1", category: "fraud", message: "Ten chars min" }),
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.reportId).toBe("report-1");
    });

    it("inserts row with reporter_id from auth, not from request body", async () => {
      const client = buildClient({ user: validUser, project: validProject });
      mockCreateClient.mockResolvedValue(client as never);
      await POST(
        makeReq({
          projectId: "proj-1",
          category: "fraud",
          message: "Ten chars min",
          reporterId: "spoofed-id",
        }),
      );
      const insertCall = client._chains.insertChain.insert.mock.calls[0]?.[0];
      expect(insertCall.reporter_id).toBe(validUser.id);
      expect(insertCall.reporter_id).not.toBe("spoofed-id");
    });

    it("trims message before length check", async () => {
      const client = buildClient({ user: validUser, project: validProject });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ projectId: "proj-1", category: "fraud", message: "   short   " }),
      );
      expect(res.status).toBe(400);
    });

    it("sends admin email with category in subject", async () => {
      const sendMock = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.mocked(getResend).mockReturnValue({ emails: { send: sendMock } } as never);

      const client = buildClient({ user: validUser, project: validProject });
      mockCreateClient.mockResolvedValue(client as never);
      await POST(
        makeReq({ projectId: "proj-1", category: "ip_infringement", message: "Ten chars min" }),
      );
      expect(sendMock).toHaveBeenCalledOnce();
      const sendArgs = sendMock.mock.calls[0]?.[0];
      expect(sendArgs.to).toBe("admin@test");
      expect(sendArgs.subject).toMatch(/Report.*Test Project.*IP infringement/i);
    });

    it("still returns 201 if email send throws (best-effort notify)", async () => {
      const sendMock = vi.fn().mockRejectedValue(new Error("resend down"));
      vi.mocked(getResend).mockReturnValue({ emails: { send: sendMock } } as never);

      const client = buildClient({ user: validUser, project: validProject });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ projectId: "proj-1", category: "fraud", message: "Ten chars min" }),
      );
      expect(res.status).toBe(201);
      expect((await res.json()).success).toBe(true);
    });

    it("returns 500 if insert fails", async () => {
      const client = buildClient({
        user: validUser,
        project: validProject,
        insertResult: { data: null, error: { message: "RLS violation" } },
      });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await POST(
        makeReq({ projectId: "proj-1", category: "fraud", message: "Ten chars min" }),
      );
      expect(res.status).toBe(500);
      expect((await res.json()).error).toMatch(/RLS/);
    });
  });
});
