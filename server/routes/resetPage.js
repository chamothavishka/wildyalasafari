/**
 * The page a password-reset e-mail links to. The existing website has no "choose a new password" screen, so this is a
 * minimal server-rendered page (no JavaScript, so it is covered by the strict Content-Security-Policy) in the brand colours.
 */
import { Router } from 'express';
import { ZodError } from 'zod';
import { resetConfirmSchema } from '../validation.js';
import { completePasswordReset } from '../services/authService.js';
import { BRAND } from '../../src/data/content.js';
import { esc } from '../emails/layout.js';
import { HttpError } from '../utils/errors.js';

const page = ({ title, body }) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} — ${esc(BRAND.name)}</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#0c0906;color:#f5ede1;font:16px/1.6 'Segoe UI',Helvetica,Arial,sans-serif}
main{width:min(440px,100%);padding:36px 32px;border:1px solid rgba(255,226,190,.16);border-radius:8px;background:#16100b}
h1{margin:0 0 6px;font:500 2.1rem/1.1 Georgia,'Times New Roman',serif}p{color:rgba(245,237,225,.7);margin:8px 0 20px}
label{display:block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ffb25c;margin:14px 0 6px}
input{width:100%;height:50px;padding:0 14px;border-radius:10px;border:1px solid rgba(255,226,190,.25);background:rgba(255,240,220,.04);color:#f5ede1;font-size:16px}
input:focus{outline:2px solid #f68f2f;outline-offset:2px}
button,a.btn{display:inline-flex;justify-content:center;width:100%;margin-top:22px;padding:15px 22px;border:0;border-radius:999px;background:linear-gradient(180deg,#ffad5a,#f68f2f 60%,#e8791d);color:#1c1007;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:13px;text-decoration:none;cursor:pointer}
.err{padding:12px 14px;border:1px solid rgba(255,138,117,.5);border-radius:10px;color:#ff8a75;background:rgba(255,138,117,.07);font-size:14px}
</style></head><body><main>${body}</main></body></html>`;

const form = (token, error = '') => `<h1>Choose a new password</h1><p>Use at least 10 characters, with letters and a number.</p>
${error ? `<div class="err" role="alert">${esc(error)}</div>` : ''}
<form method="post" action="/reset-password" autocomplete="off">
<input type="hidden" name="token" value="${esc(token)}">
<label for="pw">New password</label><input id="pw" name="password" type="password" minlength="10" required autocomplete="new-password">
<button type="submit">Save password</button></form>`;

export function resetPageRoutes(cfg, { reset: resetLimiter }) {
  const r = Router();

  r.get('/reset-password', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const token = String(req.query.token || '');
    if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).send(page({ title: 'Reset password', body: '<h1>Link not valid</h1><p>This reset link is not valid. Please request a new one from the sign-in page.</p><a class="btn" href="/login.html">Back to sign in</a>' }));
    return res.send(page({ title: 'Reset password', body: form(token) }));
  });

  r.post('/reset-password', resetLimiter, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const token = String((req.body && req.body.token) || '');
    try {
      const parsed = resetConfirmSchema.parse({ token, password: String((req.body && req.body.password) || '') });
      await completePasswordReset(parsed.token, parsed.password);
      return res.send(page({ title: 'Password changed', body: '<h1>Password changed</h1><p>Your password has been updated. You can now sign in.</p><a class="btn" href="/login.html">Go to sign in</a>' }));
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).send(page({ title: 'Reset password', body: form(token, err.issues[0].message) }));
      if (err instanceof HttpError) return res.status(err.status).send(page({ title: 'Reset password', body: `<h1>Link expired</h1><p>${esc(err.message)}</p><a class="btn" href="/login.html">Back to sign in</a>` }));
      throw err;
    }
  });

  return r;
}
