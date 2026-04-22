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

    const { external_proof_url, external_proof_type } = await req.json();

    // Validate input
    if (!external_proof_url || !external_proof_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['portfolio', 'kickstarter', 'manufacturing_letter', 'endorsement'].includes(external_proof_type)) {
      return NextResponse.json({ error: 'Invalid proof type' }, { status: 400 });
    }

    try {
      new URL(external_proof_url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Check if creator already has a qualification record
    const { data: existing } = await supabase
      .from('creator_qualifications')
      .select('id')
      .eq('creator_id', user.id)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('creator_qualifications')
        .update({
          external_proof_url,
          external_proof_type,
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Create new
      const { error } = await supabase.from('creator_qualifications').insert({
        creator_id: user.id,
        tier: 'standard',
        external_proof_url,
        external_proof_type,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Creator+ application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
