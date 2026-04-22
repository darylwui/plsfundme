import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user is admin
    // For now, assume admin check is done elsewhere

    const { creator_id, decision } = await req.json();

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    const { error } = await supabase
      .from('creator_qualifications')
      .update({
        tier: decision === 'approved' ? 'creator_plus' : 'standard',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('creator_id', creator_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Creator+ approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
