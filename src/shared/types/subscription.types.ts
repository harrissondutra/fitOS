/**
 * Tipos TypeScript Compartilhados para Subscriptions - FitOS
 * 
 * Este arquivo define todas as interfaces e tipos relacionados a planos e assinaturas
 * que são compartilhados entre backend e frontend.
 */

// ============================================================================
// TIPOS DE PLANO E DOCUMENTOS
// ============================================================================

export type TenantType = 'individual' | 'business';

export type DocumentType = 'cpf' | 'cnpj';

export type SubscriptionPlan = 
  | 'free'                // Pessoa física (CPF) - gratuito
  | 'professional-cpf'    // Pessoa física com upgrade (CPF) - preço maior
  | 'professional-cnpj'   // Profissional (CNPJ) - preço normal
  | 'enterprise';         // Empresa grande (CNPJ obrigatório)

export type PlanBillingCycle = 'monthly' | 'yearly';

export type SubscriptionStatus = 'trial' | 'active' | 'canceled' | 'past_due' | 'expired';

// ============================================================================
// FEATURES E LIMITES DE PLANOS
// ============================================================================

export interface PlanFeatures {
  canManageClients: boolean;
  canHireTeam: boolean;
  canAccessMarketplace: boolean;
  canAccessCRM: boolean;
  canUseWhiteLabel: boolean;
  canGenerateReports: boolean;
  canAccessAnalytics: boolean;
  canManageBioimpedance: boolean;
  canManageNutrition: boolean;
  canManageWorkouts: boolean;
}

export interface PlanLimits {
  clients: number;           // -1 = ilimitado
  trainers: number;
  nutritionists: number;
  admins: number;
  storageGB: number;
  apiCalls: number;
  reports: number;
}

// ============================================================================
// CONFIGURAÇÃO DE PLANO
// ============================================================================

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  description: string;
  tenantType: TenantType;
  requiresDocument: DocumentType;
  price: {
    monthly: number;
    yearly: number;
  };
  currency: 'BRL';
  trialDays: number;
  features: PlanFeatures;
  limits: PlanLimits;
  stripePriceId?: {
    monthly: string;
    yearly: string;
  };
  mercadoPagoPreferenceId?: string;
  recommended?: boolean;
  popular?: boolean;
}

// ============================================================================
// ONBOARDING DATA
// ============================================================================

export interface OnboardingData {
  accountType: 'individual' | 'business';  // PF ou Profissional
  documentType: 'cpf' | 'cnpj';
  documentNumber: string;
  plan: SubscriptionPlan;
  enableTrial?: boolean;
  billingCycle?: PlanBillingCycle;
}

// ============================================================================
// TRIAL DATA
// ============================================================================

export interface TrialData {
  tenantId: string;
  plan: SubscriptionPlan;
  startedAt: Date;
  endsAt: Date;
  status: SubscriptionStatus;
}

// ============================================================================
// UPGRADE/DOWNGRADE DATA
// ============================================================================

export interface PlanChangeRequest {
  tenantId: string;
  currentPlan: SubscriptionPlan;
  newPlan: SubscriptionPlan;
  billingCycle: PlanBillingCycle;
  reason?: string;
}

export interface PlanChangeValidation {
  allowed: boolean;
  reason?: string;
  warnings?: string[];
  currentUsage?: {
    clients: number;
    trainers: number;
    nutritionists: number;
    storageGB: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Para pessoas físicas acompanharem seu treino e dieta',
    tenantType: 'individual',
    requiresDocument: 'cpf',
    price: { monthly: 0, yearly: 0 },
    currency: 'BRL',
    trialDays: 0,
    features: {
      canManageClients: false,
      canHireTeam: false,
      canAccessMarketplace: false,
      canAccessCRM: false,
      canUseWhiteLabel: false,
      canGenerateReports: false,
      canAccessAnalytics: false,
      canManageBioimpedance: false,
      canManageNutrition: false,
      canManageWorkouts: false,
    },
    limits: {
      clients: 0,
      trainers: 0,
      nutritionists: 0,
      admins: 0,
      storageGB: 1,
      apiCalls: 100,
      reports: 0,
    },
  },
  {
    id: 'professional-cnpj',
    name: 'Professional',
    description: 'Para profissionais e academias pequenas/médias',
    tenantType: 'business',
    requiresDocument: 'cnpj',
    price: { monthly: 99.90, yearly: 959.00 },
    currency: 'BRL',
    trialDays: 7,
    features: {
      canManageClients: true,
      canHireTeam: true,
      canAccessMarketplace: true,
      canAccessCRM: true,
      canUseWhiteLabel: false,
      canGenerateReports: true,
      canAccessAnalytics: true,
      canManageBioimpedance: true,
      canManageNutrition: true,
      canManageWorkouts: true,
    },
    limits: {
      clients: 200,
      trainers: 5,
      nutritionists: 3,
      admins: 2,
      storageGB: 50,
      apiCalls: 5000,
      reports: 100,
    },
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes academias e redes',
    tenantType: 'business',
    requiresDocument: 'cnpj',
    price: { monthly: 399.90, yearly: 3839.00 },
    currency: 'BRL',
    trialDays: 7,
    features: {
      canManageClients: true,
      canHireTeam: true,
      canAccessMarketplace: true,
      canAccessCRM: true,
      canUseWhiteLabel: true,
      canGenerateReports: true,
      canAccessAnalytics: true,
      canManageBioimpedance: true,
      canManageNutrition: true,
      canManageWorkouts: true,
    },
    limits: {
      clients: -1,
      trainers: -1,
      nutritionists: -1,
      admins: -1,
      storageGB: 500,
      apiCalls: -1,
      reports: -1,
    },
  },
];

