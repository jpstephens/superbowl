import {
  emailWrapper,
  contentCard,
  adminBanner,
  paragraph,
  highlight,
  goldText,
  goldButton,
  statRow,
  divider,
} from '../templates';

interface AdminPurchaseAlertParams {
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  displayName?: string | null; // Custom display name for squares, if different from billing
  squareCount: number;
  amount: number;
  poolStats: {
    soldCount: number;
    totalRevenue: number;
  };
  adminUrl: string;
}

export function adminPurchaseAlertEmail(params: AdminPurchaseAlertParams): string {
  const { buyerName, buyerEmail, buyerPhone, displayName, squareCount, amount, poolStats, adminUrl } = params;
  const percentSold = Math.round((poolStats.soldCount / 100) * 100);

  // Show display name in header if custom, otherwise show buyer name
  const headerName = displayName || buyerName;

  const content = `
    ${adminBanner('New Purchase!', '💰')}

    ${contentCard(`
      ${paragraph(`${highlight(headerName)} just bought ${goldText(squareCount.toString())} square${squareCount > 1 ? 's' : ''}.`)}

      ${divider()}

      <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">
        Purchase Details
      </p>

      ${statRow('Buyer', buyerName)}
      ${buyerPhone ? statRow('Phone', buyerPhone) : ''}
      ${statRow('Email', buyerEmail)}
      ${displayName ? statRow('Display Name', displayName) : ''}
      ${statRow('Squares', squareCount.toString())}
      ${statRow('Amount', `$${amount.toLocaleString()}`, { gold: true })}

      ${divider()}

      <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">
        Pool Status
      </p>

      ${statRow('Squares Sold', `${poolStats.soldCount}/100 (${percentSold}%)`)}
      ${statRow('Total Revenue', `$${poolStats.totalRevenue.toLocaleString()}`, { gold: true })}
    `)}

    ${goldButton('View in Admin', adminUrl)}
  `;

  return emailWrapper(content);
}
