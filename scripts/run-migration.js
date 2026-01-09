#!/usr/bin/env node

/**
 * Script to run database migration
 * This will add auth_user_id column and needs_password_reset flag to profiles table
 * 
 * Usage: node scripts/run-migration.js
 * 
 * Note: This requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.log('Make sure your .env.local file has:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🔄 Running database migration...\n');

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/003_add_auth_link.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Migration SQL:');
    console.log('─'.repeat(50));
    console.log(migrationSQL);
    console.log('─'.repeat(50));
    console.log('');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.length === 0) continue;
      
      console.log(`⏳ Executing: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      // If RPC doesn't work, try direct query (some statements work this way)
      if (error) {
        // Try alternative method - execute via raw SQL
        // Note: Supabase JS client doesn't support raw SQL directly
        // We'll need to use the REST API or tell user to run in SQL Editor
        console.log('⚠️  Direct execution not supported. Please run in Supabase SQL Editor.');
        console.log('\n📋 To complete migration:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Click "SQL Editor" in left sidebar');
        console.log('3. Click "New query"');
        console.log('4. Copy and paste the migration SQL from:');
        console.log(`   ${migrationPath}`);
        console.log('5. Click "Run"');
        process.exit(0);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 What was added:');
    console.log('  - auth_user_id column to profiles table');
    console.log('  - needs_password_reset flag to profiles table');
    console.log('  - Indexes for better performance');

  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    console.log('\n📋 Alternative: Run migration manually in Supabase SQL Editor');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Open: supabase/migrations/003_add_auth_link.sql');
    console.log('3. Copy and paste into SQL Editor');
    console.log('4. Click "Run"');
    process.exit(1);
  }
}

runMigration();



