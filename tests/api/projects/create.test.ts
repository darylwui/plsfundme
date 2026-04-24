import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/projects/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/email/templates", () => ({
  sendAdminNewProjectSubmittedEmail: vi.fn().mockResolvedValue({ id: "mock-email" }),
}));

vi.mock("@/lib/utils/slugify", () => ({
  slugifyUnique: vi.fn((t: string) => `${t.toLowerCase()}-abc12`),
}));

import { createClient } from "@/lib/supabase/server";
import { sendAdminNewProjectSubmittedEmail } from "@/lib/email/templates";

const mockCreateClient = vi.mocked(createClient);
const mockSendAdminEmail = vi.mocked(sendAdminNewProjectSubmittedEmail);

const VALID_BODY = {
  category_id: "cat-1",
  title: "My Campaign",
  short_description: "A short description",
  full_description: "<p>Full description</p>",
  cover_image_url: "https://example.com/cover.jpg",
  video_url: null,
  funding_goal_sgd: 5000,
  payout_mode: "escrow",
  start_date: "2026-05-01",
  deadline: "2026-06-01",
  milestones: [
    {
      title: "Prototype finalised",
      description: "Prototype finalised and manufacturing partner confirmed with signed contract.",
      target_date: "2026-07-01",
    },
    {
      title: "Production complete",
      description: "All units manufactured, QA-checked, and ready to ship from the warehouse.",
      target_date: "2026-09-01",
    },
    {
      title: "Rewards delivered",
      description: "All rewards shipped to backers and confirmed delivered with tracking proof.",
      target_date: "2026-11-01",
    },
  ],
  rewards: [
    {
      title: "Reward 1",
      description: "desc",
      minimum_pledge_sgd: 50,
      estimated_delivery_date: "2026-07-01",
      max_backers: 100,
      includes_physical_item: true,
    },
  ],
};

function buildRequest(body: unknown = VALID_BODY) {
  return new NextRequest("http://localhost/api/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/projects", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: { getUser: vi.fn() },
      from: vi.fn(),
    };

    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(buildRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when profile role is not creator", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "backer", display_name: "Joe" },
            error: null,
          }),
        };
      }
    });

    const res = await POST(buildRequest());
    expect(res.status).toBe(403);
  });

  it("returns 403 when creator_profiles status is not approved", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "creator", display_name: "Joe" },
            error: null,
          }),
        };
      }
      if (table === "creator_profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { status: "pending" },
            error: null,
          }),
        };
      }
    });

    const res = await POST(buildRequest());
    expect(res.status).toBe(403);
  });

  it("creates project + rewards and fires admin email on success", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    const projectInsertMock = vi.fn().mockReturnThis();
    const projectSelectMock = vi.fn().mockReturnThis();
    const projectSingleMock = vi
      .fn()
      .mockResolvedValue({ data: { id: "proj-1", slug: "my campaign-abc12" }, error: null });

    const rewardInsertMock = vi.fn().mockResolvedValue({ data: null, error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "creator", display_name: "Joe Creator" },
            error: null,
          }),
        };
      }
      if (table === "creator_profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { status: "approved" },
            error: null,
          }),
        };
      }
      if (table === "projects") {
        return {
          insert: projectInsertMock,
          select: projectSelectMock,
          single: projectSingleMock,
        };
      }
      if (table === "rewards") {
        return { insert: rewardInsertMock };
      }
    });

    const res = await POST(buildRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.slug).toBe("my campaign-abc12");

    expect(projectInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        creator_id: "u1",
        title: "My Campaign",
        status: "pending_review",
        funding_goal_sgd: 5000,
      })
    );

    expect(rewardInsertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        project_id: "proj-1",
        title: "Reward 1",
        display_order: 0,
      }),
    ]);

    expect(mockSendAdminEmail).toHaveBeenCalledWith({
      creatorName: "Joe Creator",
      projectTitle: "My Campaign",
      projectSlug: "my campaign-abc12",
      fundingGoal: 5000,
    });
  });

  it("returns 500 when project insert fails", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "creator", display_name: "Joe" },
            error: null,
          }),
        };
      }
      if (table === "creator_profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { status: "approved" },
            error: null,
          }),
        };
      }
      if (table === "projects") {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: null, error: { message: "insert failed" } }),
        };
      }
    });

    const res = await POST(buildRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("insert failed");
    expect(mockSendAdminEmail).not.toHaveBeenCalled();
  });

  it("does not block response when admin email throws", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "creator", display_name: "Joe" },
            error: null,
          }),
        };
      }
      if (table === "creator_profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { status: "approved" },
            error: null,
          }),
        };
      }
      if (table === "projects") {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: { id: "proj-1" }, error: null }),
        };
      }
      if (table === "rewards") {
        return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) };
      }
    });

    mockSendAdminEmail.mockRejectedValueOnce(new Error("Resend down"));

    const res = await POST(buildRequest());
    expect(res.status).toBe(200);
  });
});
