import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_STATUSES = ['pending', 'approved', 'rejected'] as const;
type KycStatus = (typeof VALID_STATUSES)[number];

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !callerProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate status param
    const rawStatus = req.nextUrl.searchParams.get('status') ?? 'pending';
    if (!VALID_STATUSES.includes(rawStatus as KycStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }
    const status = rawStatus as KycStatus;

    // Fetch profiles with the requested status
    const { data: profiles, error: queryError } = await supabase
      .from('profiles')
      .select(
        'id, display_name, avatar_url, kyc_status, kyc_submitted_at, kyc_reviewed_at, kyc_rejection_reason, created_at',
      )
      .eq('kyc_status', status)
      .order('kyc_submitted_at', { ascending: true });

    if (queryError) {
      console.error('KYC profiles query error:', queryError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Counts for all non-unverified statuses (3 lightweight queries)
    const counts: Record<KycStatus, number> = { pending: 0, approved: 0, rejected: 0 };
    const countResults = await Promise.all(
      VALID_STATUSES.map((s) =>
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('kyc_status', s),
      ),
    );
    VALID_STATUSES.forEach((s, i) => {
      counts[s] = countResults[i].count ?? 0;
    });

    return NextResponse.json({ profiles: profiles ?? [], counts });
  } catch (error) {
    console.error('KYC admin route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
