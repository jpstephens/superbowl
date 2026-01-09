import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST() {
  try {
    // Initialize Resend inside handler to avoid build-time errors
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }
    const resend = new Resend(apiKey);

    const supabase = await createClient();

    // Verify admin user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all participants with email addresses
    const { data: participants, error: participantsError } = await supabase
      .from('profiles')
      .select('email, name')
      .not('email', 'is', null);

    if (participantsError) {
      throw participantsError;
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ error: 'No participants found' }, { status: 400 });
    }

    // Generate PDF URL (the client will need to fetch this)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://superbowlpool.com';
    const pdfUrl = `${baseUrl}/api/grid/pdf`;

    // Fetch the PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to generate PDF');
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    // Send email to each participant
    const emailPromises = participants.map(async (participant) => {
      if (!participant.email) return null;

      const firstName = participant.name?.split(' ')[0] || 'Participant';

      try {
        await resend.emails.send({
          from: 'Super Bowl Pool <pool@superbowlpool.com>',
          to: participant.email,
          subject: '🏈 Your Super Bowl Pool Numbers Are Ready!',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #232842; font-size: 28px; margin: 0 0 10px 0;">🏈 The Numbers Are In!</h1>
                  <p style="color: #666666; font-size: 16px; margin: 0;">Super Bowl Pool - Michael Williams Memorial Scholarship</p>
                </div>

                <!-- Main Content -->
                <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                  <p style="color: #232842; font-size: 18px; margin: 0 0 20px 0;">
                    Hey ${firstName}! 👋
                  </p>
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Great news – the random numbers have been assigned to the Super Bowl Pool grid!
                    Your squares now have their official numbers for the game.
                  </p>
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                    <strong>Two ways to follow along:</strong>
                  </p>
                  <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin: 15px 0; padding-left: 20px;">
                    <li>📱 <strong>Online:</strong> Follow live at the website during the game</li>
                    <li>🖨️ <strong>Print:</strong> Download the attached PDF to mark your winners!</li>
                  </ul>
                </div>

                <!-- Prize Breakdown -->
                <div style="background-color: #232842; border-radius: 12px; padding: 25px; margin-bottom: 30px; color: white;">
                  <h2 style="color: #d4af37; font-size: 18px; margin: 0 0 15px 0; text-align: center;">💰 Prize Breakdown</h2>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Q1 (End of 1st Quarter)</span>
                    <span style="color: #d4af37; font-weight: bold;">$350</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Q2 (Halftime)</span>
                    <span style="color: #d4af37; font-weight: bold;">$600</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Q3 (End of 3rd Quarter)</span>
                    <span style="color: #d4af37; font-weight: bold;">$350</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <span>Q4 (Final Score)</span>
                    <span style="color: #d4af37; font-weight: bold;">$1,200</span>
                  </div>
                  <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px; display: flex; justify-content: space-between;">
                    <span style="font-weight: bold;">Total Prize Pool</span>
                    <span style="color: #d4af37; font-weight: bold; font-size: 20px;">$2,500</span>
                  </div>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${baseUrl}" style="display: inline-block; background-color: #d4af37; color: #232842; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    View Your Squares Online →
                  </a>
                </div>

                <!-- Footer -->
                <div style="text-align: center; color: #9ca3af; font-size: 14px;">
                  <p style="margin: 0 0 10px 0;">Good luck! 🍀</p>
                  <p style="margin: 0;">
                    100% of proceeds support the<br>
                    <strong style="color: #d4af37;">Michael Williams Memorial Scholarship</strong>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
          attachments: [
            {
              filename: 'super-bowl-pool-grid.pdf',
              content: pdfBase64,
            },
          ],
        });
        return { email: participant.email, success: true };
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
