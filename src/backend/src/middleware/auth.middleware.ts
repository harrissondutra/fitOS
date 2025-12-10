/**
 * Middlewares de Autenticação - FitOS
 * 
 * Este arquivo contém todos os middlewares relacionados à autenticação:
 * - authenticateToken: Verifica JWT e adiciona dados do usuário ao request
 * - checkSessionActivity: Valida atividade da sessão e inatividade
 * - requireAuth: Middleware obrigatório de autenticação
 * - optionalAuth: Middleware opcional de autenticação
 * - requireRole: Middleware para verificação de roles específicas
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  User, 
  UserRole, 
  AuthenticatedRequest, 
  AuthMiddlewareOptions,
  AUTH_CONSTANTS
} from '../../../shared/types/auth.types';
import { getAuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

// Estender o tipo Request do Express para incluir dados de autenticação
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        tenantId?: string;
        name?: string;
      };
      session?: any;
      tenantId?: string;
    }
  }
}

export class AuthMiddleware {
  private readonly prisma: PrismaClient;
  private _authService?: ReturnType<typeof getAuthService>;

  // Sempre usar singleton do Prisma - sem lazy evaluation para evitar múltiplas instâncias
  constructor(prisma?: PrismaClient) {
    // Sempre usar getPrismaClient() singleton, mesmo se prisma for fornecido
    // Isso garante que sempre usamos a mesma instância compartilhada
    const { getPrismaClient } = require('../config/database');
    this.prisma = getPrismaClient();
  }

  // Lazy getter para authService
  private get authService(): ReturnType<typeof getAuthService> {
    if (!this._authService) {
      this._authService = getAuthService(this.prisma);
    }
    return this._authService;
  }

  // ============================================================================
  // MIDDLEWARE PRINCIPAL DE AUTENTICAÇÃO
  // ============================================================================

  /**
   * Middleware para verificar token JWT e carregar dados do usuário
   */
  authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Tentar obter token do header Authorization primeiro
      const authHeader = req.headers.authorization;
      let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      // Se não tiver token no header, tentar obter dos cookies
      if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        token = cookies['accessToken'] || cookies['better-auth.session_token'];
      }

      logger.debug(`Auth middleware - Request info: ${req.method} ${req.url}, token: ${token ? 'present' : 'missing'}`);

      if (!token) {
        // Log apenas como debug, não como warn - é comportamento esperado para rotas protegidas
        logger.debug(`Auth middleware - No token provided (rejecting): ${req.method} ${req.url}`);
        res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Token de acesso não fornecido'
        });
        return;
      }

      // Verificar e decodificar token
      let payload;
      try {
        payload = this.authService.verifyToken(token);
        logger.debug(`Auth middleware - Token verified for user: ${payload.userId}, role: ${payload?.role}`);
      } catch (verifyError: any) {
        const errorMessage = verifyError?.message || 'Unknown error';
        logger.warn(`Auth middleware - Token verification failed: ${errorMessage}`);
        
        // Se for token expirado, retornar erro formatado imediatamente
        if (errorMessage === 'TOKEN_EXPIRED') {
          res.status(401).json({
            success: false,
            error: 'TOKEN_EXPIRED',
            message: 'Token de acesso expirado. Faça login novamente.'
          });
          return;
        }
        
        // Para outros erros, lançar exceção para ser capturada pelo catch externo
        throw verifyError;
      }
      
      // Para SUPER_ADMIN, verificar role do payload antes de tentar buscar no banco
      // Isso permite que SUPER_ADMIN continue funcionando mesmo com problemas de conexão
      const userRole = payload?.role;
      const isSuperAdmin = userRole === 'SUPER_ADMIN';
      
      // Log para debug
      logger.debug(`Auth middleware - User role from token: ${userRole}, isSuperAdmin: ${isSuperAdmin}`);
      
      // Buscar usuário no banco de dados (com tolerância a falhas de conexão)
      let user: any = null;
      try {
        // Timeout de 5 segundos para evitar conexões órfãs
        user = await Promise.race([
          this.prisma.user.findUnique({
            where: { id: payload.userId },
            include: {
              tenant: true
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database query timeout')), 5000)
          )
        ]) as any;
      } catch (dbErr: any) {
        // Se o banco caiu (ex.: P1001/P1017/P2037), para SUPER_ADMIN permitimos seguir com dados do token
        const prismaCode = dbErr?.code;
        const errorMessage = dbErr?.message || '';
        const isConnIssue = prismaCode === 'P1001' || prismaCode === 'P1017' || prismaCode === 'P2037' || 
                            /closed the connection/i.test(errorMessage) ||
                            /too many clients/i.test(errorMessage) ||
                            /Can't reach database server/i.test(errorMessage) ||
                            /connection.*closed/i.test(errorMessage) ||
                            /timeout/i.test(errorMessage) ||
                            /Database query timeout/i.test(errorMessage);
        
        if (isConnIssue) {
          logger.warn('Auth DB error on user lookup', { 
            code: prismaCode, 
            message: errorMessage,
            payloadRole: userRole,
            payloadRoleType: typeof userRole,
            userId: payload?.userId,
            isSuperAdmin,
            payloadKeys: Object.keys(payload || {})
          });
          
          // Se for SUPER_ADMIN, permitir seguir com dados do token
          if (isSuperAdmin) {
            logger.info('Allowing SUPER_ADMIN access with token-only fallback due to DB connection issue', {
              userId: payload.userId,
              email: payload.email,
              tenantId: payload.tenantId
            });
            user = {
              id: payload.userId,
              email: payload.email || 'superadmin@local',
              role: 'SUPER_ADMIN',
              status: 'ACTIVE',
              tenantId: payload.tenantId || null,
              emailVerified: true
            };
          } else {
            logger.error('Non-SUPER_ADMIN user cannot access during DB connection issue', { 
              role: userRole,
              roleType: typeof userRole,
              userId: payload?.userId,
              payloadKeys: Object.keys(payload || {})
            });
            res.status(503).json({
              success: false,
              error: 'SERVICE_UNAVAILABLE',
              message: 'Serviço de autenticação indisponível no momento. Muitas conexões ao banco de dados.'
            });
            return;
          }
        } else {
          // Erro não relacionado a conexão - logar e relançar
          logger.error('Auth DB error (non-connection issue)', {
            code: prismaCode,
            message: errorMessage,
            userId: payload?.userId
          });
          throw dbErr;
        }
      }

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado'
        });
        return;
      }

      // Verificar se usuário está ativo
      if (user.status !== 'ACTIVE') {
        res.status(401).json({
          success: false,
          error: 'USER_INACTIVE',
          message: 'Usuário inativo'
        });
        return;
      }

      // Verificar se email foi verificado (opcional)
      // SUPER_ADMIN sempre pode acessar, mesmo sem email verificado
      if (!user.emailVerified && user.role !== 'SUPER_ADMIN') {
        res.status(401).json({
          success: false,
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Email não verificado'
        });
        return;
      }

      // Adicionar dados do usuário ao request
      req.user = user as User;
      req.tenantId = user.tenantId || undefined;

      next();
    } catch (error) {
      logger.error('Erro na autenticação:', error);
      
      let errorCode = 'INVALID_TOKEN';
      let message = 'Token inválido';

      if (error instanceof Error) {
        if (error.message === 'TOKEN_EXPIRED') {
          errorCode = 'TOKEN_EXPIRED';
          message = 'Token expirado';
        } else if (error.message === 'INVALID_TOKEN') {
          errorCode = 'INVALID_TOKEN';
          message = 'Token inválido';
        }
      }

      res.status(401).json({
        success: false,
        error: errorCode,
        message
      });
    }
  };

  // ============================================================================
  // MIDDLEWARE DE VERIFICAÇÃO DE SESSÃO
  // ============================================================================

  /**
   * Middleware para verificar atividade da sessão
   */
  checkSessionActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'USER_NOT_AUTHENTICATED',
          message: 'Usuário não autenticado'
        });
        return;
      }

      // Buscar sessão ativa do usuário (com tolerância a falhas)
      let session: any = null;
      try {
        session = await this.prisma.session.findFirst({
          where: {
            userId: req.user.id,
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });
      } catch (dbErr: any) {
        // Se o banco caiu ou tem muitos clientes (ex.: P1001/P1017/P2037), tratar adequadamente
        const prismaCode = dbErr?.code;
        const isConnIssue = prismaCode === 'P1001' || prismaCode === 'P1017' || prismaCode === 'P2037' || 
                            /closed the connection/i.test(dbErr?.message || '') ||
                            /too many clients/i.test(dbErr?.message || '');
        if (isConnIssue) {
          // Para SUPER_ADMIN, seguir sem sessão (desde que token válido)
          if ((req.user as any)?.role === 'SUPER_ADMIN') {
            logger.warn('Session check skipped for SUPER_ADMIN due to DB connectivity issue', { code: prismaCode });
            req.session = undefined;
            return next();
          }
          res.status(503).json({
            success: false,
            error: 'SERVICE_UNAVAILABLE',
            message: 'Serviço de autenticação indisponível no momento. Muitas conexões ao banco de dados.'
          });
          return;
        } else {
          throw dbErr;
        }
      }

      if (!session) {
        // SUPER_ADMIN pode pular verificação de sessão se token for válido
        if ((req.user as any)?.role === 'SUPER_ADMIN') {
          logger.warn('Session not found for SUPER_ADMIN, but token is valid - allowing access');
          req.session = undefined;
          return next();
        }
        
        res.status(401).json({
          success: false,
          error: 'SESSION_NOT_FOUND',
          message: 'Sessão não encontrada ou expirada'
        });
        return;
      }

      // Verificar se sessão está próxima de expirar
      const sessionData = {
        id: session.id,
        userId: session.userId,
        tenantId: req.user.tenantId || 'default-tenant',
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastActivity: session.updatedAt
      };

      if (this.authService.isSessionNearExpiry(sessionData)) {
        // Atualizar sessão para estender tempo de expiração
        await this.authService.updateSessionActivity(session.id);
      }

      req.session = sessionData;
      next();
    } catch (error) {
      logger.error('Erro na verificação de sessão:', error);
      res.status(500).json({
        success: false,
        error: 'SESSION_CHECK_FAILED',
        message: 'Erro ao verificar sessão'
      });
    }
  };

  // ============================================================================
  // MIDDLEWARES DE AUTORIZAÇÃO
  // ============================================================================

  /**
   * Middleware obrigatório de autenticação
   */
  requireAuth = (options: AuthMiddlewareOptions = {}) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Primeiro verificar token
      await this.authenticateToken(req, res, (err) => {
        if (err) return;

        // SUPER_ADMIN com token válido pode pular verificação de sessão
        // (útil para desenvolvimento e em caso de problemas com sessões)
        if ((req.user as any)?.role === 'SUPER_ADMIN' && options.checkSessionActivity === false) {
          logger.debug('Skipping session check for SUPER_ADMIN (explicit option)');
          return next();
        }

        // Depois verificar sessão se necessário
        // Verificação de sessão é opcional para SUPER_ADMIN mesmo se não explicitamente desabilitada
        if (options.checkSessionActivity === false) {
          next();
        } else {
          this.checkSessionActivity(req as any, res, next);
        }
      });
    };
  };

  /**
   * Middleware opcional de autenticação
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        // Tentar autenticar se token existe, mas não logar erros
        try {
          const payload = this.authService.verifyToken(token);
          
          // Buscar usuário no banco de dados
          const user = await this.prisma.user.findUnique({
            where: { id: payload.userId },
            include: {
              tenant: true
            }
          });

          if (user && user.status === 'ACTIVE' && user.emailVerified) {
            // Adicionar dados do usuário ao request
            (req as any).user = user;
            (req as any).tenantId = user.tenantId || undefined;
          }
        } catch (authError) {
          // Token inválido ou expirado - continuar sem autenticação
          // Não logar erro para evitar spam no console
        }
      }
      
      // Continuar sem autenticação (com ou sem usuário)
      next();
    } catch (error) {
      // Em caso de erro, continuar sem autenticação
      next();
    }
  };

  /**
   * Middleware para verificar roles específicas
   */
  requireRole = (requiredRoles: (UserRole | 'OWNER' | 'TRAINER' | 'NUTRITIONIST')[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'USER_NOT_AUTHENTICATED',
          message: 'Usuário não autenticado'
        });
        return;
      }

      const roleStr = req.user.role as unknown as string;
      if (!(requiredRoles as string[]).includes(roleStr)) {
        res.status(403).json({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: `Acesso negado. Roles necessárias: ${requiredRoles.join(', ')}`
        });
        return;
      }

      next();
    };
  };

  /**
   * Middleware para verificar acesso ao tenant
   */
  requireTenantAccess = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'USER_NOT_AUTHENTICATED',
        message: 'Usuário não autenticado'
      });
      return;
    }

    const requestedTenantId = (req as any).params.tenantId || (req as any).body.tenantId || (req as any).query.tenantId;

    // SUPER_ADMIN pode acessar qualquer tenant
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // Outros usuários só podem acessar seu próprio tenant
    if (req.user.tenantId !== requestedTenantId) {
      res.status(403).json({
        success: false,
        error: 'TENANT_ACCESS_DENIED',
        message: 'Acesso negado ao tenant'
      });
      return;
    }

    next();
  };

  // ============================================================================
  // MIDDLEWARES ESPECÍFICOS POR ROLE
  // ============================================================================

  /**
   * Middleware para SUPER_ADMIN
   */
  requireSuperAdmin = this.requireRole(['SUPER_ADMIN']);

  /**
   * Middleware para ADMIN ou SUPER_ADMIN
   */
  requireAdminOrSuperAdmin = this.requireRole(['ADMIN', 'SUPER_ADMIN']);

  /**
   * Middleware para OWNER ou SUPER_ADMIN
   */
  requireOwnerOrSuperAdmin = this.requireRole(['OWNER', 'SUPER_ADMIN']);

  /**
   * Middleware para TRAINER ou superior
   */
  requireTrainerOrAbove = this.requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']);

  /**
   * Middleware para qualquer usuário autenticado
   */
  requireAnyAuth = this.requireRole(['CLIENT', 'TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']);

  // ============================================================================
  // MIDDLEWARES DE RATE LIMITING
  // ============================================================================

  /**
   * Middleware para limitar tentativas de login
   */
  rateLimitLogin = (maxAttempts: number = AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS) => {
    const attempts = new Map<string, { count: number; lastAttempt: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
      // Verificar se é SUPER_ADMIN e pular rate limiting para login
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const jwt = require('jsonwebtoken');
          const { config } = require('../config/config-simple');
          const decoded = jwt.verify(token, config.jwt.secret);
          
          if (decoded.role === 'SUPER_ADMIN') {
            // SUPER_ADMIN não tem rate limiting em login
            return next();
          }
        } catch (error) {
          // Token inválido, continuar com rate limiting normal
        }
      }
      
      // Verificar também role do usuário autenticado (se já estiver autenticado)
      const userRole = (req as any).user?.role;
      if (userRole === 'SUPER_ADMIN') {
        return next();
      }

      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const userAttempts = attempts.get(ip);

      if (userAttempts) {
        // Reset contador se passou do tempo de lockout
        if (now - userAttempts.lastAttempt > AUTH_CONSTANTS.LOCKOUT_DURATION) {
          attempts.delete(ip);
        } else if (userAttempts.count >= maxAttempts) {
          res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Muitas tentativas de login. Tente novamente em alguns minutos.'
          });
          return;
        }
      }

      next();
    };
  };

  // ============================================================================
  // MIDDLEWARES DE VALIDAÇÃO
  // ============================================================================

  /**
   * Middleware para validar dados de login
   */
  validateLoginData = (req: Request, res: Response, next: NextFunction): void => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Email e senha são obrigatórios'
      });
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL_FORMAT',
        message: 'Formato de email inválido'
      });
      return;
    }

    next();
  };

  /**
   * Middleware para validar dados de signup
   */
  validateSignupData = (req: Request, res: Response, next: NextFunction): void => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Todos os campos são obrigatórios'
      });
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL_FORMAT',
        message: 'Formato de email inválido'
      });
      return;
    }

    // Validar senha
    const passwordValidation = this.authService.validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'PASSWORD_TOO_WEAK',
        message: 'Senha não atende aos critérios de segurança',
        details: passwordValidation
      });
      return;
    }

    // Verificar se senhas coincidem
    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'PASSWORDS_DO_NOT_MATCH',
        message: 'Senhas não coincidem'
      });
      return;
    }

    next();
  };
}

// Singleton para AuthMiddleware
let authMiddlewareInstance: AuthMiddleware | null = null;

export function getAuthMiddleware(): AuthMiddleware {
  // Sempre usar singleton - ignorar qualquer parâmetro prisma se fornecido
  // O AuthMiddleware já usa getPrismaClient() internamente
  if (!authMiddlewareInstance) {
    authMiddlewareInstance = new AuthMiddleware();
  }
  return authMiddlewareInstance;
}

// Export direto de authenticateToken para compatibilidade
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Sempre usar a instância singleton do middleware (já usa Prisma singleton internamente)
  const authMiddleware = getAuthMiddleware();
  await authMiddleware.authenticateToken(req, res, next);
};

// Alias para compatibilidade
export const requireAuth = authenticateToken;

// Export em formato de objeto para compatibilidade com outros arquivos
export const authMiddleware = {
  authenticateToken,
  requireAuth
};