import { z } from 'zod';
import { MAX_GROUP } from '../src/lib/pricing.js';

const clean = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
const text = (max) => z.string().max(max).transform(clean);

/** Today's calendar date in Sri Lanka (YYYY-MM-DD). */
export const todayColombo = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, 'That is not a real calendar date.');

const count = (min, max) => z.coerce.number().int().min(min).max(max);
const emailField = text(254).pipe(z.string().regex(/^\S+@\S+\.\S+$/, 'Please enter a valid email address.'));

/** Same field rules as the booking form, enforced again on the server. */
export const bookingSchema = z
  .object({
    name: text(120).pipe(z.string().min(1, 'Please enter your full name.')),
    email: emailField,
    phone: text(30).pipe(z.string().min(1, 'Please enter your WhatsApp / phone number.')).refine((v) => /^[+()\d\s-]{7,20}$/.test(v), 'Please enter a valid phone number.'),
    country: text(60).pipe(z.string().min(2, 'Please enter your country.')),
    safariDate: isoDate,
    arrivalDate: z.union([isoDate, z.literal('')]).optional().default(''),
    pickupLocation: text(300).pipe(z.string().min(1, 'Please enter your pickup location.')),
    specialRequests: text(1500).optional().default(''),
    safariId: z.enum(['morning', 'evening', 'fullday']),
    jeepId: z.enum(['hilux', 'cruiser']),
    adults: count(1, MAX_GROUP),
    children: count(0, MAX_GROUP).optional().default(0),
    infants: count(0, MAX_GROUP).optional().default(0),
    billingCurrency: z.enum(['USD', 'LKR']).optional().default('USD'),
    /** Optional: the total the customer saw. If it differs from the server's price the request is refused. */
    expectedTotalLKR: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.safariDate < todayColombo()) ctx.addIssue({ code: 'custom', path: ['safariDate'], message: 'Please choose a safari date that is today or later.' });
    if (v.arrivalDate && v.arrivalDate > v.safariDate) ctx.addIssue({ code: 'custom', path: ['arrivalDate'], message: 'Your arrival date should be on or before your safari date.' });
    if (v.adults + v.children + v.infants > MAX_GROUP) ctx.addIssue({ code: 'custom', path: ['adults'], message: `Groups of more than ${MAX_GROUP} guests must be arranged with our team.` });
  });

const optDate = z.union([isoDate, z.literal('')]).optional().default('');

/** An unpaid question / booking request from the booking page or the contact form. */
export const inquirySchema = z.object({
  source: z.enum(['booking', 'contact']),
  via: z.enum(['whatsapp', 'email', 'form']).optional().default('form'),
  name: text(120).pipe(z.string().min(1, 'Please enter your name.')),
  email: emailField,
  phone: text(30).refine((v) => v === '' || /^[+()\d\s-]{7,20}$/.test(v), 'Please enter a valid phone number.').optional().default(''),
  country: text(60).optional().default(''),
  message: text(2000).optional().default(''),
  interest: text(60).optional().default(''),
  safari: z
    .object({
      id: z.enum(['morning', 'evening', 'fullday']).optional(),
      jeepId: z.enum(['hilux', 'cruiser']).optional(),
      adults: count(0, MAX_GROUP).optional(),
      children: count(0, MAX_GROUP).optional(),
      infants: count(0, MAX_GROUP).optional(),
      safariDate: optDate,
      arrivalDate: optDate,
      pickupLocation: text(300).optional().default(''),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Please enter your password.').max(200),
  remember: z.coerce.boolean().optional().default(false),
});

export const resetRequestSchema = z.object({ email: emailField });

export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .max(200)
  .refine((v) => /[a-z]/i.test(v) && /\d/.test(v), 'Use letters and at least one number.');

export const registerSchema = z.object({
  name: text(120).pipe(z.string().min(1, 'Please enter your full name.')),
  email: emailField,
  password: passwordSchema,
});

export const resetConfirmSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, 'This reset link is not valid.'),
  password: passwordSchema,
});
