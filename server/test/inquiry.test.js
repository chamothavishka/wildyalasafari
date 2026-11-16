import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { startTestApp } from './helpers.js';
import { Inquiry } from '../models/Inquiry.js';
import { Booking } from '../models/Booking.js';
import { VIEWS, ensureViews } from '../db.js';

let ctx;
before(async () => {
  ctx = await startTestApp();
  await Inquiry.init();
  await ensureViews(mongoose.connection.db);
});
after(async () => ctx.stop());

test('a booking-page inquiry is saved with a server-side price estimate (browser totals are ignored)', async () => {
  const res = await ctx.api.post('/api/inquiries').send({
    source: 'booking',
    via: 'whatsapp',
    name: 'Ayesha Silva',
    email: 'Ayesha@Example.com',
    phone: '+94 77 123 4567',
    message: 'Vegetarian lunch please',
    safari: { id: 'morning', jeepId: 'hilux', adults: 2, children: 0, infants: 0, safariDate: '2030-01-15', pickupLocation: 'Tissa', estimatedTotalLKR: 1 },
  });
  assert.equal(res.status, 201);
  const doc = await Inquiry.findById(res.body.id).lean();
  assert.equal(doc.email, 'ayesha@example.com');
  assert.equal(doc.status, 'NEW');
  assert.equal(doc.via, 'whatsapp');
  assert.ok(doc.safari.estimatedTotalLKR > 1, 'the estimate comes from the server price list');
  assert.equal(await Booking.countDocuments(), 0, 'an inquiry is not a booking');
});

test('a contact-form inquiry is saved; invalid ones are refused', async () => {
  const ok = await ctx.api.post('/api/inquiries').send({ source: 'contact', via: 'email', name: 'Nimal', email: 'nimal@example.com', interest: 'Full Day Safari', message: 'Group discount?' });
  assert.equal(ok.status, 201);
  assert.equal((await ctx.api.post('/api/inquiries').send({ source: 'contact', name: '', email: 'x' })).status, 400);
  assert.equal((await ctx.api.post('/api/inquiries').send({ source: 'spam', name: 'A', email: 'a@example.com' })).status, 400);
});

test('database views split bookings by safari type; retired views are removed', async () => {
  const db = mongoose.connection.db;
  await db.createCollection('users_new', { viewOn: 'users', pipeline: [] }); // left over from an older version
  await ensureViews(db);
  const names = (await db.listCollections({ type: 'view' }).toArray()).map((c) => c.name).sort();
  assert.deepEqual(names, Object.keys(VIEWS).sort());

  await Booking.collection.insertMany([
    { bookingRef: 'WYS-VIEWTEST01', safari: { id: 'morning' }, paymentStatus: 'PAID', createdAt: new Date() },
    { bookingRef: 'WYS-VIEWTEST02', safari: { id: 'morning' }, paymentStatus: 'PENDING', createdAt: new Date(Date.now() - 1000) },
    { bookingRef: 'WYS-VIEWTEST03', safari: { id: 'evening' }, paymentStatus: 'PENDING', createdAt: new Date() },
    { bookingRef: 'WYS-VIEWTEST04', safari: { id: 'fullday' }, paymentStatus: 'PAID', createdAt: new Date() },
  ]);
  const refs = async (view) => (await db.collection(view).find().toArray()).map((b) => b.bookingRef);
  assert.deepEqual(await refs('bookings_morning'), ['WYS-VIEWTEST01', 'WYS-VIEWTEST02'], 'paid and unpaid together, newest first');
  assert.deepEqual(await refs('bookings_evening'), ['WYS-VIEWTEST03']);
  assert.deepEqual(await refs('bookings_fullday'), ['WYS-VIEWTEST04']);
  await Booking.deleteMany({ bookingRef: /^WYS-VIEWTEST/ });
});
