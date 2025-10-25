/**
 * Rotas de Autenticação - FitOS
 * 
 * Este arquivo contém todas as rotas relacionadas à autenticação:
 * - POST /api/auth/login - Login com email/senha
 * - POST /api/auth/signup - Registro de novo usuário
 * - POST /api/auth/logout - Logout (invalidar sessão)
 * - POST /api/auth/refresh - Renovar access token
 * - GET /api/auth/me - Dados do usuário autenticado
 * - POST /api/auth/verify-email - Verificar email
 * - POST /api/auth/forgot-password - Solicitar reset de senha
 * - POST /api/auth/reset-password - Resetar senha
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  LoginRequest, 
  SignupRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  RefreshTokenRequest,
  VerifyEmailRequest,
  LoginResponse,
  SignupResponse,
  LogoutResponse,
  RefreshTokenResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  VerifyEmailResponse,
  User,
  DEFAULT_ROLE_REDIRECTS,
  AUTH_CONSTANTS
} from '../../../shared/types/auth.types';
import { getAuthService } from '../services/auth.service';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { GoogleCalendarService } from '../services/google-calendar.service';

export class AuthRoutes {
  private router: Router;
  private prisma: PrismaClient;
  private authService: ReturnType<typeof getAuthService>;
  private authMiddleware: ReturnType<typeof getAuthMiddleware>;
  private googleCalendarService: GoogleCalendarService;

  constructor(prisma: PrismaClient) {
    this.router = Router();
    this.prisma = prisma;
    this.authService = getAuthService(prisma);
    this.authMiddleware = getAuthMiddleware(prisma);
    this.googleCalendarService = new GoogleCalendarService();
    
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Rotas públicas
    this.router.post('/login', 
      this.authMiddleware.validateLoginData,
      this.authMiddleware.rateLimitLogin(),
      this.login.bind(this)
    );
    
    this.router.post('/signup', 
      this.authMiddleware.validateSignupData,
      this.signup.bind(this)
    );
    
    this.router.post('/forgot-password', 
      this.forgotPassword.bind(this)
    );
    
    this.router.post('/reset-password', 
      this.resetPassword.bind(this)
    );
    
    this.router.post('/verify-email', 
      this.verifyEmail.bind(this)
    );
    
    this.router.post('/refresh', 
      this.refreshToken.bind(this)
    );

    // Rotas de autenticação Google
    this.router.get('/google', 
      this.googleAuth.bind(this)
    );
    
    this.router.get('/google/callback', 
      this.googleCallback.bind(this)
    );

    this.router.post('/google/create-user', 
      this.googleCreateUser.bind(this)
    );

    // Rotas protegidas
    this.router.post('/logout', 
      this.authMiddleware.requireAuth(),
      this.logout.bind(this)
    );
    
    this.router.get('/me', 
      this.authMiddleware.requireAuth(),
      this.getMe.bind(this)
    );
  }

  // ============================================================================
  // ROTAS PÚBLICAS
  // ============================================================================

  /**
   * POST /api/auth/login
   * Login com email e senha
   */
  private async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, rememberMe }: LoginRequest = req.body;

      // Buscar usuário por email
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          tenant: true
        }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Email ou senha incorretos'
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

      // Verificar senha
      const isPasswordValid = await this.authService.comparePassword(password, user.password || '');
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Email ou senha incorretos'
        });
        return;
      }

      // Criar sessão
      const session = await this.authService.createSession(
        user.id,
        user.tenantId || 'default-tenant',
        req.ip,
        req.get('User-Agent')
      );

      // Gerar tokens
      const accessToken = this.authService.generateAccessToken(user as User);
      const refreshTokenData = await this.authService.createRefreshToken(user.id);

      // Atualizar último login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Determinar redirecionamento baseado na role
      const redirectTo = DEFAULT_ROLE_REDIRECTS[user.role as keyof typeof DEFAULT_ROLE_REDIRECTS];

      const response: LoginResponse = {
        success: true,
        user: user as User,
        accessToken,
        refreshToken: refreshTokenData.token,
        expiresIn: this.authService.parseExpiration(this.authService.getConfig().jwtAccessExpiresIn),
        redirectTo,
        message: 'Login realizado com sucesso'
      };

      res.json(response);
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        error: 'LOGIN_FAILED',
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/auth/signup
   * Registro de novo usuário
   */
  private async signup(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName, email, password, phone, tenantId }: SignupRequest = req.body;

      // Verificar se email já existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'EMAIL_ALREADY_EXISTS',
          message: 'Email já está em uso'
        });
        return;
      }

      // Determinar tenant (padrão se não especificado)
      let userTenantId = tenantId;
      if (!userTenantId) {
        const defaultTenant = await this.prisma.tenant.findFirst({
          where: { subdomain: 'default' }
        });
        userTenantId = defaultTenant?.id || 'default-tenant';
      }

      // Verificar se tenant existe
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: userTenantId }
      });

      if (!tenant) {
        res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant não encontrado'
        });
        return;
      }

      // Hash da senha
      const hashedPassword = await this.authService.hashPassword(password);

      // Criar usuário
      const newUser = await this.prisma.user.create({
        data: {
          firstName,
          lastName,
          email: email.toLowerCase(),
          password: hashedPassword,
          phone,
          role: 'CLIENT', // Role padrão para novos usuários
          status: 'ACTIVE',
          tenantId: userTenantId,
          emailVerified: false // Requer verificação de email
        },
        include: {
          tenant: true
        }
      });

      // Criar sessão
      const session = await this.authService.createSession(
        newUser.id,
        newUser.tenantId || 'default-tenant',
        req.ip,
        req.get('User-Agent')
      );

      // Gerar tokens
      const accessToken = this.authService.generateAccessToken(newUser as User);
      const refreshTokenData = await this.authService.createRefreshToken(newUser.id);

      const response: SignupResponse = {
        success: true,
        user: newUser as User,
        accessToken,
        refreshToken: refreshTokenData.token,
        expiresIn: this.authService.parseExpiration(this.authService.getConfig().jwtAccessExpiresIn),
        requiresEmailVerification: true,
        message: 'Usuário criado com sucesso'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Erro no signup:', error);
      res.status(500).json({
        success: false,
        error: 'SIGNUP_FAILED',
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Solicitar reset de senha
   */
  private async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email }: ForgotPasswordRequest = req.body;

      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      // Sempre retornar sucesso por segurança (não revelar se email existe)
      const response: ForgotPasswordResponse = {
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha'
      };

      if (!user) {
        res.json(response);
        return;
      }

      // Gerar token de reset
      const resetToken = this.authService.generateAccessToken(user as User);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Salvar token de verificação
      await this.prisma.verification.create({
        data: {
          id: `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          identifier: user.email,
          value: resetToken,
          expiresAt
        }
      });

      // TODO: Enviar email com link de reset
      // Por enquanto, apenas logar o token
      console.log(`Token de reset para ${email}: ${resetToken}`);

      res.json(response);
    } catch (error) {
      console.error('Erro no forgot-password:', error);
      res.status(500).json({
        success: false,
        error: 'FORGOT_PASSWORD_FAILED',
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Resetar senha com token
   */
  private async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password, confirmPassword }: ResetPasswordRequest = req.body;

      if (password !== confirmPassword) {
        res.status(400).json({
          success: false,
          error: 'PASSWORDS_DO_NOT_MATCH',
          message: 'Senhas não coincidem'
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

      // Buscar token de verificação
      const verification = await this.prisma.verification.findFirst({
        where: {
          value: token,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!verification) {
        res.status(400).json({
          success: false,
          error: 'INVALID_RESET_TOKEN',
          message: 'Token de reset inválido ou expirado'
        });
        return;
      }

      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { email: verification.identifier }
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado'
        });
        return;
      }

      // Hash da nova senha
      const hashedPassword = await this.authService.hashPassword(password);

      // Atualizar senha
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      // Remover token de verificação
      await this.prisma.verification.delete({
        where: { id: verification.id }
      });

      // Invalidar todas as sessões do usuário
      await this.authService.deleteUserSessions(user.id);
      await this.authService.deleteUserRefreshTokens(user.id);

      const response: ResetPasswordResponse = {
        success: true,
        message: 'Senha redefinida com sucesso'
      };

      res.json(response);
    } catch (error) {
      console.error('Erro no reset-password:', error);
      res.status(500).json({
        success: false,
        error: 'RESET_PASSWORD_FAILED',
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/auth/verify-email
   * Verificar email com token
   */
  private async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token }: VerifyEmailRequest = req.body;

      // Buscar token de verificação
      const verification = await this.prisma.verification.findFirst({
        where: {
          value: token,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!verification) {
        res.status(400).json({
          success: false,
          error: 'INVALID_VERIFICATION_TOKEN',
          message: 'Token de verificação inválido ou expirado'
        });
        return;
      }

      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { email: verification.identifier }
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado'
        });
        return;
      }

      // Marcar email como verificado
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      });

      // Remover token de verificação
      await this.prisma.verification.delete({
        where: { id: verification.id }
      });

      const response: VerifyEmailResponse = {
        success: true,
        message: 'Email verificado com sucesso'
      };

      res.json(response);
    } catch (error) {
      console.error('Erro no verify-email:', error);
      res.status(500).json({
        success: false,
        error: 'VERIFY_EMAIL_FAILED',
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Renovar access token
   */
  private async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenRequest = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'REFRESH_TOKEN_REQUIRED',
          message: 'Refresh token é obrigatório'
        });
        return;
      }

      // Validar refresh token
      const refreshTokenData = await this.authService.validateRefreshToken(refreshToken);
      if (!refreshTokenData) {
        res.status(401).json({
          success: false,
          error: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token inválido ou expirado'
        });
        return;
      }

      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { id: refreshTokenData.userId },
        include: {
          tenant: true
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        res.status(401).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado ou inativo'
        });
        return;
      }

      // Gerar novo access token
      const accessToken = this.authService.generateAccessToken(user as User);

      // Gerar novo refresh token
      const newRefreshTokenData = await this.authService.createRefreshToken(user.id);

      // Remover refresh token antigo
      await this.authService.deleteRefreshToken(refreshToken);

      const response: RefreshTokenResponse = {
        success: true,
        accessToken,
        refreshToken: newRefreshTokenData.token,
        expiresIn: this.authService.parseExpiration(this.authService.getConfig().jwtAccessExpiresIn)
      };

      res.json(response);
    } catch (error) {
      console.error('Erro no refresh token:', error);
      res.status(500).json({
        success: false,
        error: 'REFRESH_TOKEN_FAILED',
        message: 'Erro interno do servidor'
      });
    }
  }

  // ============================================================================
  // ROTAS PROTEGIDAS
  // ============================================================================

  /**
   * POST /api/auth/logout
   * Logout (invalidar sessão)
   */
  private async logout(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as User;
      const sessionId = (req as any).session?.id;

      if (sessionId) {
        await this.authService.deleteSession(sessionId);
      }

      // Remover todos os refresh tokens do usuário
      await this.authService.deleteUserRefreshTokens(user.id);

      const response: LogoutResponse = {
        success: true,
        message: 'Logout realizado com sucesso'
      };

      res.json(response);
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        error: 'LOGOUT_FAILED',
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/auth/me
   * Dados do usuário autenticado
   */
  private async getMe(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as User;

      // Buscar dados completos do usuário
      const fullUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          tenant: true
        }
      });

      if (!fullUser) {
        res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        user: fullUser as User
      });
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      res.status(500).json({
        success: false,
        error: 'GET_USER_FAILED',
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/auth/google
   * Iniciar autenticação com Google
   */
  private async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.query;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'TENANT_REQUIRED',
          message: 'Tenant ID é obrigatório'
        });
        return;
      }

      // Gerar URL de autorização do Google
      const authUrl = this.googleCalendarService.getAuthUrl('temp', tenantId as string);
      
      res.json({
        success: true,
        authUrl
      });
    } catch (error) {
      console.error('Erro ao gerar URL do Google:', error);
      res.status(500).json({
        success: false,
        error: 'GOOGLE_AUTH_FAILED',
        message: 'Erro ao iniciar autenticação com Google'
      });
    }
  }

  /**
   * GET /api/auth/google/callback
   * Callback de autenticação do Google
   */
  private async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        res.status(400).json({
          success: false,
          error: 'INVALID_CALLBACK',
          message: 'Código de autorização inválido'
        });
        return;
      }

      // Processar callback do Google
      const result = await this.googleCalendarService.handleCallback(code as string, state as string);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'GOOGLE_CALLBACK_FAILED',
          message: result.message
        });
        return;
      }

      // Parse do state para obter dados do usuário
      const stateData = JSON.parse(state as string);
      const { userId, tenantId } = stateData;

      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { tenant: true }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado'
        });
        return;
      }

      // Criar sessão
      const session = await this.authService.createSession(
        user.id,
        user.tenantId || tenantId,
        req.ip,
        req.get('User-Agent')
      );

      // Gerar tokens
      const accessToken = this.authService.generateAccessToken(user as User);
      const refreshToken = this.authService.generateRefreshToken(user as User);
      
      // Salvar refresh token
      await this.authService.createRefreshToken(user.id);

      // Redirecionar para o frontend com tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/google-success?token=${accessToken}&refresh=${refreshToken}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Erro no callback do Google:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/google-error`);
    }
  }

  /**
   * POST /api/auth/google/create-user
   * Criar usuário via Google OAuth
   */
  private async googleCreateUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, googleId, tenantId } = req.body;

      if (!email || !name || !googleId || !tenantId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_DATA',
          message: 'Email, nome, Google ID e tenant são obrigatórios'
        });
        return;
      }

      // Verificar se usuário já existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'USER_EXISTS',
          message: 'Usuário já existe com este email'
        });
        return;
      }

      // Verificar se tenant existe
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant não encontrado'
        });
        return;
      }

      // Criar usuário
      const newUser = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          role: 'CLIENT', // Role padrão para usuários criados via Google
          status: 'ACTIVE',
          tenantId,
          emailVerified: true, // Google já verificou o email
          googleId, // Campo para armazenar ID do Google
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          tenant: true
        }
      });

      // Criar sessão
      const session = await this.authService.createSession(
        newUser.id,
        tenantId,
        req.ip,
        req.get('User-Agent')
      );

      // Gerar tokens
      const accessToken = this.authService.generateAccessToken(newUser as User);
      const refreshToken = this.authService.generateRefreshToken(newUser as User);
      
      // Salvar refresh token
      await this.authService.createRefreshToken(newUser.id);

      const response: LoginResponse = {
        success: true,
        user: newUser as User,
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour
        redirectTo: DEFAULT_ROLE_REDIRECTS[newUser.role || 'CLIENT'] || '/dashboard'
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao criar usuário via Google:', error);
      res.status(500).json({
        success: false,
        error: 'USER_CREATION_FAILED',
        message: 'Erro ao criar usuário'
      });
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  public getRouter(): Router {
    return this.router;
  }
}

// Instância singleton das rotas
let authRoutesInstance: AuthRoutes | null = null;

export function getAuthRoutes(prisma: PrismaClient): AuthRoutes {
  if (!authRoutesInstance) {
    authRoutesInstance = new AuthRoutes(prisma);
  }
  return authRoutesInstance;
}
