import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { requireAdmin } from '../../middleware/adminAuth.js';

export const adminAuthRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/admin/auth/login — единственный способ входа: email + пароль.
// Личных кабинетов покупателей нет — этот логин только для администратора(ов),
// записи в таблицу Admin создаются вручную через seed/Prisma Studio (см. README).
adminAuthRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) throw new HttpError(401, 'Неверный email или пароль');

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new HttpError(401, 'Неверный email или пароль');

    const token = jwt.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({ token, email: admin.email });
  })
);

// GET /api/admin/auth/me — проверка валидности текущего токена (для фронта админки).
adminAuthRouter.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});
