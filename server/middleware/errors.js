import { ZodError } from 'zod';
import { HttpError } from '../utils/errors.js';
import { log } from '../utils/logger.js';

/** Validate req.body (or another source) with a zod schema; failures become a friendly 400. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) return next(parsed.error);
  req.valid = parsed.data;
  return next();
};

export function apiNotFound(_req, res) {
  res.status(404).json({ message: 'Not found.', code: 'NOT_FOUND' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (res.headersSent) return;
  if (err instanceof ZodError) {
    const fields = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    return res.status(400).json({ message: Object.values(fields)[0] || 'Please check the details you entered.', code: 'VALIDATION_ERROR', fields });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, code: err.code, ...(err.extra ? { details: err.extra } : {}) });
  }
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ message: 'The request body could not be read.', code: 'BAD_JSON' });
  if (err && err.type === 'entity.too.large') return res.status(413).json({ message: 'The request is too large.', code: 'TOO_LARGE' });
  if (err && err.code === 11000) return res.status(409).json({ message: 'That record already exists.', code: 'DUPLICATE' });
  // Anything else is a bug or an outage: log the details, show nothing internal.
  log.error('Unhandled error', { method: req.method, path: req.path, error: err && err.message, stack: err && err.stack && err.stack.split('\n').slice(0, 4).join(' | ') });
  return res.status(500).json({ message: 'Something went wrong on our side. Please try again, or contact us on WhatsApp.', code: 'SERVER_ERROR' });
}
