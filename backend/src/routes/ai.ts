import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth/jwt';
import { searchRateLimit } from '@/middleware/security';
import { conciergeHandler } from '@/controllers/ai/concierge.controller';

const router = Router();

// AI concierge: natural-language service discovery with availability + navigation.
// Auth-required + rate-limited (each call costs an LLM round-trip).
router.post('/concierge', authenticateToken, searchRateLimit, conciergeHandler);

export default router;
