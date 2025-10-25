// Types for Cost Management System
// These types mirror the Prisma models but are defined locally for the frontend

export interface CostCategory {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostService {
  id: string;
  categoryId: string;
  name: string;
  displayName: string;
  provider?: string;
  icon?: string;
  isActive: boolean;
  captureType: string;
  costType: string;
  apiConfig?: any;
  pricingModel?: any;
  createdAt: Date;
  updatedAt: Date;
  category?: CostCategory;
}

export interface CostEntry {
  id: string;
  categoryId: string;
  serviceId: string;
  tenantId?: string;
  clientId?: string;
  amount: number;
  currency: string;
  date: Date;
  month: number;
  year: number;
  entryType: string;
  description?: string;
  tags: string[];
  metadata?: any;
  revenueGenerated?: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  category?: CostCategory;
  service?: CostService;
}

export interface CostBudget {
  id: string;
  categoryId?: string;
  monthlyLimit: number;
  currency: string;
  alertAt75: boolean;
  alertAt90: boolean;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: CostCategory;
}

export interface CostAlert {
  id: string;
  clientId?: string;
  budgetId?: string;
  alertType: string;
  currentCost: number;
  limit: number;
  percentage: number;
  message: string;
  severity: string;
  isActive: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  budget?: CostBudget;
}

export interface CostGoal {
  id: string;
  categoryId?: string;
  title: string;
  targetReduction: number;
  startDate: Date;
  endDate: Date;
  status: string;
  currentProgress: number;
  createdAt: Date;
  updatedAt: Date;
  category?: CostCategory;
}

export interface CostApproval {
  id: string;
  costEntryId: string;
  threshold: number;
  requestedBy: string;
  status: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledReport {
  id: string;
  title: string;
  frequency: string;
  recipients: string[];
  format: string;
  filters?: any;
  lastSentAt?: Date;
  nextSendAt: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

