import {
  emailWrapper,
  contentCard,
  paragraph,
  highlight,
  goldButton,
  winnerBanner,
  divider,
} from '../templates';

interface QuarterWinnerParams {
  name: string;
  quarter: 1 | 2 | 3 | 4;
  prize: number;
  score: { afc: number; nfc: number; afcTeam?: string; nfcTeam?: string };
  square: { row: number; col: number; rowScore: number; colScore: number };
  baseUrl: string;
}

const QUARTER_LABELS: Record<number, string> = {
  1: 'Q1 (End of 1st Quarter)',
  2: 'Q2 (Halftime)',
  3: 'Q3 (End of 3rd Quarter)',
  4: 'Q4 (Final Score)',
};

export function quarterWinnerEmail(params: QuarterWinnerParams): string {
  const { name, quarter, prize, score, square, baseUrl } = params;
  const firstName = name.split(' ')[0];
  const quarterLabel = QUARTER_LABELS[quarter];

  const content = `
    ${winnerBanner(quarterLabel, prize)}

    ${contentCard(`
      ${paragraph(`Congratulations, ${highlight(firstName)}! 🎉`)}

      ${paragraph(`Your square hit the winning numbers for ${highlight(quarterLabel)}!`)}

      ${divider()}

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0;">
        <tr>
          <td style="color: rgba(255, 255, 255, 0.6); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">
            Final Score
          </td>
        </tr>
        <tr>
          <td style="color: #ffffff; font-size: 24px; font-weight: 700;">
            ${score.afcTeam || 'AFC'} ${score.afc} - ${score.nfc} ${score.nfcTeam || 'NFC'}
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0;">
        <tr>
          <td style="color: rgba(255, 255, 255, 0.6); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">
            Your Winning Square
          </td>
        </tr>
        <tr>
          <td>
            <span style="color: #ffffff; font-size: 16px;">Row ${square.row}, Col ${square.col}</span>
            <span style="color: #cda33b; font-size: 16px; font-weight: 700; margin-left: 8px;">(${square.rowScore}-${square.colScore})</span>
          </td>
        </tr>
      </table>

      ${divider()}

      ${paragraph(`We'll be in touch about prize distribution. Keep watching - you might win again!`)}
    `)}

    ${goldButton('View Full Results', baseUrl)}
  `;

  return emailWrapper(content);
}
