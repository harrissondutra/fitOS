// System Health Types
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: ServiceHealth[];
  uptime: number;
  timestamp: Date;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  error?: string;
}

export interface SystemHealthOverview {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    free: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    free: number;
  };
  uptime: number;
  alerts: SystemAlert[];
  fromCache?: boolean;
  cachedAt?: Date;
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: Date;
  metrics: {
    responseTime: number;
    uptime: number;
    requestsPerMinute: number;
  };
  description: string;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  service: string;
  timestamp: Date;
  resolved: boolean;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
}

export interface PerformanceHistory {
  period: '24h' | '7d' | '30d';
  metrics: SystemMetrics[];
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRatio: number;
  memoryUsed: number;
  keysCount: number;
  invalidationsPerHour: number;
  topKeys: string[];
}
