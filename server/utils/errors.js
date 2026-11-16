/** An error that is safe to show to the customer. */
export class HttpError extends Error {
  constructor(status, message, code, extra) {
    super(message);
    this.status = status;
    this.code = code || 'ERROR';
    this.extra = extra;
  }
}
export const badRequest = (m, code = 'BAD_REQUEST', extra) => new HttpError(400, m, code, extra);
export const unauthorized = (m = 'Please sign in to continue.', code = 'UNAUTHORIZED') => new HttpError(401, m, code);
export const notFound = (m = 'Not found.', code = 'NOT_FOUND') => new HttpError(404, m, code);
export const conflict = (m, code = 'CONFLICT', extra) => new HttpError(409, m, code, extra);
export const unavailable = (m, code = 'UNAVAILABLE') => new HttpError(503, m, code);
