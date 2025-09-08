import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User | null;
      userId?: string;
      sessionID?: string;
      id?: string;
    }
  }
}

// Make this file a module
export {};