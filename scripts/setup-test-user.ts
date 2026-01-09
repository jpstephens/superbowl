/**
 * Setup Test User Script
 * Run with: npx ts-node scripts/setup-test-user.ts
 * Or: npx tsx scripts/setup-test-user.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zlbelhvixjozmjtchmsj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmVsaHZpeGpvem1qdGNobXNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY5MTI1MywiZXhwIjoyMDc3MjY3MjUzfQ.hJbNe_Xd_89mv_eMPiW90uxPxpOIVsCwf_BQ-81mTlw';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpass123',
  name: 'Test User',
};

const ADMIN_USER = {
  email: 'admin@superbowl.com',
  password: 'admin123',
  name: 'Admin User',
};

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('Setting up test users...\n');

  // Create test user
  console.log('1. Creating test user...');
  const { data: testAuth, error: testAuthError } = await supabase.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true,
  });

  if (testAuthError) {
    if (testAuthError.message.includes('already been registered')) {
      console.log('   Test user already exists');
    } else {
      console.error('   Error:', testAuthError.message);
    }
  } else {
    console.log('   Created:', TEST_USER.email);

    // Create profile
    await supabase.from('profiles').upsert({
      id: testAuth.user.id,
      email: TEST_USER.email,
      name: TEST_USER.name,
      is_admin: false,
    });
  }

  // Create admin user
  console.log('\n2. Creating admin user...');
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
    email: ADMIN_USER.email,
    password: ADMIN_USER.password,
    email_confirm: true,
  });

  if (adminAuthError) {
    if (adminAuthError.message.includes('already been registered')) {
      console.log('   Admin user already exists');

      // Get existing user
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingAdmin = existingUsers?.users?.find(u => u.email === ADMIN_USER.email);

      if (existingAdmin) {
        // Ensure profile has is_admin
        await supabase.from('profiles').upsert({
          id: existingAdmin.id,
          email: ADMIN_USER.email,
          name: ADMIN_USER.name,
          is_admin: true,
        });

        // Add to admin_users table
        await supabase.from('admin_users').upsert({
          email: ADMIN_USER.email,
          role: 'admin',
        }, { onConflict: 'email' });
      }
    } else {
      console.error('   Error:', adminAuthError.message);
    }
  } else {
    console.log('   Created:', ADMIN_USER.email);

    // Create profile with admin flag
    await supabase.from('profiles').upsert({
      id: adminAuth.user.id,
      email: ADMIN_USER.email,
      name: ADMIN_USER.name,
      is_admin: true,
    });

    // Add to admin_users table
    await supabase.from('admin_users').upsert({
      email: ADMIN_USER.email,
      role: 'admin',
    }, { onConflict: 'email' });
  }

  // Ensure pool settings exist
  console.log('\n3. Setting up default pool settings...');
  const settings = [
    { key: 'pool_active', value: 'true' },
    { key: 'square_price', value: '50' },
    { key: 'prize_q1', value: '250' },
    { key: 'prize_q2', value: '250' },
    { key: 'prize_q3', value: '250' },
    { key: 'prize_q4', value: '750' },
    { key: 'tournament_launched', value: 'false' },
    { key: 'prop_price', value: '20' },
  ];

  for (const setting of settings) {
    await supabase.from('settings').upsert(setting, { onConflict: 'key' });
  }
  console.log('   Settings configured');

  // Summary
  console.log('\n========================================');
  console.log('SETUP COMPLETE!');
  console.log('========================================\n');
  console.log('TEST USER (Regular):');
  console.log(`  Email:    ${TEST_USER.email}`);
  console.log(`  Password: ${TEST_USER.password}`);
  console.log('\nADMIN USER:');
  console.log(`  Email:    ${ADMIN_USER.email}`);
  console.log(`  Password: ${ADMIN_USER.password}`);
  console.log(`  URL:      http://localhost:3000/admin/login`);
  console.log('\nPAGES:');
  console.log('  Home:     http://localhost:3000');
  console.log('  Grid:     http://localhost:3000/grid');
  console.log('  Props:    http://localhost:3000/props');
  console.log('  Admin:    http://localhost:3000/admin/dashboard');
  console.log('  Settings: http://localhost:3000/admin/settings');
  console.log('');
}

main().catch(console.error);
