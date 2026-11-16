/**
 * A read-only health check for your own terminal.
 *   npm run check                              → configuration, database connection, saved bookings, e-mail login
 *   npm run check -- --send-test you@mail.com  → also sends one real test e-mail
 * It never prints passwords, keys or secrets, and it never changes any booking.
 */
import { loadConfig, validateConfig } from '../config.js';
import { connectDb, disconnectDb } from '../db.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { verifyEmailSetup, sendTestEmail } from '../services/emailService.js';
import { setSilent } from '../utils/logger.js';

setSilent(true);
const args = process.argv.slice(2);
const testTo = args.includes('--send-test') ? args[args.indexOf('--send-test') + 1] : '';
const cfg = loadConfig();
const { fatal, warnings } = validateConfig(cfg);
const yes = (v) => (v ? 'yes' : 'NO');
let problems = 0;
const bad = (msg) => {
  problems += 1;
  console.log(`  ✗ ${msg}`);
};
const good = (msg) => console.log(`  ✓ ${msg}`);

console.log('\n1) Settings found (values are never shown)');
console.log(`   MONGODB_URI ${yes(cfg.mongodbUri)} · JWT_SECRET ${yes(cfg.jwtSecret)} · SITE_URL ${cfg.siteUrl || 'NO'}`);
console.log(`   PayHere: ${cfg.payhere.enabled ? `configured (${cfg.payhere.mode} mode)` : 'NOT configured'} · E-mail: ${cfg.email.enabled ? `configured (${cfg.email.host}:${cfg.email.port})` : 'NOT configured'}`);
fatal.forEach((f) => bad(f));
warnings.forEach((w) => console.log(`  ! ${w}`));

console.log('\n2) Database');
if (!cfg.mongodbUri) {
  bad('MONGODB_URI is not set, so nothing can be saved.');
} else {
  try {
    await connectDb(cfg.mongodbUri);
    good('Connected to MongoDB.');
    const [total, users] = await Promise.all([Booking.countDocuments(), User.countDocuments()]);
    console.log(`   ${total} booking(s) saved · ${users} user account(s)`);
    const byStatus = await Booking.aggregate([{ $group: { _id: { payment: '$paymentStatus', booking: '$bookingStatus', email: '$email.status' }, n: { $sum: 1 } } }, { $sort: { n: -1 } }]);
    if (byStatus.length) {
      console.log('   payment / booking / confirmation e-mail → count');
      byStatus.forEach((s) => console.log(`     ${s._id.payment} / ${s._id.booking} / ${s._id.email} → ${s.n}`));
    }
    const latest = await Booking.find().sort({ createdAt: -1 }).limit(5).lean();
    if (latest.length) {
      console.log('   Latest bookings:');
      latest.forEach((b) => {
        console.log(`     ${b.bookingRef} · ${b.createdAt.toISOString().slice(0, 16).replace('T', ' ')} · ${b.customer.email} · ${b.safari.name} on ${b.safariDate} · ${b.billing.currency} ${b.billing.amountFixed}`);
        console.log(`        payment ${b.paymentStatus} · booking ${b.bookingStatus} · confirmation e-mail ${b.email.status}${b.email.lastError ? ` (${b.email.lastError})` : ''}${b.payment.transactionId ? ` · gateway ref ${b.payment.transactionId}` : ''}`);
      });
    } else {
      console.log('   No bookings saved yet.');
    }
    const stuck = await Booking.countDocuments({ paymentStatus: 'PAID', 'email.status': { $ne: 'SENT' } });
    if (stuck) bad(`${stuck} paid booking(s) have NOT had their confirmation e-mail sent — fix the e-mail settings, then run: npm run emails:retry`);
    else good('Every paid booking has had its confirmation e-mail sent.');
  } catch (err) {
    bad(`Could not connect to MongoDB: ${err.message}`);
  }
}

console.log('\n3) E-mail');
const mailCheck = await verifyEmailSetup(cfg);
if (mailCheck.ok) good('The mail server accepted the login.');
else bad(`The mail server check failed: ${mailCheck.error}`);
if (testTo) {
  const sent = await sendTestEmail(testTo, cfg);
  if (sent.ok) good(`Test e-mail sent to ${testTo} — check that inbox (and the spam folder).`);
  else bad(`Test e-mail failed: ${sent.error}`);
} else if (mailCheck.ok) {
  console.log('   Tip: npm run check -- --send-test your@email.com   sends a real test message.');
}

await disconnectDb().catch(() => {});
console.log(problems ? `\n${problems} problem(s) found — see ✗ above.\n` : '\nAll checks passed.\n');
process.exit(problems ? 1 : 0);
