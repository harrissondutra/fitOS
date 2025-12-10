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
  XAI = 'XAI',
  META = 'META',
  ALIBABA_QWEN = 'ALIBABA_QWEN',
  MOONSHOT = 'MOONSHOT',
  SERVICENOW = 'SERVICENOW',
  NVIDIA = 'NVIDIA',
  AI21 = 'AI21',
  IBM = 'IBM',
  ALEPH_ALPHA = 'ALEPH_ALPHA',
  STABILITY_AI = 'STABILITY_AI',
  AMAZON = 'AMAZON',
  MICROSOFT_AZURE = 'MICROSOFT_AZURE',
  PERPLEXITY = 'PERPLEXITY',
  MANUS_AI = 'MANUS_AI',
  ZHIPU_AI = 'ZHIPU_AI',
  BAIDU = 'BAIDU',
  REKA_AI = 'REKA_AI',
  INFLECTION_AI = 'INFLECTION_AI',
  DATABRICKS = 'DATABRICKS',
  WRITER = 'WRITER',
  TENCENT = 'TENCENT',
  BYTEDANCE = 'BYTEDANCE',
  ZEROONE_AI = 'ZEROONE_AI',
  MINIMAX = 'MINIMAX',
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
  
  // 🆕 IA Preditiva - Performance & Atletismo (5)
  PERFORMANCE_PREDICTION = 'PERFORMANCE_PREDICTION',
  PLATEAU_PREDICTION = 'PLATEAU_PREDICTION',
  RECOVERY_TIME_PREDICTION = 'RECOVERY_TIME_PREDICTION',
  MUSCLE_GAIN_PREDICTION = 'MUSCLE_GAIN_PREDICTION',
  STRENGTH_PREDICTION = 'STRENGTH_PREDICTION',
  
  // 🆕 IA Preditiva - Saúde & Bem-estar (5)
  METABOLIC_AGE_PREDICTION = 'METABOLIC_AGE_PREDICTION',
  HORMONAL_IMBALANCE_DETECTION = 'HORMONAL_IMBALANCE_DETECTION',
  SLEEP_QUALITY_PREDICTION = 'SLEEP_QUALITY_PREDICTION',
  STRESS_LEVEL_PREDICTION = 'STRESS_LEVEL_PREDICTION',
  IMMUNE_SYSTEM_SCORE = 'IMMUNE_SYSTEM_SCORE',
  
  // 🆕 IA Preditiva - Nutrição & Metabolismo (5)
  WEIGHT_LOSS_PREDICTION = 'WEIGHT_LOSS_PREDICTION',
  NUTRIENT_DEFICIENCY_DETECTION = 'NUTRIENT_DEFICIENCY_DETECTION',
  METABOLIC_RATE_PREDICTION = 'METABOLIC_RATE_PREDICTION',
  FOOD_ALLERGY_RISK_ASSESSMENT = 'FOOD_ALLERGY_RISK_ASSESSMENT',
  DIGESTIVE_HEALTH_PREDICTION = 'DIGESTIVE_HEALTH_PREDICTION',
  
  // 🆕 IA Preditiva - Comportamento & Adesão (4)
  ADHERENCE_PREDICTION = 'ADHERENCE_PREDICTION',
  MOTIVATION_DROP_PREDICTION = 'MOTIVATION_DROP_PREDICTION',
  GOAL_ACHIEVEMENT_PROBABILITY = 'GOAL_ACHIEVEMENT_PROBABILITY',
  DROPOUT_RISK_ASSESSMENT = 'DROPOUT_RISK_ASSESSMENT',
  
  // 🆕 IA Preditiva - Business & Operacional (5)
  MEMBER_ACQUISITION_PREDICTION = 'MEMBER_ACQUISITION_PREDICTION',
  REVENUE_OPTIMIZATION_PREDICTION = 'REVENUE_OPTIMIZATION_PREDICTION',
  PEAK_HOUR_PREDICTION = 'PEAK_HOUR_PREDICTION',
  EQUIPMENT_MAINTENANCE_PREDICTION = 'EQUIPMENT_MAINTENANCE_PREDICTION',
  STAFFING_NEEDS_PREDICTION = 'STAFFING_NEEDS_PREDICTION',
  
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
  
  // 🆕 IA Generativa - Conteúdo & Comunicação (5)
  PERSONALIZED_EMAIL_GENERATION = 'PERSONALIZED_EMAIL_GENERATION',
  SOCIAL_MEDIA_CONTENT_GENERATION = 'SOCIAL_MEDIA_CONTENT_GENERATION',
  PROGRESS_REPORT_GENERATION = 'PROGRESS_REPORT_GENERATION',
  MOTIVATIONAL_MESSAGE_GENERATION = 'MOTIVATIONAL_MESSAGE_GENERATION',
  NEWSLETTER_GENERATION = 'NEWSLETTER_GENERATION',
  
  // 🆕 IA Generativa - Treinamento & Programação (5)
  ADAPTIVE_WORKOUT_GENERATION = 'ADAPTIVE_WORKOUT_GENERATION',
  PERIODIZATION_GENERATION = 'PERIODIZATION_GENERATION',
  RECOVERY_PROTOCOL_GENERATION = 'RECOVERY_PROTOCOL_GENERATION',
  EXERCISE_ALTERNATIVE_GENERATION = 'EXERCISE_ALTERNATIVE_GENERATION',
  WARMUP_COOLDOWN_GENERATION = 'WARMUP_COOLDOWN_GENERATION',
  
  // 🆕 IA Generativa - Nutrição & Receitas (4)
  RECIPE_GENERATION = 'RECIPE_GENERATION',
  SHOPPING_LIST_GENERATION = 'SHOPPING_LIST_GENERATION',
  MEAL_PREP_PLAN_GENERATION = 'MEAL_PREP_PLAN_GENERATION',
  MACRO_OPTIMIZATION_SUGGESTIONS = 'MACRO_OPTIMIZATION_SUGGESTIONS',
  
  // 🆕 IA Generativa - Análise & Insights (4)
  INSIGHT_GENERATION = 'INSIGHT_GENERATION',
  TREND_ANALYSIS_REPORT = 'TREND_ANALYSIS_REPORT',
  COMPARATIVE_ANALYSIS_GENERATION = 'COMPARATIVE_ANALYSIS_GENERATION',
  BENCHMARK_REPORT_GENERATION = 'BENCHMARK_REPORT_GENERATION',
  
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
  
  // IA Preditiva - Performance & Atletismo
  [AiServiceType.PERFORMANCE_PREDICTION]: 'Predição de Performance',
  [AiServiceType.PLATEAU_PREDICTION]: 'Predição de Platôs',
  [AiServiceType.RECOVERY_TIME_PREDICTION]: 'Predição de Tempo de Recuperação',
  [AiServiceType.MUSCLE_GAIN_PREDICTION]: 'Predição de Ganho Muscular',
  [AiServiceType.STRENGTH_PREDICTION]: 'Predição de Força',
  
  // IA Preditiva - Saúde & Bem-estar
  [AiServiceType.METABOLIC_AGE_PREDICTION]: 'Predição de Idade Metabólica',
  [AiServiceType.HORMONAL_IMBALANCE_DETECTION]: 'Detecção de Desequilíbrio Hormonal',
  [AiServiceType.SLEEP_QUALITY_PREDICTION]: 'Predição de Qualidade do Sono',
  [AiServiceType.STRESS_LEVEL_PREDICTION]: 'Predição de Nível de Estresse',
  [AiServiceType.IMMUNE_SYSTEM_SCORE]: 'Score do Sistema Imunológico',
  
  // IA Preditiva - Nutrição & Metabolismo
  [AiServiceType.WEIGHT_LOSS_PREDICTION]: 'Predição de Perda de Peso',
  [AiServiceType.NUTRIENT_DEFICIENCY_DETECTION]: 'Detecção de Deficiência Nutricional',
  [AiServiceType.METABOLIC_RATE_PREDICTION]: 'Predição de Taxa Metabólica',
  [AiServiceType.FOOD_ALLERGY_RISK_ASSESSMENT]: 'Avaliação de Risco de Alergia Alimentar',
  [AiServiceType.DIGESTIVE_HEALTH_PREDICTION]: 'Predição de Saúde Digestiva',
  
  // IA Preditiva - Comportamento & Adesão
  [AiServiceType.ADHERENCE_PREDICTION]: 'Predição de Adesão',
  [AiServiceType.MOTIVATION_DROP_PREDICTION]: 'Predição de Queda de Motivação',
  [AiServiceType.GOAL_ACHIEVEMENT_PROBABILITY]: 'Probabilidade de Atingir Meta',
  [AiServiceType.DROPOUT_RISK_ASSESSMENT]: 'Avaliação de Risco de Desistência',
  
  // IA Preditiva - Business & Operacional
  [AiServiceType.MEMBER_ACQUISITION_PREDICTION]: 'Predição de Aquisição de Membros',
  [AiServiceType.REVENUE_OPTIMIZATION_PREDICTION]: 'Predição de Otimização de Receita',
  [AiServiceType.PEAK_HOUR_PREDICTION]: 'Predição de Horário de Pico',
  [AiServiceType.EQUIPMENT_MAINTENANCE_PREDICTION]: 'Predição de Manutenção de Equipamentos',
  [AiServiceType.STAFFING_NEEDS_PREDICTION]: 'Predição de Necessidade de Pessoal',
  
  // Nutrição
  [AiServiceType.NUTRITION]: 'Análise Nutricional',
  [AiServiceType.MEAL_PLAN_GENERATION]: 'Geração de Cardápio',
  [AiServiceType.SUPPLEMENT_RECOMMENDATION]: 'Recomendação de Suplementos',
  [AiServiceType.FOOD_RECOGNITION]: 'Reconhecimento de Alimentos',
  [AiServiceType.NUTRITION_COACH_CHAT]: 'Chat do Coach Nutricional',
  [AiServiceType.AI_MEAL_PLANNER]: 'Gerador de Dieta IA',
  [AiServiceType.PATTERN_ANALYSIS]: 'Análise de Padrões',
  [AiServiceType.FOOD_SWAP_SUGGESTIONS]: 'Sugestões de Substituição',
  
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
  
  // IA Generativa - Conteúdo & Comunicação
  [AiServiceType.PERSONALIZED_EMAIL_GENERATION]: 'Geração de Emails Personalizados',
  [AiServiceType.SOCIAL_MEDIA_CONTENT_GENERATION]: 'Geração de Conteúdo para Redes Sociais',
  [AiServiceType.PROGRESS_REPORT_GENERATION]: 'Geração de Relatórios de Progresso',
  [AiServiceType.MOTIVATIONAL_MESSAGE_GENERATION]: 'Geração de Mensagens Motivacionais',
  [AiServiceType.NEWSLETTER_GENERATION]: 'Geração de Newsletters',
  
  // IA Generativa - Treinamento & Programação
  [AiServiceType.ADAPTIVE_WORKOUT_GENERATION]: 'Geração de Treinos Adaptativos',
  [AiServiceType.PERIODIZATION_GENERATION]: 'Geração de Periodização',
  [AiServiceType.RECOVERY_PROTOCOL_GENERATION]: 'Geração de Protocolos de Recuperação',
  [AiServiceType.EXERCISE_ALTERNATIVE_GENERATION]: 'Geração de Alternativas de Exercícios',
  [AiServiceType.WARMUP_COOLDOWN_GENERATION]: 'Geração de Aquecimento/Desaquecimento',
  
  // IA Generativa - Nutrição & Receitas
  [AiServiceType.RECIPE_GENERATION]: 'Geração de Receitas',
  [AiServiceType.SHOPPING_LIST_GENERATION]: 'Geração de Lista de Compras',
  [AiServiceType.MEAL_PREP_PLAN_GENERATION]: 'Geração de Plano de Meal Prep',
  [AiServiceType.MACRO_OPTIMIZATION_SUGGESTIONS]: 'Sugestões de Otimização de Macros',
  
  // IA Generativa - Análise & Insights
  [AiServiceType.INSIGHT_GENERATION]: 'Geração de Insights',
  [AiServiceType.TREND_ANALYSIS_REPORT]: 'Relatório de Análise de Tendências',
  [AiServiceType.COMPARATIVE_ANALYSIS_GENERATION]: 'Geração de Análise Comparativa',
  [AiServiceType.BENCHMARK_REPORT_GENERATION]: 'Geração de Relatório de Benchmarking',
  
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
  [AiProviderType.XAI]: 'xAI (Grok)',
  [AiProviderType.META]: 'Meta (Llama)',
  [AiProviderType.ALIBABA_QWEN]: 'Alibaba Cloud (Qwen)',
  [AiProviderType.MOONSHOT]: 'Moonshot AI',
  [AiProviderType.SERVICENOW]: 'ServiceNow',
  [AiProviderType.NVIDIA]: 'NVIDIA',
  [AiProviderType.AI21]: 'AI21 Labs',
  [AiProviderType.IBM]: 'IBM (Granite)',
  [AiProviderType.ALEPH_ALPHA]: 'Aleph Alpha',
  [AiProviderType.STABILITY_AI]: 'Stability AI',
  [AiProviderType.AMAZON]: 'Amazon (Titan/Bedrock)',
  [AiProviderType.MICROSOFT_AZURE]: 'Microsoft Azure OpenAI',
  [AiProviderType.PERPLEXITY]: 'Perplexity AI',
  [AiProviderType.MANUS_AI]: 'Manus AI',
  [AiProviderType.ZHIPU_AI]: 'Zhipu AI',
  [AiProviderType.BAIDU]: 'Baidu (Ernie)',
  [AiProviderType.REKA_AI]: 'Reka AI',
  [AiProviderType.INFLECTION_AI]: 'Inflection AI',
  [AiProviderType.DATABRICKS]: 'Databricks',
  [AiProviderType.WRITER]: 'Writer',
  [AiProviderType.TENCENT]: 'Tencent (Hunyuan)',
  [AiProviderType.BYTEDANCE]: 'ByteDance (Doubao)',
  [AiProviderType.ZEROONE_AI]: '01.AI (Yi)',
  [AiProviderType.MINIMAX]: 'MiniMax',
  [AiProviderType.CUSTOM_API]: 'API Customizada',
  [AiProviderType.N8N_WEBHOOK]: 'N8N Webhook',
  [AiProviderType.CUSTOM_WEBHOOK]: 'Webhook Customizado'
};
