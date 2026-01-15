/**
 * Email Template Components
 * Dark theme matching the Super Bowl Pool site
 */

// Color palette
const colors = {
  background: '#232842',
  cardBg: '#1a1f35',
  gold: '#cda33b',
  goldLight: '#d4af37',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  success: '#22c55e',
  border: 'rgba(255, 255, 255, 0.1)',
};

/**
 * Base email wrapper with header and footer
 */
export function emailWrapper(content: string, options?: { hideFooter?: boolean }): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://superbowlpool.com';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Super Bowl Pool</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .content-card { background-color: #1a1f35 !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 32px; padding-bottom: 8px;">
                    🏈
                  </td>
                </tr>
                <tr>
                  <td style="color: ${colors.textPrimary}; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
                    SUPER BOWL POOL
                  </td>
                </tr>
                <tr>
                  <td style="color: ${colors.gold}; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; padding-top: 4px;">
                    Michael Williams Memorial Scholarship
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td>
              ${content}
            </td>
          </tr>

          ${!options?.hideFooter ? `
          <!-- Footer -->
          <tr>
            <td style="padding-top: 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid ${colors.border}; padding-top: 24px;">
                    <p style="color: ${colors.textMuted}; font-size: 14px; margin: 0 0 8px 0;">
                      Good luck! 🍀
                    </p>
                    <p style="color: ${colors.textMuted}; font-size: 13px; margin: 0 0 16px 0;">
                      100% of proceeds support the<br>
                      <span style="color: ${colors.gold}; font-weight: 600;">Michael Williams Memorial Scholarship</span>
                    </p>
                    <p style="color: ${colors.textMuted}; font-size: 12px; margin: 0;">
                      <a href="${baseUrl}" style="color: ${colors.textMuted}; text-decoration: underline;">View Online</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Content card with darker background
 */
export function contentCard(content: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="content-card" style="background-color: ${colors.cardBg}; border-radius: 12px; border: 1px solid ${colors.border};">
  <tr>
    <td style="padding: 28px;">
      ${content}
    </td>
  </tr>
</table>
`;
}

/**
 * Gold CTA button
 */
export function goldButton(text: string, url: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 24px 0;">
      <a href="${url}" style="display: inline-block; background-color: ${colors.gold}; color: #232842; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: -0.3px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
`;
}

/**
 * Section title
 */
export function sectionTitle(title: string, emoji?: string): string {
  return `
<h1 style="color: ${colors.textPrimary}; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; text-align: center; letter-spacing: -0.5px;">
  ${emoji ? `${emoji} ` : ''}${title}
</h1>
`;
}

/**
 * Paragraph text
 */
export function paragraph(text: string, options?: { muted?: boolean; center?: boolean }): string {
  const color = options?.muted ? colors.textMuted : colors.textSecondary;
  const align = options?.center ? 'center' : 'left';
  return `<p style="color: ${color}; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; text-align: ${align};">${text}</p>`;
}

/**
 * Highlighted text (bold, primary color)
 */
export function highlight(text: string): string {
  return `<span style="color: ${colors.textPrimary}; font-weight: 600;">${text}</span>`;
}

/**
 * Gold highlighted text
 */
export function goldText(text: string): string {
  return `<span style="color: ${colors.gold}; font-weight: 600;">${text}</span>`;
}

/**
 * Stat row (label: value)
 */
export function statRow(label: string, value: string, options?: { gold?: boolean }): string {
  const valueColor = options?.gold ? colors.gold : colors.textPrimary;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
  <tr>
    <td style="color: ${colors.textSecondary}; font-size: 14px;">
      ${label}
    </td>
    <td align="right" style="color: ${valueColor}; font-size: 14px; font-weight: 600;">
      ${value}
    </td>
  </tr>
</table>
`;
}

/**
 * Stats grid (2x2 layout)
 */
export function statsGrid(stats: Array<{ label: string; value: string; gold?: boolean }>): string {
  const rows = [];
  for (let i = 0; i < stats.length; i += 2) {
    const stat1 = stats[i];
    const stat2 = stats[i + 1];
    rows.push(`
<tr>
  <td style="padding: 12px; text-align: center; width: 50%;">
    <p style="color: ${stat1.gold ? colors.gold : colors.textPrimary}; font-size: 24px; font-weight: 700; margin: 0;">${stat1.value}</p>
    <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">${stat1.label}</p>
  </td>
  ${stat2 ? `
  <td style="padding: 12px; text-align: center; width: 50%;">
    <p style="color: ${stat2.gold ? colors.gold : colors.textPrimary}; font-size: 24px; font-weight: 700; margin: 0;">${stat2.value}</p>
    <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">${stat2.label}</p>
  </td>
  ` : '<td></td>'}
</tr>
    `);
  }

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255,255,255,0.03); border-radius: 8px; margin: 16px 0;">
  ${rows.join('')}
</table>
`;
}

/**
 * Divider line
 */
export function divider(): string {
  return `<hr style="border: none; border-top: 1px solid ${colors.border}; margin: 20px 0;">`;
}

/**
 * Prize breakdown table
 */
export function prizeBreakdown(prizes: { q1: number; q2: number; q3: number; q4: number }): string {
  const total = prizes.q1 + prizes.q2 + prizes.q3 + prizes.q4;

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(205, 163, 59, 0.1); border: 1px solid rgba(205, 163, 59, 0.2); border-radius: 8px; margin: 16px 0;">
  <tr>
    <td style="padding: 20px;">
      <p style="color: ${colors.gold}; font-size: 14px; font-weight: 700; margin: 0 0 16px 0; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
        💰 Prize Breakdown
      </p>
      ${statRow('Q1 (End of 1st Quarter)', `$${prizes.q1.toLocaleString()}`, { gold: true })}
      ${statRow('Q2 (Halftime)', `$${prizes.q2.toLocaleString()}`, { gold: true })}
      ${statRow('Q3 (End of 3rd Quarter)', `$${prizes.q3.toLocaleString()}`, { gold: true })}
      ${statRow('Q4 (Final Score)', `$${prizes.q4.toLocaleString()}`, { gold: true })}
      <hr style="border: none; border-top: 1px solid rgba(205, 163, 59, 0.3); margin: 12px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="color: ${colors.textPrimary}; font-size: 14px; font-weight: 700;">
            Total Prize Pool
          </td>
          <td align="right" style="color: ${colors.gold}; font-size: 18px; font-weight: 700;">
            $${total.toLocaleString()}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
}

/**
 * Squares list
 */
export function squaresList(squares: Array<{ row: number; col: number; rowScore?: number | null; colScore?: number | null }>): string {
  const items = squares.map(sq => {
    const coords = `Row ${sq.row}, Col ${sq.col}`;
    const numbers = sq.rowScore !== null && sq.rowScore !== undefined
      ? ` (${sq.rowScore}-${sq.colScore})`
      : '';
    return `
<tr>
  <td style="padding: 8px 12px; border-bottom: 1px solid ${colors.border};">
    <span style="color: ${colors.textPrimary}; font-size: 14px;">${coords}</span>
    ${numbers ? `<span style="color: ${colors.gold}; font-size: 14px; font-weight: 600;">${numbers}</span>` : ''}
  </td>
</tr>
    `;
  }).join('');

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255,255,255,0.03); border-radius: 8px; margin: 12px 0;">
  ${items}
</table>
`;
}

/**
 * Winner celebration banner
 */
export function winnerBanner(quarter: string, prize: number): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, ${colors.gold} 0%, #b8922f 100%); border-radius: 12px; margin-bottom: 24px;">
  <tr>
    <td style="padding: 32px; text-align: center;">
      <p style="font-size: 48px; margin: 0 0 8px 0;">🎉</p>
      <p style="color: #232842; font-size: 28px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">
        YOU WON!
      </p>
      <p style="color: rgba(35, 40, 66, 0.8); font-size: 16px; margin: 0 0 16px 0;">
        ${quarter} Winner
      </p>
      <p style="color: #232842; font-size: 36px; font-weight: 800; margin: 0;">
        $${prize.toLocaleString()}
      </p>
    </td>
  </tr>
</table>
`;
}

/**
 * Admin alert banner
 */
export function adminBanner(title: string, emoji: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.cardBg}; border-radius: 12px; border: 2px solid ${colors.gold}; margin-bottom: 24px;">
  <tr>
    <td style="padding: 20px; text-align: center;">
      <p style="font-size: 32px; margin: 0 0 8px 0;">${emoji}</p>
      <p style="color: ${colors.gold}; font-size: 18px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">
        ${title}
      </p>
    </td>
  </tr>
</table>
`;
}

/**
 * Milestone celebration
 */
export function milestoneBanner(percentage: number): string {
  const isSoldOut = percentage >= 100;
  const emoji = isSoldOut ? '🎊' : '🎯';
  const title = isSoldOut ? 'SOLD OUT!' : `${percentage}% SOLD`;

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: ${isSoldOut ? `linear-gradient(135deg, ${colors.gold} 0%, #b8922f 100%)` : colors.cardBg}; border-radius: 12px; ${isSoldOut ? '' : `border: 2px solid ${colors.gold};`} margin-bottom: 24px;">
  <tr>
    <td style="padding: 32px; text-align: center;">
      <p style="font-size: 48px; margin: 0 0 8px 0;">${emoji}</p>
      <p style="color: ${isSoldOut ? '#232842' : colors.gold}; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
        ${title}
      </p>
    </td>
  </tr>
</table>
`;
}
