import dns from 'node:dns';
import mongoose from 'mongoose';
import { log } from './utils/logger.js';
import { Booking } from './models/Booking.js';
import { User } from './models/User.js';
import { Inquiry } from './models/Inquiry.js';

// Some home routers / Windows setups refuse the DNS SRV lookups Node sends directly,
// so `mongodb+srv://` only fails on the developer's machine. Use public resolvers outside
// production; hosting platforms (Render, Railway, …) resolve SRV normally.
if (process.env.NODE_ENV !== 'production') {
  try {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  } catch {
    /* ignore — keep the system resolver */
  }
}

mongoose.set('strictQuery', true);

const newestFirst = { $sort: { createdAt: -1 } };

/**
 * Read-only "views": ready-made filtered lists that show up next to the real collections in MongoDB Compass.
 * They store no data of their own, so they are always up to date.
 */
const bySafari = (id) => ({ viewOn: 'bookings', pipeline: [{ $match: { 'safari.id': id } }, newestFirst] });

export const VIEWS = {
  bookings_morning: bySafari('morning'),
  bookings_evening: bySafari('evening'),
  bookings_fullday: bySafari('fullday'),
};

/** Views from earlier versions that are no longer wanted. */
const RETIRED_VIEWS = ['bookings_paid', 'bookings_unpaid', 'users_new', 'users_old'];

export async function ensureViews(db) {
  const all = await db.listCollections({}, { nameOnly: true }).toArray();
  for (const c of all) {
    if (RETIRED_VIEWS.includes(c.name) && c.type === 'view') await db.dropCollection(c.name).catch(() => {}); // views hold no data
  }
  const existing = new Set(all.map((c) => c.name));
  for (const [name, { viewOn, pipeline }] of Object.entries(VIEWS)) {
    try {
      if (existing.has(name)) await db.command({ collMod: name, viewOn, pipeline }); // keep the definition current
      else await db.createCollection(name, { viewOn, pipeline });
    } catch (err) {
      log.warn('Could not create database view', { view: name, error: err.message });
    }
  }
}

export async function connectDb(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
  // Build the indexes (unique booking ref, unique transaction id, …) before serving traffic.
  await Promise.all([Booking.init(), User.init(), Inquiry.init()]);
  await ensureViews(mongoose.connection.db);
  log.info('MongoDB connected', { db: mongoose.connection.name });
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
