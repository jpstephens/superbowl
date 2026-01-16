/**
 * Email Template Components
 * Premium dark theme for Super Bowl Pool
 */

// Color palette
const colors = {
  background: '#0f1219',
  headerBg: '#1a1f35',
  cardBg: '#1a1f35',
  cardBgLight: '#232842',
  gold: '#cda33b',
  goldLight: '#d4af37',
  goldDark: '#b8922f',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  success: '#22c55e',
  border: 'rgba(255, 255, 255, 0.08)',
  borderGold: 'rgba(205, 163, 59, 0.3)',
};

/**
 * Base email wrapper with premium header and footer
 */
export function emailWrapper(content: string, options?: { hideFooter?: boolean }): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://superbowl.michaelwilliamsscholarship.com';
  const logoUrl = `${baseUrl}/logo.png`;

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
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 0;">

        <!-- Premium Header -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(180deg, ${colors.headerBg} 0%, ${colors.background} 100%);">
          <tr>
            <td align="center" style="padding: 48px 20px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px;">
                <tr>
                  <td align="center">
                    <!-- Logo Container -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px;">
                      <tr>
                        <td style="background-color: #ffffff; border-radius: 60px; padding: 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.3);">
                          <img src="${logoUrl}" alt="Super Bowl Pool" width="100" height="100" style="display: block; width: 100px; height: 100px; border-radius: 50%;" />
                        </td>
                      </tr>
                    </table>

                    <!-- Title -->
                    <h1 style="color: ${colors.textPrimary}; font-size: 26px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px; text-transform: uppercase;">
                      Super Bowl Pool
                    </h1>

                    <!-- Tagline with gold accent line -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 12px 0;">
                          <div style="width: 60px; height: 3px; background: linear-gradient(90deg, transparent, ${colors.gold}, transparent); margin: 0 auto;"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: ${colors.gold}; font-size: 13px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">
                          Michael Williams Memorial Scholarship
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Main Content Area -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px;">
          <tr>
            <td style="padding: 0 20px;">
              ${content}
            </td>
          </tr>
        </table>

        ${!options?.hideFooter ? `
        <!-- Premium Footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(180deg, ${colors.background} 0%, ${colors.headerBg} 100%);">
          <tr>
            <td align="center" style="padding: 48px 20px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px;">
                <tr>
                  <td align="center">
                    <!-- Divider -->
                    <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, ${colors.borderGold}, transparent); margin: 0 auto 24px;"></div>

                    <p style="color: ${colors.textMuted}; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
                      Good luck on game day!
                    </p>
                    <p style="color: ${colors.textMuted}; font-size: 13px; margin: 0 0 20px 0; line-height: 1.6;">
                      100% of proceeds support the<br>
                      <span style="color: ${colors.gold}; font-weight: 600;">Michael Williams Memorial Scholarship Fund</span>
                    </p>

                    <!-- 501(c)(3) Disclosure -->
                    <p style="color: ${colors.textMuted}; font-size: 11px; margin: 0 0 16px 0; line-height: 1.5;">
                      501(c)(3) Nonprofit Organization · EIN: 88-0683423
                    </p>

                    <!-- Link Row -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 12px;">
                          <a href="${baseUrl}" style="color: ${colors.textMuted}; font-size: 12px; text-decoration: none; border-bottom: 1px solid ${colors.border};">View Online</a>
                        </td>
                        <td style="color: ${colors.border}; font-size: 12px;">|</td>
                        <td style="padding: 0 12px;">
                          <a href="https://michaelwilliamsscholarship.com/about-us/" style="color: ${colors.textMuted}; font-size: 12px; text-decoration: none; border-bottom: 1px solid ${colors.border};">About the Scholarship</a>
                        </td>
                        <td style="color: ${colors.border}; font-size: 12px;">|</td>
                        <td style="padding: 0 12px;">
                          <a href="${baseUrl}/terms" style="color: ${colors.textMuted}; font-size: 12px; text-decoration: none; border-bottom: 1px solid ${colors.border};">Terms</a>
                        </td>
                        <td style="color: ${colors.border}; font-size: 12px;">|</td>
                        <td style="padding: 0 12px;">
                          <a href="${baseUrl}/privacy" style="color: ${colors.textMuted}; font-size: 12px; text-decoration: none; border-bottom: 1px solid ${colors.border};">Privacy</a>
                        </td>
                      </tr>
                    </table>

                    <p style="color: ${colors.textMuted}; font-size: 11px; margin: 24px 0 0 0; opacity: 0.6;">
                      &copy; ${new Date().getFullYear()} Michael Williams Memorial Scholarship Fund
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        ` : ''}

      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Premium content card with subtle gradient border
 */
export function contentCard(content: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, ${colors.borderGold} 0%, ${colors.border} 50%, ${colors.borderGold} 100%); border-radius: 16px; padding: 1px;">
  <tr>
    <td>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="content-card" style="background: linear-gradient(180deg, ${colors.cardBgLight} 0%, ${colors.cardBg} 100%); border-radius: 15px;">
        <tr>
          <td style="padding: 32px;">
            ${content}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
}

/**
 * Premium gold CTA button with hover gradient
 */
export function goldButton(text: string, url: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 32px 0 16px;">
      <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldDark} 100%); color: #1a1f35; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 4px 20px rgba(205, 163, 59, 0.3);">
        ${text} →
      </a>
    </td>
  </tr>
</table>
`;
}

/**
 * Section title with optional emoji
 */
export function sectionTitle(title: string, emoji?: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding-bottom: 24px;">
      ${emoji ? `<p style="font-size: 40px; margin: 0 0 12px 0;">${emoji}</p>` : ''}
      <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
        ${title}
      </h1>
    </td>
  </tr>
</table>
`;
}

/**
 * Paragraph text with options
 */
export function paragraph(text: string, options?: { muted?: boolean; center?: boolean }): string {
  const color = options?.muted ? colors.textMuted : colors.textSecondary;
  const align = options?.center ? 'center' : 'left';
  return `<p style="color: ${color}; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: ${align};">${text}</p>`;
}

/**
 * Highlighted text (bold, primary color)
 */
export function highlight(text: string): string {
  return `<span style="color: ${colors.textPrimary}; font-weight: 700;">${text}</span>`;
}

/**
 * Gold highlighted text
 */
export function goldText(text: string): string {
  return `<span style="color: ${colors.gold}; font-weight: 700;">${text}</span>`;
}

/**
 * Premium stat row
 */
export function statRow(label: string, value: string, options?: { gold?: boolean }): string {
  const valueColor = options?.gold ? colors.gold : colors.textPrimary;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
  <tr>
    <td style="color: ${colors.textMuted}; font-size: 14px; padding: 8px 0; border-bottom: 1px solid ${colors.border};">
      ${label}
    </td>
    <td align="right" style="color: ${valueColor}; font-size: 15px; font-weight: 700; padding: 8px 0; border-bottom: 1px solid ${colors.border};">
      ${value}
    </td>
  </tr>
</table>
`;
}

/**
 * Premium stats grid (2x2 layout)
 */
export function statsGrid(stats: Array<{ label: string; value: string; gold?: boolean }>): string {
  const rows = [];
  for (let i = 0; i < stats.length; i += 2) {
    const stat1 = stats[i];
    const stat2 = stats[i + 1];
    rows.push(`
<tr>
  <td style="padding: 20px; text-align: center; width: 50%; border-right: 1px solid ${colors.border}; ${i < stats.length - 2 ? `border-bottom: 1px solid ${colors.border};` : ''}">
    <p style="color: ${stat1.gold ? colors.gold : colors.textPrimary}; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px;">${stat1.value}</p>
    <p style="color: ${colors.textMuted}; font-size: 11px; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">${stat1.label}</p>
  </td>
  ${stat2 ? `
  <td style="padding: 20px; text-align: center; width: 50%; ${i < stats.length - 2 ? `border-bottom: 1px solid ${colors.border};` : ''}">
    <p style="color: ${stat2.gold ? colors.gold : colors.textPrimary}; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px;">${stat2.value}</p>
    <p style="color: ${colors.textMuted}; font-size: 11px; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">${stat2.label}</p>
  </td>
  ` : '<td style="width: 50%;"></td>'}
</tr>
    `);
  }

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(0,0,0,0.2); border-radius: 12px; margin: 20px 0; border: 1px solid ${colors.border};">
  ${rows.join('')}
</table>
`;
}

/**
 * Divider line
 */
export function divider(): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding: 20px 0;">
      <div style="height: 1px; background: linear-gradient(90deg, transparent, ${colors.borderGold}, transparent);"></div>
    </td>
  </tr>
</table>
`;
}

/**
 * Premium prize breakdown table
 */
export function prizeBreakdown(prizes: { q1: number; q2: number; q3: number; q4: number }): string {
  const total = prizes.q1 + prizes.q2 + prizes.q3 + prizes.q4;

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, rgba(205, 163, 59, 0.15) 0%, rgba(205, 163, 59, 0.05) 100%); border: 1px solid ${colors.borderGold}; border-radius: 12px; margin: 24px 0;">
  <tr>
    <td style="padding: 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 20px;">
            <span style="color: ${colors.gold}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
              Prize Breakdown
            </span>
          </td>
        </tr>
      </table>

      ${statRow('Q1 (End of 1st Quarter)', `$${prizes.q1.toLocaleString()}`, { gold: true })}
      ${statRow('Q2 (Halftime)', `$${prizes.q2.toLocaleString()}`, { gold: true })}
      ${statRow('Q3 (End of 3rd Quarter)', `$${prizes.q3.toLocaleString()}`, { gold: true })}
      ${statRow('Q4 (Final Score)', `$${prizes.q4.toLocaleString()}`, { gold: true })}

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; padding-top: 16px; border-top: 2px solid ${colors.borderGold};">
        <tr>
          <td style="color: ${colors.textPrimary}; font-size: 16px; font-weight: 800;">
            Total Prize Pool
          </td>
          <td align="right" style="color: ${colors.gold}; font-size: 24px; font-weight: 800;">
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
 * Premium squares list
 */
export function squaresList(squares: Array<{ row: number; col: number; rowScore?: number | null; colScore?: number | null }>): string {
  const items = squares.map((sq, idx) => {
    const coords = `Row ${sq.row}, Col ${sq.col}`;
    const numbers = sq.rowScore !== null && sq.rowScore !== undefined
      ? ` (${sq.rowScore}-${sq.colScore})`
      : '';
    const isLast = idx === squares.length - 1;
    return `
<tr>
  <td style="padding: 14px 16px; ${!isLast ? `border-bottom: 1px solid ${colors.border};` : ''} background-color: rgba(255,255,255,0.02);">
    <span style="color: ${colors.textPrimary}; font-size: 15px; font-weight: 600;">${coords}</span>
    ${numbers ? `<span style="color: ${colors.gold}; font-size: 15px; font-weight: 700; margin-left: 8px;">${numbers}</span>` : ''}
  </td>
</tr>
    `;
  }).join('');

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(0,0,0,0.2); border-radius: 10px; margin: 16px 0; border: 1px solid ${colors.border}; overflow: hidden;">
  ${items}
</table>
`;
}

/**
 * Premium winner celebration banner
 */
export function winnerBanner(quarter: string, prize: number): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldDark} 50%, ${colors.gold} 100%); border-radius: 16px; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(205, 163, 59, 0.3);">
  <tr>
    <td style="padding: 40px; text-align: center;">
      <p style="font-size: 56px; margin: 0 0 8px 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🏆</p>
      <p style="color: #1a1f35; font-size: 14px; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;">
        Congratulations
      </p>
      <p style="color: #1a1f35; font-size: 36px; font-weight: 900; margin: 0 0 12px 0; letter-spacing: -1px; text-shadow: 0 1px 2px rgba(255,255,255,0.3);">
        YOU WON!
      </p>
      <p style="color: rgba(26, 31, 53, 0.7); font-size: 15px; margin: 0 0 20px 0; font-weight: 600;">
        ${quarter}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="background-color: rgba(26, 31, 53, 0.15); border-radius: 50px; padding: 12px 32px;">
            <p style="color: #1a1f35; font-size: 42px; font-weight: 900; margin: 0; letter-spacing: -1px;">
              $${prize.toLocaleString()}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
}

/**
 * Premium admin alert banner
 */
export function adminBanner(title: string, emoji: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, ${colors.cardBgLight} 0%, ${colors.cardBg} 100%); border-radius: 16px; border: 2px solid ${colors.gold}; margin-bottom: 24px; box-shadow: 0 4px 24px rgba(205, 163, 59, 0.15);">
  <tr>
    <td style="padding: 28px; text-align: center;">
      <p style="font-size: 40px; margin: 0 0 12px 0;">${emoji}</p>
      <p style="color: ${colors.gold}; font-size: 11px; font-weight: 700; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 2px;">
        Admin Alert
      </p>
      <p style="color: ${colors.textPrimary}; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
        ${title}
      </p>
    </td>
  </tr>
</table>
`;
}

/**
 * Premium milestone celebration banner
 */
export function milestoneBanner(percentage: number): string {
  const isSoldOut = percentage >= 100;
  const emoji = isSoldOut ? '🎊' : '🎯';
  const title = isSoldOut ? 'SOLD OUT!' : `${percentage}% SOLD`;
  const subtitle = isSoldOut ? 'All squares have been purchased!' : 'Pool Milestone Reached';

  if (isSoldOut) {
    return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldDark} 50%, ${colors.gold} 100%); border-radius: 16px; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(205, 163, 59, 0.3);">
  <tr>
    <td style="padding: 40px; text-align: center;">
      <p style="font-size: 56px; margin: 0 0 12px 0;">${emoji}</p>
      <p style="color: #1a1f35; font-size: 36px; font-weight: 900; margin: 0 0 8px 0; letter-spacing: -1px;">
        ${title}
      </p>
      <p style="color: rgba(26, 31, 53, 0.7); font-size: 15px; margin: 0; font-weight: 600;">
        ${subtitle}
      </p>
    </td>
  </tr>
</table>
`;
  }

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, ${colors.cardBgLight} 0%, ${colors.cardBg} 100%); border-radius: 16px; border: 2px solid ${colors.gold}; margin-bottom: 24px;">
  <tr>
    <td style="padding: 36px; text-align: center;">
      <p style="font-size: 48px; margin: 0 0 12px 0;">${emoji}</p>
      <p style="color: ${colors.textMuted}; font-size: 11px; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;">
        Milestone Reached
      </p>
      <p style="color: ${colors.gold}; font-size: 42px; font-weight: 900; margin: 0; letter-spacing: -1px;">
        ${title}
      </p>
    </td>
  </tr>
</table>
`;
}
