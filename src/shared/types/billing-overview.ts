// Billing Overview Types
export interface BillingOverview {
  mrr: number;
  arr: number;
  growthRate: number;
  churnRate: number;
  activeSubscriptions: number;
  paymentSuccessRate: number;
  totalRevenue: number;
  fromCache?: boolean;
  cachedAt?: Date;
}

export interface SubscriptionOverview {
  status: string;
  plan: string;
  price: number;
  billingPeriod: string;
  nextBillingDate: Date;
  cancelAtPeriodEnd: boolean;
}

export interface RevenueOverview {
  currentPeriod: number;
  previousPeriod: number;
  growth: number;
  totalYearly: number;
}

export interface UsageOverview {
  users: { current: number; limit: number };
  clients: { current: number; limit: number };
  storage: { current: number; limit: number };
}

export interface InvoiceSummary {
  id: string;
  amount: number;
  status: string;
  date: Date;
  pdfUrl: string;
}

export interface BillingIssue {
  id: string;
  tenantId: string;
  tenantName: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  lastAttempt: Date;
  attemptsCount: number;
  paymentMethod: string;
}

export interface MRRARRData {
  mrr: number;
  arr: number;
  mrrGrowth: number;
  arrGrowth: number;
  newMRR: number;
  churnedMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  byPlan: Array<{
    plan: string;
    mrr: number;
    tenantCount: number;
  }>;
}

export interface RevenueForecast {
  month: string;
  pessimistic: number;
  realistic: number;
  optimistic: number;
}

export interface PaymentMethodDistribution {
  method: string;
  count: number;
  percentage: number;
  successRate: number;
  avgAmount: number;
}

export interface SubscriptionLifecycle {
  new: number;
  active: number;
  trial: number;
  cancelled: number;
  expired: number;
  total: number;
}
