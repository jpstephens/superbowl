import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zlbelhvixjozmjtchmsj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmVsaHZpeGpvem1qdGNobXNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY5MTI1MywiZXhwIjoyMDc3MjY3MjUzfQ.hJbNe_Xd_89mv_eMPiW90uxPxpOIVsCwf_BQ-81mTlw'
);

async function startGame() {
  console.log('Setting game to LIVE with sample scores...\n');

  // Set game to LIVE with sample scores
  const { error } = await supabase.from('game_state').update({
    is_live: true,
    quarter: 2,
    time_remaining: '5:32',
    afc_score: 14,
    nfc_score: 10,
    is_halftime: false,
    is_final: false,
  }).eq('afc_team', 'Kansas City Chiefs');

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('========================================');
  console.log('GAME IS NOW LIVE!');
  console.log('========================================');
  console.log('');
  console.log('  Chiefs  14  -  10  Eagles');
  console.log('         Q2 • 5:32');
  console.log('');
  console.log('  Current Winning Numbers: 4-0');
  console.log('');
  console.log('========================================');
  console.log('');
  console.log('VIEW THE GAME:');
  console.log('  Pool Page:  http://localhost:3000/pool');
  console.log('  Full Grid:  http://localhost:3000/grid');
  console.log('');
  console.log('ADMIN CONTROLS:');
  console.log('  Live Panel: http://localhost:3000/admin/live');
  console.log('');
}

startGame().catch(console.error);
