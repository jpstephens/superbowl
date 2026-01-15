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
  squareCount: number;
  amount: number;
  poolStats: {
    soldCount: number;
    totalRevenue: number;
  };
  adminUrl: string;
}

export function adminPurchaseAlertEmail(params: AdminPurchaseAlertParams): string {
  const { buyerName, buyerEmail, squareCount, amount, poolStats, adminUrl } = params;
  const percentSold = Math.round((poolStats.soldCount / 100) * 100);

  const content = `
    ${adminBanner('New Purchase!', '💰')}

    ${contentCard(`
      ${paragraph(`${highlight(buyerName)} just bought ${goldText(squareCount.toString())} square${squareCount > 1 ? 's' : ''}.`)}

      ${divider()}

      <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">
        Purchase Details
      </p>

      ${statRow('Buyer', buyerName)}
      ${statRow('Email', buyerEmail)}
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
