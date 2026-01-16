import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is a one-time setup route - delete after use
export async function POST(request: Request) {
  try {
    const { secret } = await request.json();

    // Simple protection - require a secret to run this
    if (secret !== 'setup-admins-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const adminUsers = [
      { email: 'jasonpaulstephens@gmail.com', name: 'Jason Stephens' },
      { email: 'jmlogin@gmail.com', name: 'JM Admin' },
    ];

    const results = [];

    for (const admin of adminUsers) {
      // Check if user exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === admin.email);

      if (existingUser) {
        // Update existing user's password
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password: 'SuperBowl2026!' }
        );
        results.push({ email: admin.email, action: 'updated', success: !error, error: error?.message });
      } else {
        // Create new user
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: admin.email,
          password: 'SuperBowl2026!',
          email_confirm: true,
          user_metadata: { name: admin.name },
        });

        if (!error && data.user) {
          // Also ensure profile exists with is_admin
          await supabaseAdmin
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: admin.email,
              name: admin.name,
              is_admin: true,
            }, { onConflict: 'email' });
        }

        results.push({ email: admin.email, action: 'created', success: !error, error: error?.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
