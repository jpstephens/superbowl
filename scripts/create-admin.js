#!/usr/bin/env node

/**
 * Script to create an admin user for the Super Bowl Pool
 * 
 * Usage:
 *   npm run create-admin <email> <password>
 * 
 * Example:
 *   npm run create-admin admin@example.com MySecurePassword123
 * 
 * Or with default credentials:
 *   npm run create-admin
 */

const fs = require('fs');
const path = require('path');

// Try to load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

// Default admin credentials (you can change these)
const DEFAULT_EMAIL = 'admin@superbowlpool.com';
const DEFAULT_PASSWORD = 'Admin123!';

const email = process.argv[2] || DEFAULT_EMAIL;
const password = process.argv[3] || DEFAULT_PASSWORD;

if (!email || !password) {
  console.error('❌ Error: Email and password are required');
  console.log('\nUsage: npm run create-admin <email> <password>');
  console.log('Example: npm run create-admin admin@example.com MyPassword123');
  console.log('\nOr use defaults: npm run create-admin');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.log('Make sure your .env.local file has:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client (uses service role key for admin operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');
    console.log(`   Email: ${email}`);
    
    // Step 1: Create auth user
    console.log('\n📝 Step 1: Creating authentication user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists in auth, continuing...');
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Auth user created successfully');
    }

    // Get the user ID (either from new user or existing)
    let userId;
    if (authData?.user) {
      userId = authData.user.id;
    } else {
      // User already exists, get their ID
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const user = existingUser.users.find(u => u.email === email);
      if (!user) {
        throw new Error('Could not find user after creation');
      }
      userId = user.id;
    }

    // Step 2: Add to admin_users table
    console.log('\n👑 Step 2: Adding to admin_users table...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .insert([
        {
          email: email,
          role: 'admin'
        }
      ])
      .select()
      .single();

    if (adminError) {
      if (adminError.code === '23505') { // Unique constraint violation
        console.log('⚠️  User already exists in admin_users table');
        console.log('✅ Admin user is already set up!');
      } else {
        throw adminError;
      }
    } else {
      console.log('✅ Added to admin_users table');
    }

    console.log('\n🎉 Success! Admin user created!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Login at: http://localhost:3000/admin/login');
    console.log('\n⚠️  Keep these credentials secure!');

  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(error.message);
    process.exit(1);
  }
}

createAdminUser();

