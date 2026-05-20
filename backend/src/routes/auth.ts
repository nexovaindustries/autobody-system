import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokens';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Datos inválidos' });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.active) {
    return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
  }

  const payload = { id: user.id, email: user.email, role: user.role as 'ADMIN' | 'RECEPCIONISTA' | 'TECNICO', name: user.name };
  const token = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return res.json({
    success: true,
    data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token, refreshToken },
  });
});

router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, error: 'Refresh token requerido' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.active) return res.status(401).json({ success: false, error: 'Token inválido' });

    const newPayload = { id: user.id, email: user.email, role: user.role as 'ADMIN' | 'RECEPCIONISTA' | 'TECNICO', name: user.name };
    return res.json({
      success: true,
      data: { token: generateToken(newPayload), refreshToken: generateRefreshToken(newPayload) },
    });
  } catch {
    return res.status(401).json({ success: false, error: 'Refresh token inválido' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  return res.json({ success: true, data: user });
});

export default router;
