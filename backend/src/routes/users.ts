import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const VALID_ROLES = ['ADMIN', 'RECEPCIONISTA', 'TECNICO'] as const;

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(VALID_ROLES),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(VALID_ROLES).optional(),
  active: z.boolean().optional(),
});

router.use(authenticate);

router.get('/', authorize('ADMIN'), async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  return res.json({ success: true, data: users });
});

router.post('/', authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.errors });
  }

  const { name, email, password, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ success: false, error: 'Email ya registrado' });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });

  return res.status(201).json({ success: true, data: user });
});

router.patch('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.errors });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.password) {
    updateData.password = await bcrypt.hash(parsed.data.password, 12);
  }
  delete updateData.password;
  if (parsed.data.password) updateData.password = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  return res.json({ success: true, data: user });
});

export default router;
