import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrice, jeepsRequired } from './pricing.js';
import { convertFromLKR, formatMoney } from './currency.js';

const calc = (safariId, jeepId, adults, children = 0, infants = 0) =>
  calculatePrice({ safariId, jeepId, adults, children, infants });

test('base price covers the jeep and first adult', () => {
  assert.equal(calc('morning', 'hilux', 1).totalLKR, 32000);
  assert.equal(calc('evening', 'hilux', 1).totalLKR, 32000);
  assert.equal(calc('morning', 'cruiser', 1).totalLKR, 37000);
  assert.equal(calc('fullday', 'hilux', 1).totalLKR, 52000);
  assert.equal(calc('fullday', 'cruiser', 1).totalLKR, 62000);
});

test('extra adults and children 6–11 are added; children 1–5 are free', () => {
  assert.equal(calc('morning', 'hilux', 2).totalLKR, 45000);
  assert.equal(calc('morning', 'hilux', 2, 1).totalLKR, 52500);
  assert.equal(calc('morning', 'hilux', 2, 1, 2).totalLKR, 52500);
  assert.equal(calc('evening', 'cruiser', 3, 2).totalLKR, 37000 + 2 * 13000 + 2 * 7500);
  assert.equal(calc('fullday', 'hilux', 2, 2).totalLKR, 52000 + 17000 + 20000);
  assert.equal(calc('fullday', 'cruiser', 4, 1, 1).totalLKR, 62000 + 3 * 17000 + 10000);
});

test('jeep capacity: 6 people per jeep, infants count towards seats', () => {
  assert.equal(jeepsRequired(1), 1);
  assert.equal(jeepsRequired(6), 1);
  assert.equal(jeepsRequired(7), 2);
  assert.equal(jeepsRequired(12), 2);
  assert.equal(jeepsRequired(13), 3);
  assert.equal(jeepsRequired(18), 3);
  assert.equal(calc('morning', 'hilux', 4, 1, 1).jeeps, 1);
  assert.equal(calc('morning', 'hilux', 4, 2, 1).jeeps, 2);
});

test('each additional jeep adds its base price', () => {
  // 7 adults => 2 jeeps
  assert.equal(calc('morning', 'hilux', 7).totalLKR, 2 * 32000 + 6 * 13000);
  assert.equal(calc('fullday', 'cruiser', 13).totalLKR, 3 * 62000 + 12 * 17000);
  // 5 adults + 2 free infants => 7 people => 2 jeeps
  assert.equal(calc('evening', 'cruiser', 5, 0, 2).totalLKR, 2 * 37000 + 4 * 13000);
});

test('invalid counts are normalised (minimum one adult)', () => {
  assert.equal(calc('morning', 'hilux', 0).adults, 1);
  assert.equal(calc('morning', 'hilux', -3, -1, -1).totalLKR, 32000);
});

test('currency conversion', () => {
  assert.equal(convertFromLKR(45000, 'LKR'), 45000);
  assert.equal(convertFromLKR(45000, 'USD'), 150);
  assert.equal(convertFromLKR(45000, 'JPY'), 22500);
  assert.equal(formatMoney(45000, 'USD'), 'USD 150.00');
  assert.equal(formatMoney(45000, 'LKR'), 'LKR 45,000');
});
