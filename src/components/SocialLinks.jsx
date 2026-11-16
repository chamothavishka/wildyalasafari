import { socialLinks } from '../data/content.js';

/** Recognisable social glyphs (24×24). */
const GLYPHS = {
  whatsapp: (
    <path
      fill="currentColor"
      d="M12 2.2a9.7 9.7 0 0 0-8.3 14.7L2.3 21.8l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2z"
    />
  ),
  facebook: (
    <path fill="currentColor" d="M13.6 21.5v-8h2.7l.4-3.2h-3.1V8.3c0-.9.3-1.5 1.6-1.5h1.6V4a22 22 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.3H7.7v3.2h2.7v8h3.2z" />
  ),
  instagram: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </g>
  ),
  tiktok: (
    <path
      fill="currentColor"
      d="M16.6 3c.3 2.2 1.7 3.7 3.9 3.9v3.1a7 7 0 0 1-3.9-1.2v6.1a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.2a2.5 2.5 0 1 0 1.6 2.3V3h3.1z"
    />
  ),
};

/**
 * WhatsApp, Facebook, Instagram and TikTok icons. Links come from CONTACT in
 * src/data/content.js; an account without a URL is shown but not clickable.
 */
export default function SocialLinks({ className = '', onlyLinked = false, skip = [] }) {
  const items = socialLinks().filter((s) => (!onlyLinked || s.href) && !skip.includes(s.id));
  if (!items.length) return null;
  return (
    <ul className={`social ${className}`} aria-label="Social media">
      {items.map((s) => (
        <li key={s.id}>
          {s.href ? (
            <a className="social__link" href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                {GLYPHS[s.id]}
              </svg>
            </a>
          ) : (
            <span className="social__link is-unlinked" role="img" aria-label={`${s.label} (link coming soon)`} title={`${s.label} — link coming soon`}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                {GLYPHS[s.id]}
              </svg>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
