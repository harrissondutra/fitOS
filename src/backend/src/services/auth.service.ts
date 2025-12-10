/**
 * Serviço de Autenticação - FitOS
 * 
 * Este serviço gerencia toda a lógica de autenticação incluindo:
 * - Hash e verificação de senhas
 * - Geração e validação de JWT tokens
 * - Gerenciamento de sessões
 * - Refresh tokens
 * - Limpeza de sessões expiradas
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { 
  User, 
  UserRole, 
  TokenPayload, 
  SessionData, 
  RefreshTokenData,
  AuthConfig,
  PasswordValidationResult,
  AUTH_CONSTANTS,
  AuthErrorCode
} from '../../../shared/types/auth.types';
import { sessionService } from './session.service';
import { redisService } from './redis.service';
import { generateCacheKey, calculateTTL } from '../utils/cache-utils';

export class AuthService {
  private _prisma?: PrismaClient;
  private prismaGetter?: () => PrismaClient;
  private config: AuthConfig;

  // Lazy getter para prisma - só cria conexão quando realmente necessário
  private get prisma(): PrismaClient {
    if (!this._prisma) {
      if (this.prismaGetter) {
        this._prisma = this.prismaGetter();
      } else {
        // Fallback: obter do singleton se não foi fornecido getter
        const { getPrismaClient } = require('../config/database');
        this._prisma = getPrismaClient();
      }
    }
    return this._prisma;
  }

  constructor(prisma?: PrismaClient | (() => PrismaClient)) {
    if (typeof prisma === 'function') {
      this.prismaGetter = prisma;
    } else if (prisma) {
      this._prisma = prisma;
    }
    this.config = this.loadConfig();
  }

  private loadConfig(): AuthConfig {
    return {
      jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key-minimum-32-characters',
      jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      jwtIssuer: process.env.JWT_ISSUER || AUTH_CONSTANTS.JWT_ISSUER,
      jwtAudience: process.env.JWT_AUDIENCE || AUTH_CONSTANTS.JWT_AUDIENCE,
      sessionInactivityTimeout: parseInt(process.env.SESSION_INACTIVITY_TIMEOUT || AUTH_CONSTANTS.SESSION_TIMEOUT.toString()),
      sessionCleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || AUTH_CONSTANTS.SESSION_TIMEOUT.toString()),
      passwordMinLength: AUTH_CONSTANTS.PASSWORD_MIN_LENGTH,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
      maxLoginAttempts: AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS,
      lockoutDuration: AUTH_CONSTANTS.LOCKOUT_DURATION
    };
  }

  // ============================================================================
  // HASH E VERIFICAÇÃO DE SENHAS
  // ============================================================================

  /**
   * Gera hash da senha usando bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verifica se a senha corresponde ao hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Obtém configurações de autenticação
   */
  getConfig(): AuthConfig {
    return this.config;
  }

  /**
   * Converte string de expiração para segundos
   */
  parseExpiration(expiration: string): number {
    const units: { [key: string]: number } = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
      'w': 604800,
      'M': 2592000,
      'y': 31536000
    };

    const match = expiration.match(/^(\d+)([smhdwMy])$/);
    if (!match) {
      throw new Error(`Formato de expiração inválido: ${expiration}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];
    return value * units[unit];
  }

  /**
   * Valida força da senha
   */
  validatePassword(password: string): PasswordValidationResult {
    const requirements = {
      minLength: password.length >= this.config.passwordMinLength,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length * 20;
    const isValid = Object.values(requirements).every(Boolean);

    const suggestions: string[] = [];
    if (!requirements.minLength) {
      suggestions.push(`Senha deve ter pelo menos ${this.config.passwordMinLength} caracteres`);
    }
    if (!requirements.hasUppercase) {
      suggestions.push('Adicione pelo menos uma letra maiúscula');
    }
    if (!requirements.hasLowercase) {
      suggestions.push('Adicione pelo menos uma letra minúscula');
    }
    if (!requirements.hasNumbers) {
      suggestions.push('Adicione pelo menos um número');
    }
    if (!requirements.hasSpecialChars) {
      suggestions.push('Adicione pelo menos um caractere especial');
    }

    return {
      isValid,
      score,
      requirements,
      suggestions
    };
  }

  // ============================================================================
  // GERAÇÃO E VALIDAÇÃO DE TOKENS JWT
  // ============================================================================

  /**
   * Gera access token JWT
   */
  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || 'default-tenant',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiration(this.config.jwtAccessExpiresIn),
      iss: this.config.jwtIssuer,
      aud: this.config.jwtAudience
    };

    return jwt.sign(payload, this.config.jwtSecret);
  }

  /**
   * Gera refresh token JWT
   */
  generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId || 'default-tenant',
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiration(this.config.jwtRefreshExpiresIn),
      iss: this.config.jwtIssuer,
      aud: this.config.jwtAudience
    };

    return jwt.sign(payload, this.config.jwtSecret);
  }

  /**
   * Verifica e decodifica token JWT
   */
  verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        issuer: this.config.jwtIssuer,
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('INVALID_TOKEN');
      } else {
        throw new Error('TOKEN_VERIFICATION_FAILED');
      }
    }
  }


  // ============================================================================
  // GERENCIAMENTO DE SESSÕES
  // ============================================================================

  /**
   * Cria nova sessão no banco de dados
   */
  async createSession(
    userId: string, 
    tenantId: string, 
    ipAddress?: string, 
    userAgent?: string,
    deviceFingerprint?: any // Adicionar fingerprint opcional
  ): Promise<SessionData> {
    // Obter dados do usuário para a sessão
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Criar sessão usando SessionService (agora com fingerprint)
    const result = await sessionService.createSession(
      userId,
      tenantId,
      user.role || 'CLIENT',
      user.email,
      ipAddress || 'unknown',
      userAgent || 'unknown',
      deviceFingerprint // Passar fingerprint
    );
    
    const sessionId = typeof result === 'object' ? result.sessionId : result;

    const expiresAt = new Date(Date.now() + this.config.sessionInactivityTimeout);
    
    // Salvar sessão no banco de dados também (para auditoria)
    const session = await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        token: this.generateSessionToken(),
        expiresAt,
        ipAddress,
        userAgent
      }
    });

    return {
      id: session.id,
      userId: session.userId,
      tenantId,
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      lastActivity: session.updatedAt
    };
  }

  /**
   * Atualiza última atividade da sessão
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { 
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.sessionInactivityTimeout)
      }
    });
  }

  /**
   * Busca sessão por ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) return null;

    // Buscar tenantId do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      select: { tenantId: true }
    });

    if (!user) return null;

    return {
      id: session.id,
      userId: session.userId,
      tenantId: user.tenantId || 'default-tenant',
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      lastActivity: session.updatedAt
    };
  }

  /**
   * Remove sessão do banco de dados
   */
  async deleteSession(sessionId: string): Promise<void> {
    // Invalidar no Redis
    await sessionService.invalidateSession(sessionId);

    // Remover do banco usando deleteMany (mais seguro)
    await this.prisma.session.deleteMany({
      where: { id: sessionId }
    });
  }

  /**
   * Remove todas as sessões de um usuário
   */
  async deleteUserSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId }
    });
  }

  /**
   * Limpa sessões expiradas
   */
  async cleanExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return result.count;
  }

  // ============================================================================
  // GERENCIAMENTO DE REFRESH TOKENS
  // ============================================================================

  /**
   * Cria refresh token no banco de dados
   */
  async createRefreshToken(userId: string): Promise<RefreshTokenData> {
    const token = this.generateRefreshToken({ 
      id: userId, 
      email: '', 
      role: 'CLIENT', 
      tenantId: '', 
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false
    } as User);
    
    const expiresAt = new Date(Date.now() + this.parseExpiration(this.config.jwtRefreshExpiresIn) * 1000);

    // Primeiro, remover tokens antigos do usuário
    await this.prisma.refreshToken.deleteMany({
      where: { userId }
    });

    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt
      }
    });

    return {
      id: refreshToken.id,
      token: refreshToken.token,
      userId: refreshToken.userId,
      expiresAt: refreshToken.expiresAt,
      createdAt: refreshToken.createdAt
    };
  }

  /**
   * Valida refresh token
   */
  async validateRefreshToken(token: string): Promise<RefreshTokenData | null> {
    try {
      // Verificar se token existe no banco
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token }
      });

      if (!refreshToken) return null;

      // Verificar se não expirou
      if (refreshToken.expiresAt < new Date()) {
        await this.prisma.refreshToken.delete({
          where: { id: refreshToken.id }
        });
        return null;
      }

      return {
        id: refreshToken.id,
        token: refreshToken.token,
        userId: refreshToken.userId,
        expiresAt: refreshToken.expiresAt,
        createdAt: refreshToken.createdAt
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove refresh token
   */
  async deleteRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token }
    });
  }

  /**
   * Remove todos os refresh tokens de um usuário
   */
  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId }
    });
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  /**
   * Gera ID único para sessão
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gera token único para sessão
   */
  private generateSessionToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verifica se usuário tem permissão baseada em role
   */
  hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    const roleHierarchy = AUTH_CONSTANTS.ROLE_HIERARCHY;
    const userLevel = roleHierarchy[userRole];
    
    return requiredRoles.some(role => {
      const requiredLevel = roleHierarchy[role];
      return userLevel >= requiredLevel;
    });
  }

  /**
   * Verifica se sessão está ativa (não expirada)
   */
  isSessionActive(session: SessionData): boolean {
    return session.expiresAt > new Date();
  }

  /**
   * Calcula tempo restante da sessão em milissegundos
   */
  getSessionTimeRemaining(session: SessionData): number {
    return session.expiresAt.getTime() - Date.now();
  }

  /**
   * Verifica se sessão está próxima de expirar
   */
  isSessionNearExpiry(session: SessionData, warningTime: number = 5 * 60 * 1000): boolean {
    return this.getSessionTimeRemaining(session) <= warningTime;
  }

  // ============================================================================
  // JOBS DE LIMPEZA
  // ============================================================================

  /**
   * Executa limpeza completa de dados expirados
   */
  async performCleanup(): Promise<{ sessions: number; refreshTokens: number }> {
    const sessionsCleaned = await this.cleanExpiredSessions();
    
    const refreshTokensCleaned = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return {
      sessions: sessionsCleaned,
      refreshTokens: refreshTokensCleaned.count
    };
  }

  /**
   * Inicia job de limpeza automática
   */
  startCleanupJob(): ReturnType<typeof setInterval> {
    return setInterval(async () => {
      try {
        const result = await this.performCleanup();
        console.log(`🧹 Cleanup executado: ${result.sessions} sessões e ${result.refreshTokens} refresh tokens removidos`);
      } catch (error) {
        console.error('❌ Erro durante cleanup:', error);
      }
    }, this.config.sessionCleanupInterval);
  }
}

// Instância singleton do serviço
let authServiceInstance: AuthService | null = null;

// Lazy getter para garantir que PrismaClient seja obtido apenas quando necessário
function getPrismaClientLazy(): PrismaClient {
  const { getPrismaClient } = require('../config/database');
  return getPrismaClient();
}

export function getAuthService(prisma?: PrismaClient): AuthService {
  // Se já existe instância, retornar ela (usa singleton sempre)
  // Usar lazy getter para evitar criar conexão prematuramente
  if (!authServiceInstance) {
    if (prisma) {
      // Se prisma foi fornecido, usar diretamente
      authServiceInstance = new AuthService(prisma);
    } else {
      // Usar lazy getter para obter PrismaClient apenas quando necessário
      authServiceInstance = new AuthService(() => getPrismaClientLazy());
    }
  }
  return authServiceInstance;
}
