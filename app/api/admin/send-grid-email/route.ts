import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import {
  emailWrapper,
  contentCard,
  sectionTitle,
  paragraph,
  highlight,
  goldButton,
  prizeBreakdown,
  squaresList,
} from '@/lib/email/templates';

export async function POST() {
  try {
    const supabase = await createClient();

    // Verify admin user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Load prize settings dynamically
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['payout_q1', 'payout_q2', 'payout_q3', 'payout_q4']);

    const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || []);
    const prizes = {
      q1: parseInt(settingsMap.get('payout_q1') || '1000'),
      q2: parseInt(settingsMap.get('payout_q2') || '1000'),
      q3: parseInt(settingsMap.get('payout_q3') || '1000'),
      q4: parseInt(settingsMap.get('payout_q4') || '2000'),
    };

    // Get participants with their squares
    const { data: participantsWithSquares, error: participantsError } = await supabase
      .from('profiles')
      .select(`
        id, email, name,
        grid_squares!grid_squares_user_id_fkey (
          row_number, col_number, row_score, col_score
        )
      `)
      .not('email', 'is', null);

    if (participantsError) {
      throw participantsError;
    }

    // Filter to only those who have squares
    const participants = participantsWithSquares?.filter(
      p => p.grid_squares && p.grid_squares.length > 0
    ) || [];

    if (participants.length === 0) {
      return NextResponse.json({ error: 'No participants with squares found' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://superbowlpool.com';
    const pdfUrl = `${baseUrl}/api/grid/pdf`;

    // Fetch the PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to generate PDF');
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    // Send personalized email to each participant
    const emailPromises = participants.map(async (participant) => {
      if (!participant.email) return null;

      const firstName = participant.name?.split(' ')[0] || 'Participant';
      const userSquares = (participant.grid_squares as Array<{
        row_number: number;
        col_number: number;
        row_score: number | null;
        col_score: number | null;
      }>).map(sq => ({
        row: sq.row_number,
        col: sq.col_number,
        rowScore: sq.row_score,
        colScore: sq.col_score,
      }));

      const emailHtml = emailWrapper(`
        ${sectionTitle('The Numbers Are In!', '🏈')}

        ${contentCard(`
          ${paragraph(`Hey ${highlight(firstName)}! 👋`)}

          ${paragraph(`Great news – the random numbers have been assigned to the Super Bowl Pool grid! Your squares now have their official numbers for the game.`)}

          <p style="color: rgba(255, 255, 255, 0.6); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 12px 0;">
            Your Squares
          </p>
          ${squaresList(userSquares)}

          ${paragraph(`<strong>Two ways to follow along:</strong>`)}
          ${paragraph(`📱 <strong>Online:</strong> Follow live at the website during the game`, { muted: true })}
          ${paragraph(`🖨️ <strong>Print:</strong> Download the attached PDF to mark your winners!`, { muted: true })}
        `)}

        ${prizeBreakdown(prizes)}

        ${goldButton('View Your Squares Online', baseUrl)}
      `);

      try {
        const result = await sendEmail({
          to: participant.email,
          subject: '🏈 Your Super Bowl Pool Numbers Are Ready!',
          html: emailHtml,
          from: 'pool',
          attachments: [
            {
              filename: 'super-bowl-pool-grid.pdf',
              content: pdfBase64,
            },
          ],
        });
        return { email: participant.email, success: result.success };
      } catch (error) {
        console.error(`Failed to send email to ${participant.email}:`, error);
        return { email: participant.email, success: false, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r?.success).length;
    const failed = results.filter(r => r && !r.success).length;

    return NextResponse.json({
      message: `Emails sent successfully`,
      sent: successful,
      failed: failed,
      total: participants.length,
    });
  } catch (error) {
    console.error('Error sending grid emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}
