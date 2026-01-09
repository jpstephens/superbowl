import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBulkSMS } from '@/lib/sms/twilio';

/**
 * Send prop bet result notifications to participants
 * Notifies users who answered the prop with their result
 */
export async function POST(request: Request) {
  try {
    const { propId, question, correctAnswer, resultValue } = await request.json();

    if (!propId || !correctAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get all answers for this prop with user details
    const { data: answers } = await supabase
      .from('prop_answers')
      .select(`
        id,
        answer,
        is_correct,
        points_earned,
        user:profiles(id, name, phone, notification_preferences)
      `)
      .eq('prop_id', propId);

    if (!answers || answers.length === 0) {
      return NextResponse.json({ message: 'No answers for this prop' });
    }

    // Filter users who have phone numbers and prop result notifications enabled
    const notifications: { to: string; message: string }[] = [];

    for (const answer of answers) {
      const user = answer.user as any;
      if (!user?.phone) continue;

      const prefs = user.notification_preferences || {};
      if (prefs.prop_results === false) continue;

      const isCorrect = answer.is_correct;
      const emoji = isCorrect ? '✅' : '❌';
      const status = isCorrect ? 'Correct!' : 'Incorrect';

      let message = `${emoji} Prop Result: "${question}" - ${status}`;
      
      if (resultValue !== undefined && resultValue !== null) {
        message += ` (Result: ${resultValue})`;
      }

      if (isCorrect && answer.points_earned > 0) {
        message += ` +${answer.points_earned} pts!`;
      }

      notifications.push({
        to: user.phone,
        message,
      });
    }

    if (notifications.length === 0) {
      return NextResponse.json({ message: 'No eligible users for notifications' });
    }

    const sentCount = await sendBulkSMS(notifications);

    return NextResponse.json({
      message: 'Prop result notifications sent',
      sentCount,
      totalAnswers: answers.length,
    });
  } catch (error) {
    console.error('Error sending prop result SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send prop result SMS' },
      { status: 500 }
    );
  }
}

