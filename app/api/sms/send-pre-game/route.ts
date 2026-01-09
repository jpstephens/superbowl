import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBulkSMS } from '@/lib/sms/twilio';

export async function POST() {
  try {
    const supabase = await createClient();

    // Get all users with phone numbers
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .not('phone', 'is', null);

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No users to notify' });
    }

    // Get squares for each user
    const notifications = [];

    for (const profile of profiles) {
      const { data: squares } = await supabase
        .from('grid_squares')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'claimed');

      if (!squares || squares.length === 0) continue;

      const squareNumbers = squares
        .map(s => `${s.row_score}-${s.col_score}`)
        .join(', ');

      const message = `Hello ${profile.name}! Your Super Bowl pool squares: ${squareNumbers}. Good luck! 🏈`;

      notifications.push({
        to: profile.phone!,
        message,
      });
    }

    // Send SMS via Twilio
    const sentCount = await sendBulkSMS(notifications);

    return NextResponse.json({
      message: 'SMS notifications sent',
      count: notifications.length,
      sent: sentCount,
    });
  } catch (error) {
    console.error('Error sending pre-game SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}

