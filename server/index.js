/**
 * Production entry point:  npm run build && npm start
 * Serves the website (dist/) and the API from one process / one origin.
 */
import { loadConfig, validateConfig } from './config.js';
import { connectDb, disconnectDb } from './db.js';
import { createApp } from './app.js';
import { log } from './utils/logger.js';

const config = loadConfig();
const { fatal, warnings } = validateConfig(config);
warnings.forEach((w) => log.warn(w));
if (fatal.length) {
  fatal.forEach((f) => log.error(f));
  log.error('Fix the configuration above (see .env.example) and start again.');
  process.exit(1);
}

try {
  await connectDb(config.mongodbUri);
} catch (err) {
  log.error('Could not connect to MongoDB — check MONGODB_URI and that this server is allowed to reach the database.', { error: err.message });
  process.exit(1);
}

const app = createApp(config);
const server = app.listen(config.port, () => log.info(`Wild Yala Safari is running`, { port: config.port, env: config.nodeEnv, siteUrl: config.siteUrl }));

const shutdown = (signal) => {
  log.info(`${signal} received — shutting down`);
  server.close(async () => {
    await disconnectDb().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => log.error('Unhandled promise rejection', { reason: String((reason && reason.message) || reason) }));
