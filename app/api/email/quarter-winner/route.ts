import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmailSafe } from '@/lib/email/send';
import { quarterWinnerEmail } from '@/lib/email/templates/quarter-winner';

/**
 * Send quarter winner email notification
 * Called when admin sets a quarter winner
 */
export async function POST(request: Request) {
  try {
    const { quarter, userId, squareId } = await request.json();

    if (!quarter || !userId) {
      return NextResponse.json(
        { error: 'Missing quarter or userId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify admin user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get winner's profile
    const { data: winner, error: winnerError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', userId)
      .single();

    if (winnerError || !winner) {
      return NextResponse.json({ error: 'Winner not found' }, { status: 404 });
    }

    if (!winner.email) {
      return NextResponse.json({ error: 'Winner has no email address' }, { status: 400 });
    }

    // Get winning square details
    const { data: square } = await supabase
      .from('grid_squares')
      .select('row_number, col_number, row_score, col_score')
      .eq('id', squareId)
      .single();

    // Get prize amount from settings
    const { data: prizeSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', `payout_q${quarter}`)
      .single();

    const prize = parseInt(prizeSetting?.value || '1000');

    // Get game state for score and team names
    const { data: gameState } = await supabase
      .from('game_state')
      .select('afc_score, nfc_score, afc_team, nfc_team')
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://superbowlpool.com';

    // Build and send email
    const emailHtml = quarterWinnerEmail({
      name: winner.name || 'Winner',
      quarter: quarter as 1 | 2 | 3 | 4,
      prize,
      score: {
        afc: gameState?.afc_score || 0,
        nfc: gameState?.nfc_score || 0,
        afcTeam: gameState?.afc_team || 'AFC',
        nfcTeam: gameState?.nfc_team || 'NFC',
      },
      square: {
        row: square?.row_number || 0,
        col: square?.col_number || 0,
        rowScore: square?.row_score || 0,
        colScore: square?.col_score || 0,
      },
      baseUrl,
    });

    await sendEmailSafe({
      to: winner.email,
      subject: `🎉 You Won Q${quarter} of the Super Bowl Pool!`,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: `Winner email sent to ${winner.email}`,
    });
  } catch (error) {
    console.error('Error sending quarter winner email:', error);
    return NextResponse.json(
      { error: 'Failed to send winner email' },
      { status: 500 }
    );
  }
}
