import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
      user?: {
        id: string;
        email: string;
        role: string;
        platform: string;
      };
    }
  }
}