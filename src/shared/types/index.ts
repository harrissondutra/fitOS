import React from 'react';

import { User, UserRole, UserRoles, UserStatus } from './auth.types';
export { type User, UserRoles, type UserRole, type UserStatus };
export * from './auth.types';

// Re-export specific types if needed internally (though export * handles external consumers)
// but to use them inside this file without 'user: import("./auth.types").User', we might need to import them?
// Actually, let's just use the export * at the end and remove the local definitions.
// But some interfaces inside this file refer to 'User'.
// It's safer to not rely on global scope resolution if I remove the definition.
// So I will modify the top to import first.

// NOTE: I will do this via a cleaner replace block.
// Since replace_file_content replaces a block, I will replace the top section first.


// Tenant types
export interface Tenant {
  id: string;
  name: string;
  subdomain?: string;
  customDomain?: string;
  plan: string;
  tenantType: TenantType;
  customPlanId?: string;
  planLimits: Record<string, number>;
  extraSlots: Record<string, number>;
  enabledFeatures: Record<string, boolean>;
  status: TenantStatus;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantType = 'individual' | 'business';
export type TenantStatus = 'active' | 'inactive' | 'suspended';

// Plan types
export interface PlanConfig {
  id: string;
  plan: string;
  displayName: string;
  tenantType: TenantType;
  tenantId?: string;
  isCustom: boolean;
  limits: Record<string, number>;
  price: number;
  extraSlotPrice: Record<string, number>;
  features: Record<string, boolean>;
  contractTerms?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface PlanLimits {
  super_admin: number;
  owner: number;
  admin: number;
  trainer: number;
  client: number;
  treinos: number;
  exercises: number;
  storage: number; // in MB
}

// Workout types
export interface Treino {
  id: string;
  name: string;
  description?: string;
  userId: string;
  clientId: string;
  tenantId: string;
  exercises: TreinoExercise[];
  completed: boolean;
  completedAt?: Date;
  aiGenerated: boolean;
  feedback?: any;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  client?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TreinoExercise {
  id: string;
  treinoId: string;
  exerciseId: string;
  sets: number;
  reps?: number;
  weight?: number;
  duration?: number; // in seconds
  restTime?: number; // in seconds
  notes?: string;
  exercise?: {
    id: string;
    name: string;
    description?: string;
    category: string;
  };
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  category: string;
  muscleGroups: string[];
  equipment?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  createdBy: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chat types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  userId: string;
  tenantId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
  timestamp?: string;
  path?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// UI types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface Modal {
  id: string;
  title: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
}

// Analytics types
export interface TreinoStats {
  totalWorkouts: number;
  totalExercises: number;
  totalDuration: number; // in minutes
  averageWorkoutDuration: number; // in minutes
  mostUsedExercises: Array<{
    exercise: Exercise;
    count: number;
  }>;
  weeklyProgress: Array<{
    week: string;
    treinos: number;
    duration: number;
  }>;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
  roleDistribution: Array<{
    role: UserRole;
    count: number;
    percentage: number;
  }>;
}

// AI types
export interface AITreinoRecommendation {
  id: string;
  userId: string;
  treinoType: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  exercises: Array<{
    exercise: Exercise;
    sets: number;
    reps?: number;
    weight?: number;
    duration?: number;
    restTime?: number;
  }>;
  reasoning: string;
  createdAt: Date;
}

export interface AIChatContext {
  userId: string;
  tenantId: string;
  recentWorkouts: Treino[];
  userPreferences: Record<string, any>;
  currentGoals: string[];
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

// User Management types
export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserBulkAction {
  action: 'activate' | 'deactivate' | 'delete' | 'export';
  userIds: string[];
  reason?: string;
}

export interface CSVImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  importedUsers: User[];
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  password?: string;
  status?: UserStatus;
}

export interface UserTableColumn {
  key: keyof User | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface UserTableProps {
  users: User[];
  loading: boolean;
  selectedUsers: string[];
  onSelectUser: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onResetPassword: (user: User) => void;
}

export interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export interface BulkActionsBarProps {
  selectedCount: number;
  onBulkAction: (action: UserBulkAction['action']) => void;
  onExport: () => void;
  onClearSelection: () => void;
}

export interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<CSVImportResult>;
}

// Sidebar types
export interface SidebarMenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: SidebarMenuItem[];
}

export interface SidebarProps {
  userRole: UserRole;
  tenantType?: TenantType;
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  appName: string;
  version: string;
  environment: 'development' | 'production' | 'staging';
  features: {
    aiEnabled: boolean;
    multiTenant: boolean;
    realTimeChat: boolean;
    analytics: boolean;
  };
}

// Sprint 3 - New Types

// Client types
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  membershipType: string;
  status: 'active' | 'inactive' | 'suspended';
  biometricData: any;
  goals: any;
  userId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  trainers?: Array<{
    id: string;
    trainerId: string;
    assignedAt: Date;
    assignedBy: string;
    isActive: boolean;
    trainer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  _count?: {
    treinos: number;
  };
}

export interface ClientFilters {
  search?: string;
  status?: string;
  membershipType?: string;
  trainerId?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  membershipType: string;
  status?: string;
  biometricData?: any;
  goals?: any;
  userId: string;
}

export interface ClientProgress {
  clientId: string;
  clientName: string;
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  lastWorkoutDate?: Date;
  averageWorkoutsPerWeek: number;
  goals: any;
  biometricTrends: {
    weight?: Array<{ date: Date; value: number }>;
    bodyFat?: Array<{ date: Date; value: number }>;
    muscleMass?: Array<{ date: Date; value: number }>;
  };
}

// Activity Log types
export interface ActivityLog {
  id: string;
  tenantId: string;
  clientId?: string;
  userId?: string;
  activityType: string;
  description: string;
  metadata: any;
  createdAt: Date;
  client?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ActivityLogFilters {
  clientId?: string;
  userId?: string;
  activityType?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityLogFormData {
  clientId?: string;
  userId?: string;
  activityType: string;
  description: string;
  metadata?: any;
}

export interface ClientTimeline {
  clientId: string;
  clientName: string;
  activities: Array<{
    id: string;
    activityType: string;
    description: string;
    metadata: any;
    createdAt: Date;
    userId?: string;
    userName?: string;
  }>;
  totalActivities: number;
}

export interface ActivityStats {
  totalActivities: number;
  activitiesByType: Record<string, number>;
  activitiesByDay: Record<string, number>;
  recentActivities: ActivityLog[];
  topActivityTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

// Analytics types
export interface TenantAnalytics {
  totalClients: number;
  totalWorkouts: number;
  totalExercises: number;
  totalActivities: number;
  activeClients: number;
  completedWorkouts: number;
  completionRate: number;
  averageWorkoutsPerClient: number;
  newClientsThisMonth: number;
  retainedClients: number;
  retentionRate: number;
  treinosThisMonth: number;
  activitiesThisMonth: number;
  topExerciseTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  clientGrowth: Array<{
    date: string;
    count: number;
  }>;
  treinoTrends: Array<{
    date: string;
    count: number;
  }>;
  activityTrends: Array<{
    date: string;
    count: number;
  }>;
}

export interface TrainerAnalytics {
  trainerId: string;
  trainerName: string;
  assignedClients: number;
  activeClients: number;
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  totalActivities: number;
  activitiesThisMonth: number;
  averageWorkoutsPerClient: number;
  topPerformingClients: Array<{
    clientId: string;
    clientName: string;
    treinosCompleted: number;
    completionRate: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    treinos: number;
    activities: number;
    clients: number;
  }>;
}

export interface ClientAnalytics {
  clientId: string;
  clientName: string;
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  averageWorkoutsPerWeek: number;
  totalActivities: number;
  activitiesThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: Date;
  uniqueExercisesUsed: number;
  mostUsedExercises: Array<{
    exerciseId: string;
    exerciseName: string;
    count: number;
  }>;
  weeklyProgress: Array<{
    week: string;
    treinos: number;
    activities: number;
  }>;
}

export interface GlobalAnalytics {
  totalTenants: number;
  totalUsers: number;
  totalClients: number;
  totalWorkouts: number;
  totalExercises: number;
  newTenantsThisMonth: number;
  newUsersThisMonth: number;
  newClientsThisMonth: number;
  activeTenants: number;
  activeUsers: number;
  activeClients: number;
  planDistribution: Array<{
    plan: string;
    count: number;
    percentage: number;
  }>;
  tenantGrowth: Array<{
    date: string;
    count: number;
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  treinoGrowth: Array<{
    date: string;
    count: number;
  }>;
}

// Usage Tracking types
export interface UsageTracking {
  id: string;
  tenantId: string;
  eventType: string;
  eventData: any;
  userId?: string;
  metadata: any;
  createdAt: Date;
}

export interface UsageStats {
  totalEvents: number;
  eventsThisMonth: number;
  eventsByType: Record<string, number>;
  eventsByDay: Record<string, number>;
  topEventTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

// Plan Limits types
export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  resource: string;
  message?: string;
}

// Workout Filters and Forms
export interface TreinoFilters {
  search?: string;
  clientId?: string;
  userId?: string;
  completed?: boolean;
  aiGenerated?: boolean;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TreinoFormData {
  name: string;
  description?: string;
  exercises: any[];
  clientId: string;
  aiGenerated?: boolean;
}

// Exercise Filters and Forms
export interface ExerciseFilters {
  search?: string;
  category?: string;
  muscleGroup?: string;
  equipment?: string;
  difficulty?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExerciseFormData {
  name: string;
  description?: string;
  category: string;
  muscleGroups?: string[];
  equipment?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  isPublic?: boolean;
}

// Bioimpedance Types - Baseado no relatório InBody
export interface BioimpedanceMeasurement {
  id: string;
  tenantId: string;
  clientId: string;
  professionalId?: string;
  measurementId?: string; // ID do dispositivo (ex: 050625-1)
  measuredAt: Date;

  // Dados básicos do usuário
  height: number; // Altura em cm
  age: number; // Idade em anos
  gender: 'male' | 'female'; // Gênero

  // Composição corporal básica
  weight: number; // Peso em kg
  totalBodyWater: number; // Água corporal total em L
  protein: number; // Proteína em kg
  minerals: number; // Minerais em kg
  bodyFatMass: number; // Massa de gordura em kg
  skeletalMuscleMass: number; // Massa muscular esquelética em kg

  // Análise de obesidade
  bmi: number; // IMC
  bodyFatPercentage: number; // PGC - Porcentual de gordura corporal
  waistHipRatio?: number; // Relação cintura-quadril
  visceralFatLevel?: number; // Nível de gordura visceral (1-59)

  // Dados adicionais
  fatFreeMass: number; // Massa livre de gordura em kg
  basalMetabolicRate: number; // TMB em kcal
  obesityDegree: number; // Grau de obesidade em %
  skeletalMuscleIndex: number; // SMI em kg/m²
  recommendedCalories: number; // Ingestão calórica recomendada

  // Peso ideal e controles
  idealWeight: number; // Peso ideal em kg
  weightControl: number; // Controle de peso em kg
  fatControl: number; // Controle de gordura em kg
  muscleControl: number; // Controle muscular em kg

  // Análise segmentar - Massa magra
  leftArmMuscle: number; // Braço esquerdo em kg
  rightArmMuscle: number; // Braço direito em kg
  trunkMuscle: number; // Tronco em kg
  leftLegMuscle: number; // Perna esquerda em kg
  rightLegMuscle: number; // Perna direita em kg

  // Análise segmentar - Gordura
  leftArmFat: number; // Gordura braço esquerdo em kg
  rightArmFat: number; // Gordura braço direito em kg
  trunkFat: number; // Gordura tronco em kg
  leftLegFat: number; // Gordura perna esquerda em kg
  rightLegFat: number; // Gordura perna direita em kg

  // Impedância bioelétrica - 20kHz
  impedance20kRightArm?: number; // Impedância braço direito 20kHz
  impedance20kLeftArm?: number; // Impedância braço esquerdo 20kHz
  impedance20kTrunk?: number; // Impedância tronco 20kHz
  impedance20kRightLeg?: number; // Impedância perna direita 20kHz
  impedance20kLeftLeg?: number; // Impedância perna esquerda 20kHz

  // Impedância bioelétrica - 100kHz
  impedance100kRightArm?: number; // Impedância braço direito 100kHz
  impedance100kLeftArm?: number; // Impedância braço esquerdo 100kHz
  impedance100kTrunk?: number; // Impedância tronco 100kHz
  impedance100kRightLeg?: number; // Impedância perna direita 100kHz
  impedance100kLeftLeg?: number; // Impedância perna esquerda 100kHz

  // Classificações e faixas normais
  inbodyScore?: number; // Pontuação InBody (0-100+)
  weightClassification?: 'Normal' | 'Acima' | 'Abaixo'; // Classificação do peso
  muscleClassification?: 'Normal' | 'Acima' | 'Abaixo'; // Classificação da massa muscular
  fatClassification?: 'Normal' | 'Acima' | 'Abaixo'; // Classificação da gordura
  bmiClassification?: 'Normal' | 'Acima' | 'Abaixo'; // Classificação do IMC
  bodyFatClassification?: 'Normal' | 'Acima' | 'Abaixo'; // Classificação da gordura corporal

  // Faixas normais de referência
  normalWeightRange: { min: number; max: number }; // Faixa normal de peso
  normalMuscleRange: { min: number; max: number }; // Faixa normal de massa muscular
  normalFatRange: { min: number; max: number }; // Faixa normal de gordura
  normalBMIRange: { min: number; max: number }; // Faixa normal de IMC
  normalBodyFatRange: { min: number; max: number }; // Faixa normal de gordura corporal
  normalWaistHipRange: { min: number; max: number }; // Faixa normal de relação cintura-quadril

  // Dados adicionais
  equipment?: string; // Equipamento utilizado (ex: InBody270)
  operator?: string; // Operador que fez a medição
  notes?: string; // Observações adicionais
  qrCode?: string; // Código QR do relatório

  createdAt: Date;
  updatedAt: Date;

  // Relações
  client?: {
    id: string;
    name: string;
    email?: string;
  };
  professional?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface BioimpedanceMeasurementFormData {
  // Dados básicos obrigatórios
  height: number;
  age: number;
  gender: 'male' | 'female';
  weight: number;

  // Dados de composição corporal
  totalBodyWater: number;
  protein: number;
  minerals: number;
  bodyFatMass: number;
  skeletalMuscleMass: number;

  // Dados de obesidade
  bmi: number;
  bodyFatPercentage: number;
  waistHipRatio?: number;
  visceralFatLevel?: number;

  // Dados adicionais
  fatFreeMass: number;
  basalMetabolicRate: number;
  obesityDegree: number;
  skeletalMuscleIndex: number;
  recommendedCalories: number;

  // Controles
  idealWeight: number;
  weightControl: number;
  fatControl: number;
  muscleControl: number;

  // Análise segmentar - Massa magra
  leftArmMuscle: number;
  rightArmMuscle: number;
  trunkMuscle: number;
  leftLegMuscle: number;
  rightLegMuscle: number;

  // Análise segmentar - Gordura
  leftArmFat: number;
  rightArmFat: number;
  trunkFat: number;
  leftLegFat: number;
  rightLegFat: number;

  // Impedância bioelétrica - 20kHz
  impedance20kRightArm?: number;
  impedance20kLeftArm?: number;
  impedance20kTrunk?: number;
  impedance20kRightLeg?: number;
  impedance20kLeftLeg?: number;

  // Impedância bioelétrica - 100kHz
  impedance100kRightArm?: number;
  impedance100kLeftArm?: number;
  impedance100kTrunk?: number;
  impedance100kRightLeg?: number;
  impedance100kLeftLeg?: number;

  // Dados adicionais
  equipment?: string;
  operator?: string;
  notes?: string;
  qrCode?: string;
}

export interface BioimpedanceAnalysis {
  // Análise de composição corporal
  bodyComposition: {
    totalBodyWater: { value: number; normal: { min: number; max: number }; classification: string };
    protein: { value: number; normal: { min: number; max: number }; classification: string };
    minerals: { value: number; normal: { min: number; max: number }; classification: string };
    bodyFatMass: { value: number; normal: { min: number; max: number }; classification: string };
    weight: { value: number; normal: { min: number; max: number }; classification: string };
  };

  // Análise músculo-gordura
  muscleFatAnalysis: {
    weight: { value: number; percentage: number; classification: string };
    skeletalMuscleMass: { value: number; percentage: number; classification: string };
    bodyFatMass: { value: number; percentage: number; classification: string };
  };

  // Análise de obesidade
  obesityAnalysis: {
    bmi: { value: number; normal: { min: number; max: number }; classification: string };
    bodyFatPercentage: { value: number; normal: { min: number; max: number }; classification: string };
  };

  // Controle de peso
  weightControl: {
    idealWeight: number;
    weightControl: number;
    fatControl: number;
    muscleControl: number;
  };

  // Relação cintura-quadril
  waistHipRatio: {
    value: number;
    normal: { min: number; max: number };
    classification: string;
  };

  // Gordura visceral
  visceralFat: {
    level: number;
    classification: string;
  };

  // Dados adicionais
  additionalData: {
    fatFreeMass: { value: number; normal: { min: number; max: number }; classification: string };
    basalMetabolicRate: { value: number; normal: { min: number; max: number }; classification: string };
    obesityDegree: { value: number; normal: { min: number; max: number }; classification: string };
    skeletalMuscleIndex: number;
    recommendedCalories: number;
  };

  // Análise segmentar
  segmentalAnalysis: {
    muscle: {
      leftArm: { value: number; percentage: number; classification: string };
      rightArm: { value: number; percentage: number; classification: string };
      trunk: { value: number; percentage: number; classification: string };
      leftLeg: { value: number; percentage: number; classification: string };
      rightLeg: { value: number; percentage: number; classification: string };
    };
    fat: {
      leftArm: { value: number; percentage: number; classification: string };
      rightArm: { value: number; percentage: number; classification: string };
      trunk: { value: number; percentage: number; classification: string };
      leftLeg: { value: number; percentage: number; classification: string };
      rightLeg: { value: number; percentage: number; classification: string };
    };
  };

  // Pontuação InBody
  inbodyScore: {
    total: number;
    max: number;
    classification: string;
  };
}

export interface ExerciseCalorieEstimate {
  activity: string;
  calories30min: number;
  calories60min: number;
  intensity: 'low' | 'moderate' | 'high' | 'very_high';
}

export interface BioimpedanceHistory {
  clientId: string;
  clientName: string;
  measurements: Array<{
    id: string;
    measuredAt: Date;
    weight: number;
    skeletalMuscleMass: number;
    bodyFatPercentage: number;
  }>;
  trends: {
    weight: Array<{ date: Date; value: number }>;
    muscle: Array<{ date: Date; value: number }>;
    bodyFat: Array<{ date: Date; value: number }>;
  };
}
