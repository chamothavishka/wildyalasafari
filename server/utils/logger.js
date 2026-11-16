/** Tiny structured logger. Never pass secrets, card data or full request bodies to it. */
const line = (level, msg, meta) => {
  const entry = { t: new Date().toISOString(), level, msg, ...(meta || {}) };
  const out = JSON.stringify(entry);
  if (level === 'error') console.error(out);
  else if (level === 'warn') console.warn(out);
  else console.log(out);
};
let silent = false;
export const setSilent = (v) => {
  silent = v;
};
export const log = {
  info: (msg, meta) => !silent && line('info', msg, meta),
  warn: (msg, meta) => !silent && line('warn', msg, meta),
  error: (msg, meta) => !silent && line('error', msg, meta),
};
