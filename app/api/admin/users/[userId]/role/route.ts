import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { userId } = await params;

  try {
    // Get authenticated user via regular (cookie-based) client
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify caller is an admin
    const { data: callerProfile, error: callerProfileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (callerProfileError) {
      return NextResponse.json(
        { error: 'Failed to verify admin status' },
        { status: 500 }
      );
    }

    if (!callerProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Only admins can change admin status' },
        { status: 403 }
      );
    }

    // Prevent self-demotion
    if (user.id === userId) {
      return NextResponse.json(
        { error: 'You cannot change your own admin status' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    if (typeof body.is_admin !== 'boolean') {
      return NextResponse.json(
        { error: 'is_admin (boolean) is required' },
        { status: 400 }
      );
    }
    const newIsAdmin: boolean = body.is_admin;

    // Use service client for privileged operations (bypasses RLS)
    const service = createServiceClient();

    // Fetch the target user's current is_admin value
    const { data: targetProfile, error: targetProfileError } = await service
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (targetProfileError || !targetProfile) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    const oldIsAdmin: boolean = targetProfile.is_admin;

    // Update the target user's is_admin flag
    const { error: updateError } = await service
      .from('profiles')
      .update({ is_admin: newIsAdmin })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Insert audit log record via service client (no RLS INSERT policy)
    const { error: auditError } = await service
      .from('admin_audit_log')
      .insert({
        admin_id: user.id,
        action_type: 'admin_status_changed',
        target_user_id: userId,
        old_value: String(oldIsAdmin),
        new_value: String(newIsAdmin),
      });

    if (auditError) {
      // Log the failure but don't fail the request — the role change already succeeded
      console.error('Failed to write admin audit log:', auditError);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin role change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
