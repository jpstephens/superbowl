import {
  emailWrapper,
  contentCard,
  sectionTitle,
  paragraph,
  highlight,
  goldText,
  goldButton,
  squaresList,
  statsGrid,
} from '../templates';

interface PurchaseConfirmationParams {
  name: string;
  squareCount: number;
  totalAmount: number;
  squares: Array<{ row: number; col: number }>;
  baseUrl: string;
}

export function purchaseConfirmationEmail(params: PurchaseConfirmationParams): string {
  const { name, squareCount, totalAmount, squares, baseUrl } = params;
  const firstName = name.split(' ')[0];

  const content = `
    ${sectionTitle('Thanks for Joining!', '🏈')}

    ${contentCard(`
      ${paragraph(`Hey ${highlight(firstName)}! 👋`)}

      ${paragraph(`Your purchase is complete! You've secured ${goldText(squareCount.toString())} square${squareCount > 1 ? 's' : ''} in the Super Bowl Pool.`)}

      ${statsGrid([
        { label: 'Squares', value: squareCount.toString() },
        { label: 'Total Paid', value: `$${totalAmount.toLocaleString()}`, gold: true },
      ])}

      <p style="color: rgba(255, 255, 255, 0.7); font-size: 14px; font-weight: 600; margin: 20px 0 12px 0;">
        Your Squares:
      </p>
      ${squaresList(squares)}

      ${paragraph(`<strong>What's Next:</strong> Numbers will be randomly assigned before the game. You'll receive another email when your squares get their official numbers!`, { muted: true })}
    `)}

    ${goldButton('View Your Squares', baseUrl)}

    ${paragraph(`Questions? Reply to this email and we'll help you out.`, { muted: true, center: true })}
  `;

  return emailWrapper(content);
}
