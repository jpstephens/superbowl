import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zlbelhvixjozmjtchmsj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmVsaHZpeGpvem1qdGNobXNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY5MTI1MywiZXhwIjoyMDc3MjY3MjUzfQ.hJbNe_Xd_89mv_eMPiW90uxPxpOIVsCwf_BQ-81mTlw'
);

async function setup() {
  console.log('Checking game_state table...');

  // Check if game_state exists
  const { data, error } = await supabase.from('game_state').select('*').limit(1);

  if (error) {
    console.log('Error querying game_state:', error.message);
    console.log('The game_state table may need to be created in Supabase.');
    return;
  }

  if (data && data.length > 0) {
    console.log('Game state already exists:');
    console.log('  Teams:', data[0].afc_team, 'vs', data[0].nfc_team);
    console.log('  Score:', data[0].afc_score, '-', data[0].nfc_score);
    console.log('  Quarter:', data[0].quarter);
    console.log('  Live:', data[0].is_live);
    return;
  }

  console.log('Creating initial game_state...');
  const { error: insertError } = await supabase.from('game_state').insert({
    afc_team: 'Kansas City Chiefs',
    nfc_team: 'Philadelphia Eagles',
    afc_score: 0,
    nfc_score: 0,
    quarter: 0,
    time_remaining: '15:00',
    is_live: false,
    is_halftime: false,
    is_final: false,
  });

  if (insertError) {
    console.log('Insert error:', insertError.message);
  } else {
    console.log('Game state created successfully!');
    console.log('  Teams: Kansas City Chiefs vs Philadelphia Eagles');
    console.log('  Score: 0 - 0');
    console.log('  Status: Pre-Game');
  }
}

setup().catch(console.error);
