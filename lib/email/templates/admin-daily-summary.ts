import {
  emailWrapper,
  contentCard,
  adminBanner,
  paragraph,
  highlight,
  goldText,
  goldButton,
  statRow,
  statsGrid,
  divider,
} from '../templates';

interface DailySummaryParams {
  date: string;
  todaySales: {
    squareCount: number;
    revenue: number;
    buyers: Array<{ name: string; squares: number; amount: number }>;
  };
  poolStats: {
    soldCount: number;
    totalRevenue: number;
  };
  adminUrl: string;
}

export function adminDailySummaryEmail(params: DailySummaryParams): string {
  const { date, todaySales, poolStats, adminUrl } = params;
  const percentSold = Math.round((poolStats.soldCount / 100) * 100);

  const buyerRows = todaySales.buyers.length > 0
    ? todaySales.buyers.map(b => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); color: #ffffff; font-size: 14px;">
          ${b.name}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-size: 14px; text-align: center;">
          ${b.squares}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); color: #cda33b; font-size: 14px; text-align: right; font-weight: 600;">
          $${b.amount.toLocaleString()}
        </td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="3" style="padding: 20px; text-align: center; color: rgba(255,255,255,0.5); font-size: 14px;">
          No sales today
        </td>
      </tr>
    `;

  const content = `
    ${adminBanner(`Daily Summary - ${date}`, '📊')}

    ${contentCard(`
      <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0;">
        Today's Activity
      </p>

      ${statsGrid([
        { label: 'Squares Sold', value: todaySales.squareCount.toString() },
        { label: 'Revenue', value: `$${todaySales.revenue.toLocaleString()}`, gold: true },
      ])}

      ${divider()}

      <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">
        Buyers Today
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255,255,255,0.03); border-radius: 8px;">
        <tr style="background-color: rgba(255,255,255,0.05);">
          <th style="padding: 10px 12px; text-align: left; color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 600; text-transform: uppercase;">Name</th>
          <th style="padding: 10px 12px; text-align: center; color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 600; text-transform: uppercase;">Squares</th>
          <th style="padding: 10px 12px; text-align: right; color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 600; text-transform: uppercase;">Amount</th>
        </tr>
        ${buyerRows}
      </table>

      ${divider()}

      <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0;">
        Overall Pool Status
      </p>

      ${statsGrid([
        { label: 'Total Sold', value: `${poolStats.soldCount}/100` },
        { label: 'Percent', value: `${percentSold}%`, gold: percentSold >= 75 },
        { label: 'Total Revenue', value: `$${poolStats.totalRevenue.toLocaleString()}`, gold: true },
        { label: 'Remaining', value: `${100 - poolStats.soldCount}` },
      ])}
    `)}

    ${goldButton('View Admin Dashboard', adminUrl)}
  `;

  return emailWrapper(content);
}
