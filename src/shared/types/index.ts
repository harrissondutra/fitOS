import React from 'react';

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

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
  member: number;
}

// Workout types
export interface Workout {
  id: string;
  name: string;
  description?: string;
  userId: string;
  tenantId: string;
  exercises: WorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
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
  tips?: string[];
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
export interface WorkoutStats {
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
    workouts: number;
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
export interface AIWorkoutRecommendation {
  id: string;
  userId: string;
  workoutType: string;
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
  recentWorkouts: Workout[];
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
