import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBulkSMS } from '@/lib/sms/twilio';

/**
 * Send score update notifications to users who have opted in
 * Only sends to users who have the "score_changes" notification preference enabled
 */
export async function POST(request: Request) {
  try {
    const { afcScore, nfcScore, afcTeam, nfcTeam, quarter, scoringTeam, scoringType } = await request.json();

    const supabase = await createClient();

    // Get all users with phone numbers who want score notifications
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, phone, notification_preferences')
      .not('phone', 'is', null);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No users with phone numbers' });
    }

    // Filter users who have score change notifications enabled
    const eligibleProfiles = profiles.filter((profile) => {
      const prefs = profile.notification_preferences || {};
      return prefs.score_changes !== false; // Default to true
    });

    if (eligibleProfiles.length === 0) {
      return NextResponse.json({ message: 'No users have score notifications enabled' });
    }

    // Build the message
    const scoringTypeEmojis: Record<string, string> = {
      touchdown: '🏈',
      field_goal: '🎯',
      safety: '⚠️',
      extra_point: '➕',
      two_point: '2️⃣',
    };
    const scoringTypeEmoji = scoringTypeEmojis[scoringType as string] || '📊';

    const message = `${scoringTypeEmoji} ${scoringTeam || 'Score Update'}! ${afcTeam} ${afcScore} - ${nfcTeam} ${nfcScore} (Q${quarter})`;

    const notifications = eligibleProfiles.map((profile) => ({
      to: profile.phone!,
      message,
    }));

    const sentCount = await sendBulkSMS(notifications);

    return NextResponse.json({
      message: 'Score update notifications sent',
      sentCount,
      totalEligible: eligibleProfiles.length,
    });
  } catch (error) {
    console.error('Error sending score update SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send score update SMS' },
      { status: 500 }
    );
  }
}

