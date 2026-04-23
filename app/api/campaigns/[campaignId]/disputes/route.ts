import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ campaignId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { campaignId } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description } = await req.json();

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: 'Description must be at least 10 characters' }, { status: 400 });
    }

    const { data: dispute, error } = await supabase
      .from('disputes')
      .insert({
        campaign_id: campaignId,
        backer_id: user.id,
        description,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, dispute }, { status: 201 });
  } catch (error) {
    console.error('Dispute creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
