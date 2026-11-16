/** Lightweight inline icon set (stroke icons, inherit currentColor). */
const PATHS = {
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  login: (
    <>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5M15 12H3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  sunrise: (
    <>
      <path d="M12 3v5M8.5 6.5 12 3l3.5 3.5" />
      <path d="M4.2 13.2 5.6 14.6M18.4 14.6l1.4-1.4M2 19h20M6 19a6 6 0 0 1 12 0" />
    </>
  ),
  sunset: (
    <>
      <path d="M12 8V3M8.5 4.5 12 8l3.5-3.5" />
      <path d="M4.2 13.2 5.6 14.6M18.4 14.6l1.4-1.4M2 19h20M6 19a6 6 0 0 1 12 0" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z" />
      <path d="M9 6v12" strokeDasharray="2 2" />
    </>
  ),
  jeep: (
    <>
      <path d="M3 15v-3l2-5h9l3 4h3a1 1 0 0 1 1 1v3h-2" />
      <path d="M5 15H3M15 15H9" />
      <circle cx="7" cy="16" r="2" />
      <circle cx="17" cy="16" r="2" />
      <path d="M6 11h11" />
    </>
  ),
  water: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
  mask: (
    <>
      <path d="M3 9c3-1 6-1 9 0s6 1 9 0v3c0 4-4 6-9 6s-9-2-9-6Z" />
      <path d="M8 12h8" />
    </>
  ),
  binoculars: (
    <>
      <circle cx="6.5" cy="15.5" r="3.5" />
      <circle cx="17.5" cy="15.5" r="3.5" />
      <path d="M10 15.5h4M5 12l2-7h3v10M19 12l-2-7h-3v10" />
    </>
  ),
  coffee: (
    <>
      <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3" />
    </>
  ),
  utensils: (
    <>
      <path d="M6 3v8a2 2 0 0 0 2 2v8M10 3v8M6 7h4" />
      <path d="M17 21V3c-2 1-3 4-3 7s1 4 3 4" />
    </>
  ),
  cookie: (
    <>
      <path d="M21 12a9 9 0 1 1-9-9 3 3 0 0 0 3 3 3 3 0 0 0 3 3 3 3 0 0 0 3 3Z" />
      <path d="M8.5 9.5h.01M15 15h.01M10 15h.01" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5Z" />
    </>
  ),
  seat: (
    <>
      <path d="M7 4h7a2 2 0 0 1 2 2v7H7Z" />
      <path d="M5 13h13l1 4H6ZM7 17v3M17 17v3" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" />
      <path d="M5 19c3-4 6-6 10-8" />
    </>
  ),
  paw: (
    <>
      <path d="M8.5 14.5c1.6-2.4 5.4-2.4 7 0l1.2 1.8c1 1.6-.2 3.7-2.1 3.5-1.6-.2-2.9-.2-4.6 0-1.9.2-3-1.9-2-3.5Z" />
      <circle cx="6" cy="10" r="1.8" />
      <circle cx="9.5" cy="6.5" r="1.8" />
      <circle cx="14.5" cy="6.5" r="1.8" />
      <circle cx="18" cy="10" r="1.8" />
    </>
  ),
  feather: (
    <>
      <path d="M20 4c-6 0-12 4-13 13l-3 3" />
      <path d="M7 17c6 0 11-3 13-13M10 14h5M12 11h5" />
    </>
  ),
  scale: (
    <>
      <path d="M4 12c2-4 6-6 10-6 3 0 6 2 6 6s-3 6-6 6c-4 0-8-2-10-6Z" />
      <path d="M8 12h.01M12 9c1 1 1 5 0 6M15 9c1 1 1 5 0 6" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.2Z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.2-2-1-.9.8c-1-.4-2-1.4-2.4-2.4l.8-.9-1-2L9 9.5Z" />
    </>
  ),
  chat: <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.2Z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  send: <path d="M21 3 3 10.5l7 3 3 7.5ZM10 13.5 21 3" />,
  pen: <path d="M4 20h4L19 9l-4-4L4 16ZM13.5 6.5l4 4" />,
  quote: <path d="M7 17c-2 0-3-1.5-3-3.5C4 10 6 7 9 6M17 17c-2 0-3-1.5-3-3.5 0-3.5 2-6.5 5-7.5M4 13.5h4.5V17H5M14 13.5h4.5V17H15" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  play: <path d="M7 4v16l13-8Z" />,
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19M6 15h4" />
    </>
  ),
  check: <path d="m5 12 5 5 9-10" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.1 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  rotate: (
    <>
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
    </>
  ),
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.7, title }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name] || null}
    </svg>
  );
}
