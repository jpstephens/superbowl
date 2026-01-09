import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { quarter, team1Score, team2Score, finalScore } = await request.json();

    if (!quarter || !team1Score || !team2Score) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Calculate winner based on last digit of scores
    // row_score = Team A (horizontal axis) last digit
    // col_score = Team B (vertical axis) last digit
    const rowWin = team1Score % 10; // Team A last digit
    const colWin = team2Score % 10; // Team B last digit

    // Find winner square matching the last digits
    const { data: winnerSquare } = await supabase
      .from('grid_squares')
      .select('user_id')
      .eq('row_score', rowWin)
      .eq('col_score', colWin)
      .in('status', ['paid', 'confirmed']) // Include both paid and confirmed squares
      .single();

    if (!winnerSquare || !winnerSquare.user_id) {
      return NextResponse.json({ message: 'No winner found' });
    }

    // Get winner profile
    const { data: winnerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', winnerSquare.user_id)
      .single();

    if (!winnerProfile) {
      return NextResponse.json({ message: 'Winner profile not found' });
    }

    // Calculate prize amount using payout percentage system
    // First try percentage-based calculation, fallback to fixed amount
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        `payout_percent_q${quarter}`,
        'square_price',
        `prize_q${quarter}`
      ]);

    const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || []);
    
    let prizeAmount: string;
    const percentKey = `payout_percent_q${quarter}`;
    const percentValue = settingsMap.get(percentKey);
    
    if (percentValue) {
      // Calculate from percentage: (square_price * 100) * (percentage / 100)
      const squarePrice = parseFloat(settingsMap.get('square_price') || '50');
      const percentage = parseFloat(percentValue);
      const totalRevenue = squarePrice * 100;
      const calculatedPrize = (totalRevenue * percentage / 100).toFixed(2);
      prizeAmount = calculatedPrize;
    } else {
      // Fallback to fixed amount
      prizeAmount = settingsMap.get(`prize_q${quarter}`) || '250';
    }

    // Create winner record
    await supabase
      .from('quarterly_winners')
      .insert({
        quarter,
        user_id: winnerProfile.id,
        row_score: rowWin,
        col_score: colWin,
        prize_amount: prizeAmount,
      });

    // Send SMS to winner
    const message = `🎉 Winner! Q${quarter} Winner: ${winnerProfile.name} with score ${team1Score}-${team2Score}! Prize: $${prizeAmount}`;

    // Send notifications to all users via Twilio
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')
      .not('phone', 'is', null);

    if (allProfiles && allProfiles.length > 0) {
      const { sendBulkSMS } = await import('@/lib/sms/twilio');
      
      const notifications = allProfiles.map((profile) => ({
        to: profile.phone!,
        message: profile.id === winnerProfile.id
          ? message
          : `Q${quarter} Winner: ${winnerProfile.name} (${team1Score}-${team2Score}) - Prize: $${prizeAmount}`,
      }));

      await sendBulkSMS(notifications);
    }

    return NextResponse.json({
      message: 'Quarterly winner SMS sent',
      winner: winnerProfile.name,
      prize: prizeAmount,
    });
  } catch (error) {
    console.error('Error sending quarterly SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send quarterly SMS' },
      { status: 500 }
    );
  }
}

