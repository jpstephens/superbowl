import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendToAdmins } from '@/lib/email/send';
import { adminDailySummaryEmail } from '@/lib/email/templates/admin-daily-summary';

/**
 * Daily summary cron job
 * Sends daily sales summary to admins
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-summary",
 *     "schedule": "0 23 * * *"
 *   }]
 * }
 *
 * Or call manually: GET /api/cron/daily-summary?secret=YOUR_CRON_SECRET
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (for manual calls or Vercel cron)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    // Allow if called from Vercel cron (has special header) or with correct secret
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const hasValidSecret = cronSecret && secret === cronSecret;

    if (!isVercelCron && !hasValidSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get today's date range (in UTC)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Get today's payments with buyer info
    const { data: todaysPayments } = await supabase
      .from('payments')
      .select(`
        id, amount, created_at,
        profiles:user_id (name)
      `)
      .eq('status', 'completed')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    // Calculate today's stats
    const todaySquaresSold = todaysPayments?.length || 0;
    const todayRevenue = todaysPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    // Get buyer details
    const buyers = todaysPayments?.map(p => {
      // profiles can be an array or single object depending on Supabase join
      const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return {
        name: (profile as { name: string } | null)?.name || 'Unknown',
        squares: 1, // Each payment is typically for multiple squares
        amount: Number(p.amount || 0),
      };
    }) || [];

    // Get overall pool stats
    const { count: totalSold } = await supabase
      .from('grid_squares')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid');

    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    const totalRevenue = allPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    // Format date for email
    const dateStr = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://superbowlpool.com';

    // Build and send email
    const emailHtml = adminDailySummaryEmail({
      date: dateStr,
      todaySales: {
        squareCount: todaySquaresSold,
        revenue: todayRevenue,
        buyers,
      },
      poolStats: {
        soldCount: totalSold || 0,
        totalRevenue,
      },
      adminUrl: `${baseUrl}/admin/dashboard`,
    });

    await sendToAdmins(`📊 Daily Pool Summary - ${dateStr}`, emailHtml);

    return NextResponse.json({
      success: true,
      message: 'Daily summary sent',
      stats: {
        todaySquares: todaySquaresSold,
        todayRevenue,
        totalSold,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Error sending daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to send daily summary' },
      { status: 500 }
    );
  }
}
