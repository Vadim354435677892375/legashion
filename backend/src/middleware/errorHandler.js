import { ZodError } from 'zod';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
