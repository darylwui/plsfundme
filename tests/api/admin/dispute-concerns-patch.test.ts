import { describe, it, expect, beforeEach, vi } from "vitest";
import { PATCH } from "@/app/api/admin/dispute-concerns/[id]/route";
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
          id: "concern-1",
          status: "responded",
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
      if (table === "dispute_concerns") return updateChain;
      throw new Error(`unexpected table: ${table}`);
    }),
    _chains: { profileChain, updateChain },
  };
}

function makeReq(body: unknown) {
  return new NextRequest("http://localhost/api/admin/dispute-concerns/concern-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "concern-1" });

describe("PATCH /api/admin/dispute-concerns/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 when not signed in", async () => {
    const client = buildClient({ user: null, isAdmin: false });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ status: "responded" }), { params });
    expect(res.status).toBe(401);
  });

  it("403 when signed in but not admin", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: false });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ status: "responded" }), { params });
    expect(res.status).toBe(403);
  });

  it("400 when status is not in enum", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ status: "made_up" }), { params });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Status must be/);
  });

  it("400 when body has no fields to update", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({}), { params });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Nothing to update/);
  });

  it("400 when admin_notes is wrong type", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ admin_notes: 42 }), { params });
    expect(res.status).toBe(400);
  });

  it("400 when admin_notes exceeds 5000 chars", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ admin_notes: "x".repeat(5001) }), { params });
    expect(res.status).toBe(400);
  });

  it("accepts admin_notes = null (clearing notes)", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ admin_notes: null }), { params });
    expect(res.status).toBe(200);
  });

  it("200 + concern on successful status update", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ status: "responded" }), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.concern.id).toBe("concern-1");
  });

  it("forwards both fields to the supabase update", async () => {
    const client = buildClient({ user: { id: "u-1" }, isAdmin: true });
    mockCreateClient.mockResolvedValue(client as never);
    await PATCH(
      makeReq({ status: "dismissed", admin_notes: "false alarm — backer agreed" }),
      { params },
    );
    const updateCall = client._chains.updateChain.update.mock.calls[0]?.[0];
    expect(updateCall.status).toBe("dismissed");
    expect(updateCall.admin_notes).toBe("false alarm — backer agreed");
  });

  it("500 when supabase update errors", async () => {
    const client = buildClient({
      user: { id: "u-1" },
      isAdmin: true,
      updateResult: { data: null, error: { message: "row not found" } },
    });
    mockCreateClient.mockResolvedValue(client as never);
    const res = await PATCH(makeReq({ status: "responded" }), { params });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/row not found/);
  });
});
