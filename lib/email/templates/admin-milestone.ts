import {
  emailWrapper,
  contentCard,
  milestoneBanner,
  paragraph,
  goldButton,
  statsGrid,
} from '../templates';

interface AdminMilestoneParams {
  milestone: 25 | 50 | 75 | 100;
  poolStats: {
    soldCount: number;
    totalRevenue: number;
    squarePrice: number;
  };
  adminUrl: string;
}

const MILESTONE_MESSAGES: Record<number, string> = {
  25: "You're a quarter of the way there! The pool is gaining momentum.",
  50: "Halfway there! The pool is half sold. Great progress!",
  75: "Almost there! Just 25 squares left to sell.",
  100: "The pool is completely SOLD OUT! All 100 squares have been purchased. Time to get ready for game day!",
};

export function adminMilestoneEmail(params: AdminMilestoneParams): string {
  const { milestone, poolStats, adminUrl } = params;
  const isSoldOut = milestone >= 100;

  const content = `
    ${milestoneBanner(milestone)}

    ${contentCard(`
      ${paragraph(MILESTONE_MESSAGES[milestone])}

      ${statsGrid([
        { label: 'Squares Sold', value: `${poolStats.soldCount}/100` },
        { label: 'Total Revenue', value: `$${poolStats.totalRevenue.toLocaleString()}`, gold: true },
        { label: 'Remaining', value: isSoldOut ? '0' : `${100 - poolStats.soldCount}` },
        { label: 'Price/Square', value: `$${poolStats.squarePrice}` },
      ])}

      ${isSoldOut ? `
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; margin-top: 20px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p style="color: #22c55e; font-size: 14px; margin: 0;">
                ✅ All squares are sold! Ready for the big game.
              </p>
            </td>
          </tr>
        </table>
      ` : ''}
    `)}

    ${goldButton('View Admin Dashboard', adminUrl)}
  `;

  return emailWrapper(content);
}
