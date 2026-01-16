import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateMagicToken } from '@/lib/auth/magic-link';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://superbowl.michaelwilliamsscholarship.com';

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/auth/login?error=missing_token`);
  }

  // Validate our custom token
  const result = await validateMagicToken(token);

  if (!result.valid || !result.email) {
    const errorMessage = encodeURIComponent(result.error || 'Invalid link');
    return NextResponse.redirect(`${baseUrl}/auth/login?error=${errorMessage}`);
  }

  try {
    const supabase = createAdminClient();

    // Check if user exists in Supabase Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let authUser = existingUsers?.users?.find(u => u.email === result.email);

    // If user doesn't exist in auth, create them
    if (!authUser) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: result.email,
        email_confirm: true, // Auto-confirm since they came from a valid purchase
      });

      if (createError) {
        console.error('Error creating auth user:', createError);
        return NextResponse.redirect(`${baseUrl}/auth/login?error=auth_failed`);
      }

      authUser = newUser.user;
    }

    // Generate a Supabase magic link for this user
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: result.email,
      options: {
        redirectTo: `${baseUrl}/dashboard?welcome=true`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Error generating magic link:', linkError);
      return NextResponse.redirect(`${baseUrl}/auth/login?error=link_failed`);
    }

    // Redirect to the Supabase magic link (this will create a session)
    return NextResponse.redirect(linkData.properties.action_link);
  } catch (error) {
    console.error('Magic login error:', error);
    return NextResponse.redirect(`${baseUrl}/auth/login?error=server_error`);
  }
}
