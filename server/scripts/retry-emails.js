/**
 * Send any booking-confirmation e-mails that have not gone out yet (e.g. after an e-mail outage).
 *   npm run emails:retry
 * Safe to run at any time or on a schedule: each booking is claimed atomically, so nothing is ever sent twice.
 */
import { loadConfig } from '../config.js';
import { connectDb, disconnectDb } from '../db.js';
import { retryPendingConfirmations } from '../services/emailService.js';

const cfg = loadConfig();
if (!cfg.mongodbUri) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}
await connectDb(cfg.mongodbUri);
const { due, sent } = await retryPendingConfirmations(cfg);
console.log(`Confirmation e-mails: ${sent} sent, ${due - sent} still pending (of ${due} due).`);
await disconnectDb();
process.exit(due - sent > 0 ? 3 : 0);
