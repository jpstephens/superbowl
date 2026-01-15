import { NextResponse } from 'next/server';
import { purchaseConfirmationEmail } from '@/lib/email/templates/purchase-confirmation';
import { quarterWinnerEmail } from '@/lib/email/templates/quarter-winner';
import { adminPurchaseAlertEmail } from '@/lib/email/templates/admin-purchase-alert';
import { adminDailySummaryEmail } from '@/lib/email/templates/admin-daily-summary';
import { adminMilestoneEmail } from '@/lib/email/templates/admin-milestone';

/**
 * Email Preview Route
 * Usage: /api/email/preview?template=purchase-confirmation
 *
 * Available templates:
 * - purchase-confirmation
 * - quarter-winner
 * - admin-purchase-alert
 * - admin-daily-summary
 * - admin-milestone-25
 * - admin-milestone-50
 * - admin-milestone-75
 * - admin-milestone-100
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const template = searchParams.get('template') || 'purchase-confirmation';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://superbowlpool.com';

  let html = '';

  switch (template) {
    case 'purchase-confirmation':
      html = purchaseConfirmationEmail({
        name: 'John Smith',
        squareCount: 3,
        totalAmount: 150,
        squares: [
          { row: 2, col: 5 },
          { row: 4, col: 8 },
          { row: 7, col: 1 },
        ],
        baseUrl,
      });
      break;

    case 'quarter-winner':
      html = quarterWinnerEmail({
        name: 'Jane Doe',
        quarter: 2,
        prize: 600,
        score: { afc: 14, nfc: 10, afcTeam: 'Chiefs', nfcTeam: 'Eagles' },
        square: { row: 3, col: 4, rowScore: 4, colScore: 0 },
        baseUrl,
      });
      break;

    case 'admin-purchase-alert':
      html = adminPurchaseAlertEmail({
        buyerName: 'John Smith',
        buyerEmail: 'john@example.com',
        squareCount: 3,
        amount: 150,
        poolStats: { soldCount: 42, totalRevenue: 2100 },
        adminUrl: `${baseUrl}/admin/dashboard`,
      });
      break;

    case 'admin-daily-summary':
      html = adminDailySummaryEmail({
        date: 'Wednesday, January 15, 2026',
        todaySales: {
          squareCount: 8,
          revenue: 400,
          buyers: [
            { name: 'John Smith', squares: 3, amount: 150 },
            { name: 'Jane Doe', squares: 5, amount: 250 },
          ],
        },
        poolStats: { soldCount: 65, totalRevenue: 3250 },
        adminUrl: `${baseUrl}/admin/dashboard`,
      });
      break;

    case 'admin-milestone-25':
      html = adminMilestoneEmail({
        milestone: 25,
        poolStats: { soldCount: 25, totalRevenue: 1250, squarePrice: 50 },
        adminUrl: `${baseUrl}/admin/dashboard`,
      });
      break;

    case 'admin-milestone-50':
      html = adminMilestoneEmail({
        milestone: 50,
        poolStats: { soldCount: 50, totalRevenue: 2500, squarePrice: 50 },
        adminUrl: `${baseUrl}/admin/dashboard`,
      });
      break;

    case 'admin-milestone-75':
      html = adminMilestoneEmail({
        milestone: 75,
        poolStats: { soldCount: 75, totalRevenue: 3750, squarePrice: 50 },
        adminUrl: `${baseUrl}/admin/dashboard`,
      });
      break;

    case 'admin-milestone-100':
      html = adminMilestoneEmail({
        milestone: 100,
        poolStats: { soldCount: 100, totalRevenue: 5000, squarePrice: 50 },
        adminUrl: `${baseUrl}/admin/dashboard`,
      });
      break;

    default:
      return NextResponse.json({
        error: 'Unknown template',
        available: [
          'purchase-confirmation',
          'quarter-winner',
          'admin-purchase-alert',
          'admin-daily-summary',
          'admin-milestone-25',
          'admin-milestone-50',
          'admin-milestone-75',
          'admin-milestone-100',
        ]
      }, { status: 400 });
  }

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
