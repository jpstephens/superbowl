import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth callback error:', error);
      // Redirect to login with error
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url));
    }

    // Check if user needs password reset
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('needs_password_reset')
        .eq('email', user.email)
        .single();

      if (profile?.needs_password_reset) {
        return NextResponse.redirect(new URL('/auth/reset-password', request.url));
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}

