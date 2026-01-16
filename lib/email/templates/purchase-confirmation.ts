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
  const purchaseDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    ${sectionTitle('Thank You for Your Support!', '🏈')}

    ${contentCard(`
      ${paragraph(`Hey ${highlight(firstName)}! 👋`)}

      ${paragraph(`Your purchase is complete! You've secured ${goldText(squareCount.toString())} square${squareCount > 1 ? 's' : ''} in the Michael Williams Memorial Scholarship Super Bowl Pool.`)}

      ${paragraph(`100% of proceeds support the scholarship fund. Thank you for making a difference!`, { muted: true })}
    `)}

    ${contentCard(`
      <p style="color: rgba(255, 255, 255, 0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
        Purchase Receipt
      </p>

      ${statsGrid([
        { label: 'Squares Purchased', value: squareCount.toString() },
        { label: 'Amount Paid', value: `$${totalAmount.toFixed(2)}`, gold: true },
      ])}

      <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin: 16px 0 0 0;">
        ${purchaseDate}
      </p>
    `)}

    ${contentCard(`
      <p style="color: rgba(255, 255, 255, 0.7); font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
        Your Squares:
      </p>
      ${squaresList(squares)}
    `)}

    ${contentCard(`
      <p style="color: rgba(255, 255, 255, 0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        What's Next
      </p>
      ${paragraph(`<strong>1.</strong> Numbers will be randomly assigned once all 100 squares are sold`, { muted: true })}
      ${paragraph(`<strong>2.</strong> You'll receive an email with your official numbers before the game`, { muted: true })}
      ${paragraph(`<strong>3.</strong> Watch the Super Bowl and check if your numbers match the score!`, { muted: true })}
    `)}

    ${goldButton('View Your Squares', `${baseUrl}/my-squares`)}

    ${paragraph(`Questions? Reply to this email and we'll help you out.`, { muted: true, center: true })}
  `;

  return emailWrapper(content);
}
