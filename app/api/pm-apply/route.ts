import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      bio,
      linkedin_url,
      company_name,
      company_website,
      project_type,
      project_description,
      id_document_url,
    } = body;

    if (!userId || !bio || !project_type || !project_description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const service = createServiceClient();

    // Update role on profile
    const { error: profileError } = await service
      .from("profiles")
      .update({ role: "project_manager" })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Create PM profile
    const { error } = await service.from("project_manager_profiles").upsert({
      id: userId,
      bio,
      linkedin_url: linkedin_url || null,
      company_name: company_name || null,
      company_website: company_website || null,
      project_type,
      project_description,
      id_document_url: id_document_url || null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
