/**
 * Types para o sistema de anúncios (Monetization)
 */

export type AdType = 'native' | 'contextual' | 'banner' | 'sponsored_content' | 'affiliate';
export type AdPosition = 'feed' | 'sidebar' | 'exercise_list' | 'meal_plan' | 'email' | 'dashboard' | 'header' | 'footer' | 'between-content' | 'interstitial';
export type AdEventType = 'view' | 'click';

export interface Advertisement {
  id: string;
  tenantId: string;
  type: AdType;
  position: AdPosition;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  targetUrl: string | null;
  adCode?: string | null; // Google AdSense code ou código de anúncio customizado
  targeting?: {
    plans?: string[];
    goals?: string[];
    minRelevance?: number;
    roles?: string[];
    tenantTypes?: string[];
    interests?: string[];
  } | null;
  isActive: boolean;
  priority: number;
  impressionCount: number;
  clickCount: number;
  conversionCount: number;
  avgRelevanceScore: number;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdvertisementDTO {
  type: AdType;
  position: AdPosition;
  title?: string;
  description?: string;
  imageUrl?: string;
  targetUrl?: string;
  adCode?: string; // Google AdSense code ou código de anúncio customizado
  targeting?: {
    plans?: string[];
    goals?: string[];
    minRelevance?: number;
    roles?: string[];
    tenantTypes?: string[];
    interests?: string[];
  };
  isActive?: boolean;
  priority?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateAdvertisementDTO extends Partial<CreateAdvertisementDTO> {}

export interface AdTrackingEvent {
  adId: string;
  eventType: AdEventType;
  tenantId?: string;
  position?: string;
  userAgent?: string;
  ip?: string;
  referer?: string;
}

export interface AdAnalytics {
  adId: string;
  totalViews: number;
  totalClicks: number;
  clickThroughRate: number;
  impressions: number;
  uniqueViews: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  dailyStats: Array<{
    date: string;
    views: number;
    clicks: number;
  }>;
}

export interface AdAnalyticsOverview {
  totalAds: number;
  activeAds: number;
  totalViews: number;
  totalClicks: number;
  averageCTR: number;
  topAds: Array<{
    adId: string;
    title: string;
    views: number;
    clicks: number;
    ctr: number;
  }>;
  period: {
    startDate: Date;
    endDate: Date;
  };
}
