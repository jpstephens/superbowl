import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBulkSMS } from '@/lib/sms/twilio';

/**
 * Send personalized number reveal notifications to all participants
 * Tells each user their assigned numbers and historical odds
 */
export async function POST(request: Request) {
  try {
    const { afcTeam, nfcTeam } = await request.json();

    const supabase = await createClient();

    // Get all users with their squares
    const { data: squares } = await supabase
      .from('grid_squares')
      .select(`
        row_score,
        col_score,
        user:profiles(id, name, phone, notification_preferences)
      `)
      .in('status', ['paid', 'confirmed'])
      .not('row_score', 'is', null)
      .not('col_score', 'is', null);

    if (!squares || squares.length === 0) {
      return NextResponse.json({ message: 'No squares with assigned numbers' });
    }

    // Group squares by user
    const userSquares: Record<string, { 
      phone: string; 
      name: string; 
      squares: { row: number; col: number }[] 
    }> = {};

    for (const square of squares) {
      const user = square.user as any;
      if (!user?.phone) continue;
      
      const prefs = user.notification_preferences || {};
      if (prefs.score_changes === false) continue; // Use score_changes as a proxy for game updates

      if (!userSquares[user.id]) {
        userSquares[user.id] = {
          phone: user.phone,
          name: user.name,
          squares: [],
        };
      }

      userSquares[user.id].squares.push({
        row: square.row_score!,
        col: square.col_score!,
      });
    }

    // Historical lucky numbers
    const luckyNumbers = new Set([0, 3, 4, 7]);
    const isLucky = (row: number, col: number) => 
      luckyNumbers.has(row) || luckyNumbers.has(col);

    // Send personalized messages
    const notifications: { to: string; message: string }[] = [];

    for (const userId in userSquares) {
      const userData = userSquares[userId];
      const squaresList = userData.squares
        .map(s => `${afcTeam?.split(' ').pop() || 'AFC'} ${s.col} - ${nfcTeam?.split(' ').pop() || 'NFC'} ${s.row}`)
        .join(', ');

      const hasLucky = userData.squares.some(s => isLucky(s.row, s.col));
      const luckyText = hasLucky ? ' 🍀 You have historically lucky numbers!' : '';

      const message = `🏈 Your numbers are in! ${userData.name}, your squares: ${squaresList}${luckyText} Good luck! 🎉`;

      notifications.push({
        to: userData.phone,
        message,
      });
    }

    if (notifications.length === 0) {
      return NextResponse.json({ message: 'No eligible users for notifications' });
    }

    const sentCount = await sendBulkSMS(notifications);

    return NextResponse.json({
      message: 'Number reveal notifications sent',
      sentCount,
      totalUsers: Object.keys(userSquares).length,
    });
  } catch (error) {
    console.error('Error sending number reveal SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send number reveal SMS' },
      { status: 500 }
    );
  }
}

