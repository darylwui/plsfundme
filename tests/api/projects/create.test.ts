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

vi.mock("@/lib/utils/sanitize", () => ({
  sanitizeRichHtml: vi.fn((html: string) => html),
}));

import { createClient } from "@/lib/supabase/server";
import { sendAdminNewProjectSubmittedEmail } from "@/lib/email/templates";

const mockCreateClient = vi.mocked(createClient);
const mockSendAdminEmail = vi.mocked(sendAdminNewProjectSubmittedEmail);

const CATEGORY_UUID = "550e8400-e29b-41d4-a716-446655440000";
const FUTURE_DEADLINE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const FUTURE_START = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const VALID_BODY = {
  category_id: CATEGORY_UUID,
  title: "My Campaign",
  short_description: "A short description that is long enough",
  full_description: "<p>Full description that meets the minimum length requirement of fifty characters total.</p>",
  cover_image_url: "https://example.com/cover.jpg",
  video_url: null,
  funding_goal_sgd: 5000,
  payout_mode: "automatic",
  start_date: FUTURE_START,
  deadline: FUTURE_DEADLINE,
  rewards: [
    {
      title: "Reward 1",
      description: "desc",
      minimum_pledge_sgd: 50,
      estimated_delivery_date: "2026-12-01",
      max_backers: 100,
      includes_physical_item: true,
    },
  ],
};

let reqCounter = 0;
function buildRequest(body: unknown = VALID_BODY) {
  reqCounter += 1;
  // Unique IP per request so the per-IP in-memory rate limiter doesn't bleed between tests.
  return new NextRequest("http://localhost/api/projects", {
    method: "POST",
    headers: { "x-forwarded-for": `10.0.0.${reqCounter}` },
    body: JSON.stringify(body),
  });
}

function profileResult(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

describe("POST /api/projects", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        return profileResult({
          role: "backer",
          display_name: "Joe",
          creator_profiles: { status: "approved" },
        });
      }
    });

    const res = await POST(buildRequest());
    expect(res.status).toBe(403);
  });

  it("returns 403 when creator_profiles status is not approved", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return profileResult({
          role: "creator",
          display_name: "Joe",
          creator_profiles: { status: "pending_review" },
        });
      }
    });

    const res = await POST(buildRequest());
    expect(res.status).toBe(403);
  });

  it("returns 400 when body fails schema validation", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return profileResult({
          role: "creator",
          display_name: "Joe",
          creator_profiles: { status: "approved" },
        });
      }
    });

    const res = await POST(buildRequest({ ...VALID_BODY, title: "x" })); // too short
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/title/);
  });

  it("returns 400 when deadline is in the past", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return profileResult({
          role: "creator",
          display_name: "Joe",
          creator_profiles: { status: "approved" },
        });
      }
    });

    const pastDeadline = new Date(Date.now() - 86_400_000).toISOString();
    const res = await POST(buildRequest({ ...VALID_BODY, deadline: pastDeadline }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Deadline/);
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
        return profileResult({
          role: "creator",
          display_name: "Joe Creator",
          creator_profiles: { status: "approved" },
        });
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

  it("accepts creator_profiles delivered as an array (PostgREST embedded join)", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    const projectInsertMock = vi.fn().mockReturnThis();
    const projectSelectMock = vi.fn().mockReturnThis();
    const projectSingleMock = vi
      .fn()
      .mockResolvedValue({ data: { id: "proj-1" }, error: null });
    const rewardInsertMock = vi.fn().mockResolvedValue({ data: null, error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return profileResult({
          role: "creator",
          display_name: "Joe",
          creator_profiles: [{ status: "approved" }],
        });
      }
      if (table === "projects") {
        return { insert: projectInsertMock, select: projectSelectMock, single: projectSingleMock };
      }
      if (table === "rewards") {
        return { insert: rewardInsertMock };
      }
    });

    const res = await POST(buildRequest());
    expect(res.status).toBe(200);
  });

  it("returns 500 when project insert fails", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return profileResult({
          role: "creator",
          display_name: "Joe",
          creator_profiles: { status: "approved" },
        });
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
        return profileResult({
          role: "creator",
          display_name: "Joe",
          creator_profiles: { status: "approved" },
        });
      }
      if (table === "projects") {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "proj-1" }, error: null }),
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
