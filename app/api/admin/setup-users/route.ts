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
      // Check if user exists in auth.users by trying to get by email
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existingUser = existingUsers?.users?.find(u => u.email === admin.email);

      console.log(`Checking ${admin.email}: found=${!!existingUser}, totalUsers=${existingUsers?.users?.length}, listError=${listError?.message}`);

      if (existingUser) {
        // Update existing user's password
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password: 'SuperBowl2026!' }
        );

        // Also update profile to link correctly
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: existingUser.id,
            email: admin.email,
            name: admin.name,
            is_admin: true,
          }, { onConflict: 'id' });

        results.push({ email: admin.email, action: 'updated', success: !error, error: error?.message, existingUserId: existingUser.id });
      } else {
        console.log(`Creating new user for ${admin.email}`);
        // Create new auth user
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: admin.email,
          password: 'SuperBowl2026!',
          email_confirm: true,
          user_metadata: { name: admin.name },
        });

        if (error) {
          results.push({ email: admin.email, action: 'create_failed', success: false, error: error?.message });
          continue;
        }

        if (data.user) {
          // Delete any existing profile with this email (wrong ID)
          await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('email', admin.email);

          // Create new profile with correct ID
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: data.user.id,
              email: admin.email,
              name: admin.name,
              is_admin: true,
            });

          results.push({
            email: admin.email,
            action: 'created',
            success: true,
            userId: data.user.id,
            profileError: profileError?.message
          });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
