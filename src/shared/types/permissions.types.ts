/**
 * Tipos Unificados para Sistema de Permissões e Planos - FitOS
 * 
 * Este arquivo centraliza todos os tipos relacionados a:
 * - Roles (quem pode fazer o quê)
 * - Permissões (capabilities)
 * - Features do plano (o que está habilitado)
 * - Limites do plano (quantidades)
 */

// ============================================================================
// ROLES (Hierarquia de Usuários)
// ============================================================================

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'PROFESSIONAL' | 'EMPLOYEE' | 'CLIENT';

export type ProfessionalSpecialization = 
  | 'trainer'
  | 'nutritionist'
  | 'coach'
  | 'physiotherapist'
  | 'instructor';

export type PlanFeature = 
  | 'whatsapp'
  | 'crm'
  | 'marketplace'
  | 'whiteLabel'
  | 'apiAccess'
  | 'aiAgents'
  | 'nutrition'
  | 'analytics'
  | 'bioimpedance'
  | 'appointments'
  | 'marketing';

export type PlanType = 'starter' | 'professional' | 'enterprise' | 'custom';

// ============================================================================
// PERMISSIONS (Capabilities por Role)
// ============================================================================

export enum Permission {
  // User Management
  USERS_VIEW = 'users.view',
  USERS_CREATE = 'users.create',
  USERS_UPDATE = 'users.update',
  USERS_DELETE = 'users.delete',
  
  // Client Management
  CLIENTS_VIEW = 'clients.view',
  CLIENTS_CREATE = 'clients.create',
  CLIENTS_UPDATE = 'clients.update',
  CLIENTS_DELETE = 'clients.delete',
  
  // Workouts
  WORKOUTS_VIEW = 'workouts.view',
  WORKOUTS_CREATE = 'workouts.create',
  WORKOUTS_UPDATE = 'workouts.update',
  WORKOUTS_DELETE = 'workouts.delete',
  
  // Exercises
  EXERCISES_VIEW = 'exercises.view',
  EXERCISES_CREATE = 'exercises.create',
  EXERCISES_UPDATE = 'exercises.update',
  EXERCISES_DELETE = 'exercises.delete',
  
  // Nutrition
  NUTRITION_MANAGE_CLIENTS = 'nutrition.manage_clients',
  NUTRITION_CREATE_MEAL_PLANS = 'nutrition.create_meal_plans',
  NUTRITION_VIEW_ALL_DIARIES = 'nutrition.view_all_diaries',
  
  // CRM
  CRM_ACCESS = 'crm.access',
  CRM_CREATE_DEALS = 'crm.create_deals',
  CRM_MANAGE_PIPELINES = 'crm.manage_pipelines',
  
  // WhatsApp
  WHATSAPP_ACCESS = 'whatsapp.access',
  WHATSAPP_SEND_MESSAGES = 'whatsapp.send_messages',
  WHATSAPP_MANAGE_TEMPLATES = 'whatsapp.manage_templates',
  
  // Analytics
  ANALYTICS_VIEW = 'analytics.view',
  ANALYTICS_VIEW_GLOBAL = 'analytics.view_global',
  ANALYTICS_EXPORT = 'analytics.export',
  
  // Settings & Configuration
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_UPDATE = 'settings.update',
  PLAN_LIMITS_MANAGE = 'plan_limits.manage',
  
  // Marketing
  MARKETING_ACCESS = 'marketing.child',
  MARKETING_CREATE_CAMPAIGNS = 'marketing.create_campaigns',
}

// ============================================================================
// PLAN LIMITS (Quantidades e Recursos)
// ============================================================================

export interface PlanLimits {
  users: number;           // -1 = ilimitado
  clients: number;         // -1 = ilimitado
  storageGB: number;       // GB
  aiTokensPerMonth: number;
  apiCallsPerMonth?: number;
  integrations?: number;
  reports?: number;
  webhooks?: number;
  backups?: number;
}

export interface PlanFeatures {
  whatsapp: boolean;
  crm: boolean;
  marketplace: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  aiAgents: boolean;
  nutrition: boolean;
  analytics: boolean;
  grandma4: boolean;
  appointments: boolean;
  marketing: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  currency: string;
  features: string[];
  limits: PlanLimits;
  featureFlags: PlanFeatures;
  popular?: boolean;
  recommended?: boolean;
  stripePriceId?: {
    monthly: string;
    yearly: string;
  };
}

// ============================================================================
// USER ENTITY (Atualizado com campos necessários)
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  phone?: string;
  role: UserRole;
  professionalSpecialization?: ProfessionalSpecialization;
  employeePermissions?: Permission[]; // Para role EMPLOYEE
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tenantId: string;
  profile?: Record<string, any>;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  image?: string;
}

// ============================================================================
// VALIDATION RESULT (Para verificações de limite)
// ============================================================================

export interface ValidationResult {
  allowed: boolean;
  current: number;
  limit: number;
  available: number;
  reason?: string;
}

// ============================================================================
// ABUSE DETECTION (Para prevenção de pricing abuse)
// ============================================================================

export interface AbuseRisk {
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  flags: AbuseFlag[];
  relatedTenants?: string[];
  requiresManualReview: boolean;
  recommendation: string;
}

export interface AbuseFlag {
  type: 'SAME_EMAIL' | 'RELATED_CNPJ' | 'SAME_EMAIL_DOMAIN' | 'GEOGRAPHIC_PROXIMITY' | 'SIMILAR_NAME';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  details: Record<string, any>;
}

// ============================================================================
// CUSTOM PLAN (Para empresas multi-filial)
// ============================================================================

export interface CustomPlan {
  id: string;
  name: string;
  tenantId: string; // Tenant principal
  tenantIds: string[]; // Filiais
  monthlyPrice: number;
  setupFee: number;
  limitsPerLocation: PlanLimits;
  maxLocations: number; // -1 = ilimitado
  features: PlanFeatures;
  status: 'active' | 'suspended' | 'cancelled';
  createdBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// TENANT ABUSE ALERT
// ============================================================================

export interface TenantAbuseAlert {
  tenantId: string;
  tenantName: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  flags: string[];
  relatedTenants: string[];
  createdAt: Date;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED';
  reviewedBy?: string;
  reviewedAt?: Date;
}

















