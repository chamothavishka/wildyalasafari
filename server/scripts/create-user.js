/**
 * Create (or reset the password of) a sign-in account.
 *   npm run user:create -- you@example.com "A strong password 123" "Full Name" [admin]
 * The website has no public sign-up form, so accounts are created here.
 */
import { loadConfig } from '../config.js';
import { connectDb, disconnectDb } from '../db.js';
import { User } from '../models/User.js';
import { createUser, hashPassword } from '../services/authService.js';
import { passwordSchema } from '../validation.js';

const [email, password, name = '', role = 'customer'] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: npm run user:create -- <email> <password> ["Full Name"] [customer|admin]');
  process.exit(2);
}
const pw = passwordSchema.safeParse(password);
if (!pw.success) {
  console.error(`Password rejected: ${pw.error.issues[0].message}`);
  process.exit(2);
}
if (!['customer', 'admin'].includes(role)) {
  console.error('Role must be "customer" or "admin".');
  process.exit(2);
}

const cfg = loadConfig();
if (!cfg.mongodbUri) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}
await connectDb(cfg.mongodbUri);
const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) {
  existing.passwordHash = await hashPassword(password);
  existing.passwordVersion += 1;
  existing.failedLogins = 0;
  existing.lockUntil = undefined;
  if (name) existing.name = name;
  existing.role = role;
  await existing.save();
  console.log(`Updated password for ${existing.email}.`);
} else {
  const u = await createUser({ email, password, name, role });
  console.log(`Created ${u.role} account ${u.email}.`);
}
await disconnectDb();
