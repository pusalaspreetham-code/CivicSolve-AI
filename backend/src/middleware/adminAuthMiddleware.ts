import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || '';

export interface AdminJwtPayload {
  adminId: number;
  email: string;
}

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, ADMIN_SECRET) as any;
    if (!payload || typeof payload.adminId !== 'number') {
      return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }
    (req as any).adminId = payload.adminId;
    (req as any).adminEmail = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
};

declare global {
  namespace Express {
    interface Request {
      adminId?: number;
      adminEmail?: string;
    }
  }
}
