/**
 * Tipos TypeScript Compartilhados para Autenticação - FitOS
 * 
 * Este arquivo define todas as interfaces e tipos relacionados à autenticação
 * que são compartilhados entre backend e frontend.
 */

// ============================================================================
// TIPOS DE USUÁRIO E ROLES
// ============================================================================

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'CLIENT';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

export type SidebarView = 'standard' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  tenantId: string;
  profile?: Record<string, any>;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  image?: string;
  preferences?: {
    sidebarView?: SidebarView;
  };
}

// ============================================================================
// REQUESTS DE AUTENTICAÇÃO
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  tenantId?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

// ============================================================================
// RESPONSES DE AUTENTICAÇÃO
// ============================================================================

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  message?: string;
}

export interface LoginResponse extends AuthResponse {
  redirectTo?: string;
}

export interface SignupResponse extends AuthResponse {
  requiresEmailVerification?: boolean;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// TOKENS E SESSÕES
// ============================================================================

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface SessionData {
  id: string;
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
}

export interface RefreshTokenData {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================================================
// MIDDLEWARE E PERMISSÕES
// ============================================================================

export interface AuthenticatedRequest {
  user: User;
  session: SessionData;
  tenantId: string;
}

export interface AuthMiddlewareOptions {
  requiredRole?: UserRole[];
  allowInactive?: boolean;
  requireEmailVerification?: boolean;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  allowed: boolean;
  reason?: string;
}

// ============================================================================
// CONFIGURAÇÕES DE AUTENTICAÇÃO
// ============================================================================

export interface AuthConfig {
  jwtSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  jwtIssuer: string;
  jwtAudience: string;
  sessionInactivityTimeout: number;
  sessionCleanupInterval: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

// ============================================================================
// ERROS DE AUTENTICAÇÃO
// ============================================================================

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'USER_INACTIVE'
  | 'USER_SUSPENDED'
  | 'EMAIL_NOT_VERIFIED'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'REFRESH_TOKEN_INVALID'
  | 'SESSION_EXPIRED'
  | 'SESSION_NOT_FOUND'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'TENANT_NOT_FOUND'
  | 'TENANT_INACTIVE'
  | 'PASSWORD_TOO_WEAK'
  | 'EMAIL_ALREADY_EXISTS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ACCOUNT_LOCKED'
  | 'INVALID_EMAIL_FORMAT'
  | 'PASSWORDS_DO_NOT_MATCH'
  | 'INVALID_RESET_TOKEN'
  | 'RESET_TOKEN_EXPIRED'
  | 'UNKNOWN_ERROR';

// ============================================================================
// ATIVIDADE E TRACKING
// ============================================================================

export interface ActivityEvent {
  type: 'click' | 'scroll' | 'keypress' | 'mousemove' | 'focus' | 'blur';
  timestamp: Date;
  sessionId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface ActivityTrackerConfig {
  pingInterval: number;
  inactivityWarning: number;
  inactivityTimeout: number;
  eventsToTrack: string[];
}

// ============================================================================
// REDIRECIONAMENTO POR ROLE
// ============================================================================

export type RoleRedirectConfig = {
  [key in UserRole]: string;
}

export const DEFAULT_ROLE_REDIRECTS: RoleRedirectConfig = {
  SUPER_ADMIN: '/super-admin/dashboard',
  OWNER: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  TRAINER: '/trainer/dashboard',
  CLIENT: '/client/workouts'
};

// ============================================================================
// VALIDAÇÃO DE SENHA
// ============================================================================

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
  suggestions: string[];
}

// ============================================================================
// ESTATÍSTICAS DE AUTENTICAÇÃO
// ============================================================================

export interface AuthStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  usersByRole: Record<UserRole, number>;
  recentLogins: number;
  failedLogins: number;
  sessionsActive: number;
  sessionsExpired: number;
}

// ============================================================================
// WEBHOOKS E EVENTOS
// ============================================================================

export interface AuthEvent {
  type: 'login' | 'logout' | 'signup' | 'password_reset' | 'email_verified' | 'account_locked';
  userId: string;
  tenantId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AuthWebhookPayload {
  event: AuthEvent;
  signature: string;
  timestamp: number;
}

// ============================================================================
// UTILITÁRIOS DE TIPO
// ============================================================================

export type AuthResponseType = 
  | LoginResponse 
  | SignupResponse 
  | RefreshTokenResponse 
  | LogoutResponse 
  | ForgotPasswordResponse 
  | ResetPasswordResponse 
  | VerifyEmailResponse;

export type AuthRequestType = 
  | LoginRequest 
  | SignupRequest 
  | ForgotPasswordRequest 
  | ResetPasswordRequest 
  | RefreshTokenRequest 
  | VerifyEmailRequest;

// ============================================================================
// CONSTANTES
// ============================================================================

export const AUTH_CONSTANTS = {
  // Tempos em milissegundos
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hora
  REFRESH_TOKEN_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 dias
  ACTIVITY_PING_INTERVAL: 5 * 60 * 1000, // 5 minutos
  INACTIVITY_WARNING: 5 * 60 * 1000, // 5 minutos antes do logout
  
  // Configurações de senha
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  
  // Limites de rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutos
  
  // Configurações de token
  JWT_ISSUER: 'fitos',
  JWT_AUDIENCE: 'fitos-app',
  
  // Roles hierárquicas
  ROLE_HIERARCHY: {
    SUPER_ADMIN: 5,
    OWNER: 4,
    ADMIN: 3,
    TRAINER: 2,
    CLIENT: 1
  }
} as const;

// ============================================================================
// HELPERS DE TIPO
// ============================================================================

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type NonNullable<T> = T extends null | undefined ? never : T;
