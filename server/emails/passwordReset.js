import { BRAND, CONTACT } from '../../src/data/content.js';
import { esc, layout, heading, paragraph, COLORS } from './layout.js';

export function passwordResetEmail({ name, resetUrl, minutes, siteUrl }) {
  const subject = `Reset your ${BRAND.name} password`;
  const first = (name || '').split(/\s+/)[0] || 'there';
  const body = `
    <p style="margin:6px 0 0;text-align:center;font:600 11px 'Segoe UI',Arial,sans-serif;letter-spacing:.24em;color:${COLORS.orange}">PASSWORD RESET</p>
    ${heading('Reset your password')}
    ${paragraph(`Hello ${esc(first)}, we received a request to reset the password for your ${esc(BRAND.name)} account. This link works for ${esc(minutes)} minutes and can be used once.`, true)}
    <p style="margin:22px 0 4px;text-align:center"><a href="${esc(resetUrl)}" style="display:inline-block;padding:12px 26px;border-radius:999px;background:${COLORS.orange};color:#1c1007;font:700 13px 'Segoe UI',Arial,sans-serif;text-decoration:none;letter-spacing:.06em">CHOOSE A NEW PASSWORD</a></p>
    ${paragraph(`If the button does not work, paste this address into your browser:<br><span style="word-break:break-all;color:${COLORS.muted}">${esc(resetUrl)}</span>`, true)}
    ${paragraph('If you did not ask for this, you can safely ignore this email — your password will not change.', true)}`;
  const html = layout({
    title: subject,
    preheader: 'Use this link to choose a new password.',
    logoUrl: `${siteUrl}/brand/logo.png`,
    bodyHtml: body,
    footerHtml: `${esc(BRAND.name)} — ${esc(CONTACT.email)}`,
  });
  const text = `Hello ${first},\n\nWe received a request to reset your ${BRAND.name} password. Open this link within ${minutes} minutes (it works once):\n\n${resetUrl}\n\nIf you did not ask for this, ignore this email — your password will not change.\n`;
  return { subject, html, text };
}
