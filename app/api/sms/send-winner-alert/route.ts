import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSMS, sendBulkSMS } from '@/lib/sms/twilio';

/**
 * Send immediate winner alert when someone wins a quarter
 * Priority notification for the winner + broadcast to all
 */
export async function POST(request: Request) {
  try {
    const { quarter, winnerId, winnerName, prizeAmount, afcScore, nfcScore, winningNumbers } = await request.json();

    if (!quarter || !winnerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Send priority notification to winner
    if (winnerId) {
      const { data: winner } = await supabase
        .from('profiles')
        .select('phone, notification_preferences')
        .eq('id', winnerId)
        .single();

      if (winner?.phone) {
        const winnerMessage = `🎉🏆 CONGRATULATIONS! You won Q${quarter}! Score: ${afcScore}-${nfcScore} (${winningNumbers}). Prize: $${prizeAmount}! 🎉`;
        await sendSMS(winner.phone, winnerMessage);
      }
    }

    // Send broadcast to all other users who want quarter win notifications
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, phone, notification_preferences')
      .not('phone', 'is', null)
      .neq('id', winnerId || '');

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ 
        message: 'Winner notified, no other users to notify' 
      });
    }

    // Filter users who have quarter win notifications enabled
    const eligibleProfiles = profiles.filter((profile) => {
      const prefs = profile.notification_preferences || {};
      return prefs.quarter_wins !== false; // Default to true
    });

    if (eligibleProfiles.length > 0) {
      const broadcastMessage = `🏈 Q${quarter} Winner: ${winnerName}! Score: ${afcScore}-${nfcScore} (${winningNumbers}) - Prize: $${prizeAmount}`;

      const notifications = eligibleProfiles.map((profile) => ({
        to: profile.phone!,
        message: broadcastMessage,
      }));

      await sendBulkSMS(notifications);
    }

    return NextResponse.json({
      message: 'Winner alert sent',
      winnerNotified: !!winnerId,
      broadcastCount: eligibleProfiles.length,
    });
  } catch (error) {
    console.error('Error sending winner alert SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send winner alert SMS' },
      { status: 500 }
    );
  }
}

