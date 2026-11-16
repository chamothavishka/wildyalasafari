/**
 * Small, simplified SVG flags for the currency selector.
 * (Emoji flags do not render on Windows, so these are drawn inline.)
 */
const FLAGS = {
  LKR: (
    <>
      <rect width="30" height="20" fill="#FFBE29" />
      <rect x="1.5" y="1.5" width="4" height="17" fill="#00534E" />
      <rect x="5.5" y="1.5" width="4" height="17" fill="#EB7400" />
      <rect x="11" y="1.5" width="17.5" height="17" fill="#8D153A" />
      <path d="M15 14.5c1.5-1 2-2.6 1.7-4.4.9-.4 1.8-.3 2.6.3.4-1.3 1.6-2 3-1.7.4 1.4-.2 2.6-1.3 3.2.6.8.7 1.8.3 2.6H15z" fill="#FFBE29" />
    </>
  ),
  USD: (
    <>
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={i * 1.54} width="30" height="1.54" fill="#B22234" />
      ))}
      <rect width="13" height="10.8" fill="#3C3B6E" />
      {[2, 5, 8, 11].map((x) => [2.2, 5.2, 8.2].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r=".6" fill="#fff" />))}
    </>
  ),
  EUR: (
    <>
      <rect width="30" height="20" fill="#003399" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={15 + Math.cos(a) * 5.5} cy={10 + Math.sin(a) * 5.5} r=".8" fill="#FFCC00" />;
      })}
    </>
  ),
  JPY: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="5.6" fill="#BC002D" />
    </>
  ),
  GBP: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
      <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.4" />
    </>
  ),
  AUD: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <g transform="scale(.5)">
        <path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
        <path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.4" />
        <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
        <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.4" />
      </g>
      <circle cx="7.5" cy="15" r="1.8" fill="#fff" />
      <circle cx="22.5" cy="5" r=".9" fill="#fff" />
      <circle cx="19" cy="10" r=".9" fill="#fff" />
      <circle cx="25.5" cy="9" r=".9" fill="#fff" />
      <circle cx="22.5" cy="16" r="1" fill="#fff" />
    </>
  ),
  CAD: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="7.5" height="20" fill="#D80621" />
      <rect x="22.5" width="7.5" height="20" fill="#D80621" />
      <path d="M15 4.2l1 2.1 1.3-.6-.5 3.3 1.8-1.6.5 1-1.1 1.6 1.6.3-2.8 2.3.3 1.1-2-.4V16h-.4v-2.7l-2 .4.3-1.1-2.8-2.3 1.6-.3-1.1-1.6.5-1 1.8 1.6-.5-3.3 1.3.6z" fill="#D80621" />
    </>
  ),
  CHF: (
    <>
      <rect width="30" height="20" fill="#DA291C" />
      <rect x="13.2" y="4.5" width="3.6" height="11" fill="#fff" />
      <rect x="9.5" y="8.2" width="11" height="3.6" fill="#fff" />
    </>
  ),
  CNY: (
    <>
      <rect width="30" height="20" fill="#EE1C25" />
      <path d="M5 2.6l.9 2.7h2.8l-2.3 1.7.9 2.7L5 8l-2.3 1.7.9-2.7-2.3-1.7h2.8z" fill="#FFFF00" />
      {[
        [10, 2],
        [12, 4],
        [12, 7],
        [10, 9],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r=".75" fill="#FFFF00" />
      ))}
    </>
  ),
  INR: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.67" fill="#FF9933" />
      <rect y="13.33" width="30" height="6.67" fill="#138808" />
      <circle cx="15" cy="10" r="2.4" fill="none" stroke="#000080" strokeWidth=".6" />
      <circle cx="15" cy="10" r=".5" fill="#000080" />
    </>
  ),
};

export default function Flag({ code, className = '' }) {
  return (
    <svg className={`flag ${className}`} viewBox="0 0 30 20" width="20" height="14" aria-hidden="true" focusable="false">
      {FLAGS[code] || <rect width="30" height="20" fill="#555" />}
    </svg>
  );
}
