import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type UserRole = 'ADMIN' | 'RECEPCIONISTA' | 'TECNICO';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token requerido' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'];
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'No autenticado' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Sin permisos suficientes' });
    }
    next();
  };
}
