import { Router, Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { fromNodeHeaders } from 'better-auth/node';
import auth from '../config/auth';
import { logger } from '../utils/logger';

const router = Router();

// Rota de teste (sem prefixo /api/auth)
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Auth route working!', timestamp: new Date().toISOString() });
});

// Rota personalizada para sessão (sem prefixo /api/auth)
router.get('/session', async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (session) {
      res.json(session);
    } else {
      res.status(401).json({ error: 'No active session' });
    }
  } catch (error) {
    logger.error('Session check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handlers oficiais do Better Auth usando toNodeHandler
// Better Auth precisa ser registrado na raiz para funcionar corretamente
router.all('*', toNodeHandler(auth));

export { router as authRoutes };