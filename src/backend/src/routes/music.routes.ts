import { Router, Request, Response, NextFunction } from 'express';
import { MusicService } from '../services/music.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { body, validationResult } from 'express-validator';
import { errorHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const musicService = new MusicService();

/**
 * GET /api/music/auth-url
 * Obter URL de autenticação OAuth
 */
router.get(
  '/auth-url',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const authUrl = musicService.getAuthUrl(userId);

      res.json({
        success: true,
        data: { authUrl }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/music/callback
 * Callback OAuth do Spotify
 */
router.get(
  '/callback',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({
          success: false,
          error: 'Missing code or state'
        });
      }

      // Extrair userId do state
      const userId = state.toString().split('_')[0];

      // TODO: Obter tenantId do usuário
      const tenantId = 'default-tenant';

      await musicService.connectSpotifyAccount(userId, tenantId, code as string);

      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/music?connected=true`);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/music/connect
 * Conectar conta Spotify (usar code)
 */
router.post(
  '/connect',
  authenticateToken,
  tenantMiddleware,
  body('code').isString().notEmpty().withMessage('Code is required'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user?.id;
      const tenantId = req.tenantId;
      const { code } = req.body;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const connection = await musicService.connectSpotifyAccount(userId, tenantId, code);

      res.json({
        success: true,
        data: connection,
        message: 'Spotify account connected successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/music/disconnect
 * Desconectar conta Spotify
 */
router.delete(
  '/disconnect',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      await musicService.disconnectSpotifyAccount(userId, tenantId);

      res.json({
        success: true,
        message: 'Spotify account disconnected successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/music/playlists
 * Obter playlists do usuário
 */
router.get(
  '/playlists',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const playlists = await musicService.getUserPlaylists(userId, tenantId);

      res.json({
        success: true,
        data: playlists
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/music/playlists/search
 * Buscar playlists
 */
router.get(
  '/playlists/search',
  authenticateToken,
  tenantMiddleware,
  body('query').isString().notEmpty().withMessage('Query is required'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user?.id;
      const tenantId = req.tenantId;
      const { query, limit } = req.query;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const playlists = await musicService.searchPlaylists(
        userId,
        tenantId,
        query as string,
        limit ? parseInt(limit as string) : 20
      );

      res.json({
        success: true,
        data: playlists
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/music/connection-status
 * Verificar status da conexão Spotify
 */
router.get(
  '/connection-status',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const status = await musicService.getConnectionStatus(userId, tenantId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

