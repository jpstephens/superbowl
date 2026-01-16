import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if profile exists with this email
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - that's ok, means email doesn't exist
      console.error('Error checking email:', error);
      return NextResponse.json({ error: 'Failed to check email' }, { status: 500 });
    }

    return NextResponse.json({
      exists: !!profile,
      name: profile?.name || null,
    });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
