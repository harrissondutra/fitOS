/**
 * Tipos TypeScript para Sistema de Gerenciamento de IA
 * 
 * Contém todos os enums, interfaces e tipos necessários para
 * o sistema de gerenciamento de provedores de IA.
 */

// ===========================================
// ENUMS
// ===========================================

export enum AiProviderType {
  OPENAI = 'OPENAI',
  GEMINI = 'GEMINI',
  GROQ = 'GROQ',
  OLLAMA = 'OLLAMA',
  CLAUDE = 'CLAUDE',
  MISTRAL = 'MISTRAL',
  COHERE = 'COHERE',
  HUGGINGFACE = 'HUGGINGFACE',
  DEEPSEEK = 'DEEPSEEK',
  CUSTOM_API = 'CUSTOM_API',
  N8N_WEBHOOK = 'N8N_WEBHOOK',
  CUSTOM_WEBHOOK = 'CUSTOM_WEBHOOK'
}

export enum AiServiceType {
  // Conversação (5)
  CHAT = 'CHAT',
  MULTIAGENT_CHAT = 'MULTIAGENT_CHAT',
  VOICE_WORKOUT_COACH = 'VOICE_WORKOUT_COACH',
  VIRTUAL_WORKOUT_BUDDY = 'VIRTUAL_WORKOUT_BUDDY',
  FORM_FILLING_ASSISTANT = 'FORM_FILLING_ASSISTANT',
  
  // Visual (6)
  IMAGE_ANALYSIS = 'IMAGE_ANALYSIS',
  VIDEO_ANALYSIS = 'VIDEO_ANALYSIS',
  POSTURE_ANALYSIS = 'POSTURE_ANALYSIS',
  EXERCISE_FORM_CHECKER = 'EXERCISE_FORM_CHECKER',
  BODY_COMPOSITION_PREDICTOR = 'BODY_COMPOSITION_PREDICTOR',
  NUTRITION_LABEL_SCANNER = 'NUTRITION_LABEL_SCANNER',
  
  // Áudio (2)
  TRANSCRIPTION = 'TRANSCRIPTION',
  TEXT_TO_SPEECH = 'TEXT_TO_SPEECH',
  
  // Treinos (6)
  WORKOUT = 'WORKOUT',
  SMART_WARMUP_GENERATOR = 'SMART_WARMUP_GENERATOR',
  AUTO_SUBSTITUTE_EXERCISES = 'AUTO_SUBSTITUTE_EXERCISES',
  WORKOUT_DIFFICULTY_ADJUSTER = 'WORKOUT_DIFFICULTY_ADJUSTER',
  RECOVERY_OPTIMIZER = 'RECOVERY_OPTIMIZER',
  INJURY_PREDICTION = 'INJURY_PREDICTION',
  
  // Nutrição (3)
  NUTRITION = 'NUTRITION',
  MEAL_PLAN_GENERATION = 'MEAL_PLAN_GENERATION',
  SUPPLEMENT_RECOMMENDATION = 'SUPPLEMENT_RECOMMENDATION',
  
  // 🆕 Sprint 7 - Tracking Alimentar
  FOOD_RECOGNITION = 'FOOD_RECOGNITION',           // Foto → alimentos (GPT-4 Vision)
  NUTRITION_COACH_CHAT = 'NUTRITION_COACH_CHAT',   // Chat 24/7 assistente nutricional
  AI_MEAL_PLANNER = 'AI_MEAL_PLANNER',             // Gerador de dietas personalizadas
  PATTERN_ANALYSIS = 'PATTERN_ANALYSIS',           // Análise comportamental (30 dias)
  FOOD_SWAP_SUGGESTIONS = 'FOOD_SWAP_SUGGESTIONS', // Substituições nutricionais inteligentes
  
  // Saúde (4)
  MEDICAL_OCR = 'MEDICAL_OCR',
  SENTIMENT_ANALYSIS = 'SENTIMENT_ANALYSIS',
  MOTIVATION_DETECTION = 'MOTIVATION_DETECTION',
  MENTAL_HEALTH_MONITOR = 'MENTAL_HEALTH_MONITOR',
  
  // Business (6)
  ANALYTICS = 'ANALYTICS',
  CHURN = 'CHURN',
  REVENUE_PREDICTION = 'REVENUE_PREDICTION',
  MARKET_INTELLIGENCE = 'MARKET_INTELLIGENCE',
  COMPETITOR_WORKOUT_DETECTOR = 'COMPETITOR_WORKOUT_DETECTOR',
  MEMBERSHIP_UPSELL_ASSISTANT = 'MEMBERSHIP_UPSELL_ASSISTANT',
  
  // Conteúdo (4)
  CONTENT_GENERATION = 'CONTENT_GENERATION',
  AUTOMATIC_PROGRESS_REPORTS = 'AUTOMATIC_PROGRESS_REPORTS',
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  PLAYLIST_GENERATION = 'PLAYLIST_GENERATION',
  
  // Automação (1)
  SCHEDULING_ASSISTANT = 'SCHEDULING_ASSISTANT',
  
  // RAG (4)
  EMBEDDINGS = 'EMBEDDINGS',
  RAG_COACH = 'RAG_COACH',
  RAG_NUTRITION = 'RAG_NUTRITION',
  RAG_MEDICAL = 'RAG_MEDICAL',
  
  // Customizado (1)
  CUSTOM = 'CUSTOM'
}

export enum AiJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum WebhookDirection {
  OUTGOING = 'outgoing',
  INCOMING = 'incoming'
}

// ===========================================
// INTERFACES PRINCIPAIS
// ===========================================

export interface AiProvider {
  id: string;
  name: string;
  displayName: string;
  provider: AiProviderType;
  tenantId: string;
  apiKey?: string | null; // Sempre mascarado no frontend
  webhookUrl?: string | null;
  webhookSecret?: string | null; // Mascarado
  baseUrl?: string | null;
  models: string[];
  isActive: boolean;
  isDefault: boolean;
  isAsync: boolean;
  timeout: number;
  maxRetries: number;
  callbackUrl?: string | null;
  config: Record<string, any>;
  headers?: Record<string, string> | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface AiServiceConfig {
  id: string;
  serviceType: AiServiceType;
  serviceName?: string;
  providerId: string;
  model: string;
  priority: number;
  isActive: boolean;
  config: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    [key: string]: any;
  };
  maxRequestsPerMinute?: number;
  costPerRequest?: number;
  createdAt: Date;
  updatedAt: Date;
  provider?: AiProvider;
}

export interface AiWebhookLog {
  id: string;
  providerId: string;
  direction: WebhookDirection;
  requestUrl?: string;
  requestMethod?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  duration?: number;
  error?: string;
  jobId?: string;
  createdAt: Date;
}

export interface AiJob {
  id: string;
  serviceType: string;
  providerId: string;
  status: AiJobStatus;
  input: any;
  output?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// INTERFACES DE REQUEST/RESPONSE
// ===========================================

export interface CreateAiProviderRequest {
  name: string;
  displayName: string;
  provider: AiProviderType;
  apiKey?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  baseUrl?: string;
  models?: string[];
  isDefault?: boolean;
  isAsync?: boolean;
  timeout?: number;
  maxRetries?: number;
  callbackUrl?: string;
  config?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface UpdateAiProviderRequest extends Partial<CreateAiProviderRequest> {
  id: string;
  isActive?: boolean;
}

export interface CreateAiServiceConfigRequest {
  serviceType: AiServiceType;
  serviceName?: string;
  providerId: string;
  model: string;
  priority?: number;
  isActive?: boolean;
  config?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    [key: string]: any;
  };
  maxRequestsPerMinute?: number;
  costPerRequest?: number;
}

export interface UpdateAiServiceConfigRequest extends Partial<CreateAiServiceConfigRequest> {
  id: string;
}

export interface AiCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  timeout?: number;
  model?: string;
  stream?: boolean;
  metadata?: Record<string, any>;
}

export interface AiCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: any;
  isAsync?: boolean;
  jobId?: string;
}

// ===========================================
// INTERFACES DE FILTROS E PAGINAÇÃO
// ===========================================

export interface AiProviderFilters {
  provider?: AiProviderType;
  isActive?: boolean;
  isDefault?: boolean;
  isAsync?: boolean;
  search?: string;
}

export interface AiServiceConfigFilters {
  serviceType?: AiServiceType;
  providerId?: string;
  isActive?: boolean;
  search?: string;
}

export interface AiWebhookLogFilters {
  providerId?: string;
  direction?: WebhookDirection;
  status?: number;
  startDate?: Date;
  endDate?: Date;
  jobId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ===========================================
// INTERFACES DE TEMPLATES
// ===========================================

export interface AiProviderTemplate {
  provider: AiProviderType;
  displayName: string;
  baseUrl: string;
  defaultModels: string[];
  defaultConfig: Record<string, any>;
  capabilities: string[];
  description: string;
}

export interface ServiceCategory {
  name: string;
  icon: string;
  description: string;
  services: {
    type: AiServiceType;
    name: string;
    description: string;
    recommendedProviders: AiProviderType[];
  }[];
}

// ===========================================
// INTERFACES DE CONFIGURAÇÃO GLOBAL
// ===========================================

export interface GlobalAiSettings {
  rateLimiting: {
    enabled: boolean;
    defaultRequestsPerMinute: number;
  };
  fallback: {
    enabled: boolean;
    strategy: 'sequential' | 'random' | 'load-balance';
  };
  logging: {
    detailed: boolean;
    retentionDays: number;
  };
  webhooks: {
    publicUrl: string;
    secret: string;
    ipWhitelist: string[];
    validateHmac: boolean;
    validateTimestamp: boolean;
  };
  security: {
    maskKeysInLogs: boolean;
    require2FA: boolean;
  };
}

// ===========================================
// INTERFACES DE MÉTRICAS E CUSTOS
// ===========================================

export interface AiCostSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  trends: {
    today: number; // % change
    week: number;
    month: number;
  };
}

export interface AiUsageMetrics {
  requestsByProvider: Record<string, number>;
  requestsByService: Record<string, number>;
  averageResponseTime: Record<string, number>;
  errorRate: Record<string, number>;
  costByProvider: Record<string, number>;
  costByService: Record<string, number>;
}

// ===========================================
// INTERFACES DE WEBHOOK
// ===========================================

export interface WebhookCallbackPayload {
  jobId: string;
  status: AiJobStatus;
  output?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface N8NWebhookPayload {
  serviceType: string;
  input: any;
  metadata?: Record<string, any>;
}

// ===========================================
// UTILITÁRIOS
// ===========================================

export type AiServiceTypeDisplayName = Record<AiServiceType, string>;

export const AI_SERVICE_DISPLAY_NAMES: AiServiceTypeDisplayName = {
  // Conversação
  [AiServiceType.CHAT]: 'Chat Geral',
  [AiServiceType.MULTIAGENT_CHAT]: 'Chat Multiagente',
  [AiServiceType.VOICE_WORKOUT_COACH]: 'Coach por Voz',
  [AiServiceType.VIRTUAL_WORKOUT_BUDDY]: 'Parceiro Virtual',
  [AiServiceType.FORM_FILLING_ASSISTANT]: 'Assistente de Formulários',
  
  // Visual
  [AiServiceType.IMAGE_ANALYSIS]: 'Análise de Imagem',
  [AiServiceType.VIDEO_ANALYSIS]: 'Análise de Vídeo',
  [AiServiceType.POSTURE_ANALYSIS]: 'Análise de Postura',
  [AiServiceType.EXERCISE_FORM_CHECKER]: 'Validação de Forma',
  [AiServiceType.BODY_COMPOSITION_PREDICTOR]: 'Predição de Composição',
  [AiServiceType.NUTRITION_LABEL_SCANNER]: 'Scanner de Rótulos',
  
  // Áudio
  [AiServiceType.TRANSCRIPTION]: 'Transcrição de Áudio',
  [AiServiceType.TEXT_TO_SPEECH]: 'Síntese de Voz',
  
  // Treinos
  [AiServiceType.WORKOUT]: 'Geração de Treinos',
  [AiServiceType.SMART_WARMUP_GENERATOR]: 'Aquecimento Inteligente',
  [AiServiceType.AUTO_SUBSTITUTE_EXERCISES]: 'Substituição Automática',
  [AiServiceType.WORKOUT_DIFFICULTY_ADJUSTER]: 'Ajuste de Dificuldade',
  [AiServiceType.RECOVERY_OPTIMIZER]: 'Otimizador de Recuperação',
  [AiServiceType.INJURY_PREDICTION]: 'Predição de Lesões',
  
  // Nutrição
  [AiServiceType.NUTRITION]: 'Análise Nutricional',
  [AiServiceType.MEAL_PLAN_GENERATION]: 'Geração de Cardápio',
  [AiServiceType.SUPPLEMENT_RECOMMENDATION]: 'Recomendação de Suplementos',
  
  // Saúde
  [AiServiceType.MEDICAL_OCR]: 'OCR Médico',
  [AiServiceType.SENTIMENT_ANALYSIS]: 'Análise de Sentimento',
  [AiServiceType.MOTIVATION_DETECTION]: 'Detecção de Motivação',
  [AiServiceType.MENTAL_HEALTH_MONITOR]: 'Monitor de Saúde Mental',
  
  // Business
  [AiServiceType.ANALYTICS]: 'Business Intelligence',
  [AiServiceType.CHURN]: 'Predição de Churn',
  [AiServiceType.REVENUE_PREDICTION]: 'Predição de Receita',
  [AiServiceType.MARKET_INTELLIGENCE]: 'Inteligência de Mercado',
  [AiServiceType.COMPETITOR_WORKOUT_DETECTOR]: 'Detector de Concorrência',
  [AiServiceType.MEMBERSHIP_UPSELL_ASSISTANT]: 'Assistente de Upsell',
  
  // Conteúdo
  [AiServiceType.CONTENT_GENERATION]: 'Geração de Conteúdo',
  [AiServiceType.AUTOMATIC_PROGRESS_REPORTS]: 'Relatórios Automáticos',
  [AiServiceType.VIDEO_GENERATION]: 'Geração de Vídeos',
  [AiServiceType.PLAYLIST_GENERATION]: 'Geração de Playlists',
  
  // Automação
  [AiServiceType.SCHEDULING_ASSISTANT]: 'Assistente de Agendamento',
  
  // RAG
  [AiServiceType.EMBEDDINGS]: 'Vector Embeddings',
  [AiServiceType.RAG_COACH]: 'Coach com Memória',
  [AiServiceType.RAG_NUTRITION]: 'Nutricionista com Memória',
  [AiServiceType.RAG_MEDICAL]: 'Assistente Médico',
  
  // Customizado
  [AiServiceType.CUSTOM]: 'Serviço Customizado'
};

export type AiProviderTypeDisplayName = Record<AiProviderType, string>;

export const AI_PROVIDER_DISPLAY_NAMES: AiProviderTypeDisplayName = {
  [AiProviderType.OPENAI]: 'OpenAI',
  [AiProviderType.GEMINI]: 'Google Gemini',
  [AiProviderType.GROQ]: 'Groq',
  [AiProviderType.OLLAMA]: 'Ollama (Local)',
  [AiProviderType.CLAUDE]: 'Anthropic Claude',
  [AiProviderType.MISTRAL]: 'Mistral AI',
  [AiProviderType.COHERE]: 'Cohere',
  [AiProviderType.HUGGINGFACE]: 'Hugging Face',
  [AiProviderType.DEEPSEEK]: 'DeepSeek',
  [AiProviderType.CUSTOM_API]: 'API Customizada',
  [AiProviderType.N8N_WEBHOOK]: 'N8N Webhook',
  [AiProviderType.CUSTOM_WEBHOOK]: 'Webhook Customizado'
};
