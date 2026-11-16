/**
 * Shared e-mail shell in the Wild Yala Safari look (dark brown, amber, cream). Table-based with inline CSS
 * so it renders in every mail client. All dynamic text MUST go through esc().
 */
export const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const COLORS = { bg: '#0c0906', card: '#16100b', line: '#3a2a1c', text: '#f5ede1', muted: '#b9ab98', orange: '#f68f2f', green: '#8fd19a' };

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Segoe UI', Helvetica, Arial, sans-serif";

export function row(label, value, { strong = false } = {}) {
  return `<tr>
    <td style="padding:10px 0;border-top:1px solid ${COLORS.line};font:13px ${SANS};color:${COLORS.muted};width:44%;vertical-align:top">${esc(label)}</td>
    <td style="padding:10px 0;border-top:1px solid ${COLORS.line};font:${strong ? '700 15px' : '14px'} ${SANS};color:${COLORS.text};vertical-align:top">${value}</td>
  </tr>`;
}

export function badge(text, color = COLORS.green) {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;border:1px solid ${color};color:${color};font:700 12px ${SANS};letter-spacing:.08em">${esc(text)}</span>`;
}

/** @param {{title:string, preheader:string, logoUrl:string, bodyHtml:string, footerHtml?:string}} p */
export function layout({ title, preheader, logoUrl, bodyHtml, footerHtml = '' }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${COLORS.bg}"><tr><td align="center" style="padding:28px 14px">
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:${COLORS.card};border:1px solid ${COLORS.line};border-radius:18px">
    <tr><td align="center" style="padding:30px 28px 6px">
      <img src="${esc(logoUrl)}" width="104" alt="Wild Yala Safari" style="display:block;border:0;height:auto;max-width:104px">
    </td></tr>
    <tr><td style="padding:6px 32px 8px">${bodyHtml}</td></tr>
    <tr><td style="padding:18px 32px 30px;border-top:1px solid ${COLORS.line};font:12px ${SANS};color:${COLORS.muted};line-height:1.6" align="center">${footerHtml}</td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

export const heading = (text) => `<h1 style="margin:14px 0 0;font:500 30px/1.15 ${SERIF};color:${COLORS.text};text-align:center">${text}</h1>`;
export const paragraph = (html, center = false) => `<p style="margin:14px 0 0;font:15px/1.65 ${SANS};color:${COLORS.text};${center ? 'text-align:center;' : ''}">${html}</p>`;
