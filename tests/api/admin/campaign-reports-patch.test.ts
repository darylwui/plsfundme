import { describe, it, expect, beforeEach, vi } from "vitest";
import { PATCH } from "@/app/api/admin/campaign-reports/[id]/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

function buildClient(opts: {
  user: { id: string } | null;
  isAdmin: boolean;
  updateResult?: {
    data: { id: string; status: string; admin_notes: string | null; updated_at: string } | null;
    error: { message: string } | null;
  };
}) {
  const profileChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: opts.user ? { is_admin: opts.isAdmin } : null,
      error: null,
    }),
  };
  const updateChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      opts.updateResult ?? {
        data: {
          id: "report-1",
          status: "reviewing",
          admin_notes: null,
          updated_at: "2026-04-26T12:00:00Z",
        },
        error: null,
      },
    ),
  };
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user } }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") return profileChain;
      if (table === "campaign_reports") return updateChain;
      throw new Error(`unexpected table: ${table}`);
    }),
    _chains: { profileChain, updateChain },
  };
}

function makeReq(body: unknown) {
  return new NextRequest("http://localhost/api/admin/campaign-reports/report-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "report-1" });

describe("PATCH /api/admin/campaign-reports/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 when not signed in", async () => {
    const client = buildClient({ user: null, isAdmin: false });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ status: "reviewing" }), { params });
    expect(res.status).toBe(401);
  });

  it("403 when signed in but not admin", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: false });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ status: "reviewing" }), { params });
    expect(res.status).toBe(403);
  });

  it("400 when status is not in enum", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ status: "escalated" }), { params }); // not in reports enum
    expect(res.status).toBe(400);
  });

  it("accepts each valid status", async () => {
    for (const status of ["open", "reviewing", "dismissed", "action_taken"]) {
      const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
      mockCreateClient.mockResolvedValue(client as never);
      const res = await PATCH(makeReq({ status }), { params });
      expect(res.status, `status=${status}`).toBe(200);
    }
  });

  it("400 when body has no fields to update", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({}), { params });
    expect(res.status).toBe(400);
  });

  it("400 when admin_notes exceeds 5000 chars", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ admin_notes: "x".repeat(5001) }), { params });
    expect(res.status).toBe(400);
  });

  it("200 on successful status + notes combined update", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
    mockCreateClient.mockResolvedValue(client as never);
    await PATCH(
      makeReq({ status: "action_taken", admin_notes: "campaign removed for IP infringement" }),
      { params },
    );
    const updateCall = client._chains.updateChain.update.mock.calls[0]?.[0];
    expect(updateCall.status).toBe("action_taken");
    expect(updateCall.admin_notes).toBe("campaign removed for IP infringement");
  });

  it("500 when supabase update errors", async () => {
    const client = buildClient({
      user: { id: "u-1" },
      isAdmin: true,
      updateResult: { data: null, error: { message: "RLS denied" } },
    });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ status: "reviewing" }), { params });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/RLS/);
  });
});
