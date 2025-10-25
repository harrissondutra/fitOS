import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../src/services/encryption.service';

const prisma = new PrismaClient();
const encryptionService = new EncryptionService();

async function main() {
  console.log('🌱 Starting AI Providers seed...');

  // Verificar se já existem provedores
  const existingProviders = await prisma.aiProvider.count();
  if (existingProviders > 0) {
    console.log('✅ AI Providers already exist, skipping seed');
    return;
  }

  // Verificar se as chaves de API estão disponíveis
  const openaiKey = process.env.OPEN_AI;
  const groqKey = process.env.GROQ;
  const geminiKey = process.env.GEMINI;

  if (!openaiKey || !groqKey || !geminiKey) {
    console.error('❌ Missing API keys in environment variables');
    console.error('Required: OPEN_AI, GROQ, GEMINI');
    return;
  }

  console.log('🔐 Encrypting API keys...');

  // Criar provedores iniciais
  const providers = [
    {
      name: 'openai-default',
      displayName: 'OpenAI GPT (Padrão)',
      provider: 'OPENAI' as const,
      apiKey: encryptionService.encrypt(openaiKey),
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4-vision-preview'],
      isDefault: true,
      isActive: true,
      timeout: 30000,
      maxRetries: 3,
      isAsync: false,
      config: {
        defaultTemperature: 0.7,
        defaultMaxTokens: 2000,
        supportsVision: true,
        supportsFunctionCalling: true
      },
      createdBy: 'system-seed'
    },
    {
      name: 'groq-default',
      displayName: 'Groq (Padrão)',
      provider: 'GROQ' as const,
      apiKey: encryptionService.encrypt(groqKey),
      baseUrl: 'https://api.groq.com/openai/v1',
      models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'whisper-large-v3-turbo'],
      isActive: true,
      timeout: 30000,
      maxRetries: 3,
      isAsync: false,
      config: {
        defaultTemperature: 0.7,
        defaultMaxTokens: 2000,
        supportsTranscription: true,
        fastInference: true
      },
      createdBy: 'system-seed'
    },
    {
      name: 'gemini-default',
      displayName: 'Google Gemini (Padrão)',
      provider: 'GEMINI' as const,
      apiKey: encryptionService.encrypt(geminiKey),
      baseUrl: 'https://generativelanguage.googleapis.com/v1',
      models: ['gemini-pro', 'gemini-pro-vision'],
      isActive: true,
      timeout: 30000,
      maxRetries: 3,
      isAsync: false,
      config: {
        defaultTemperature: 0.7,
        defaultMaxTokens: 2000,
        supportsVision: true,
        costEffective: true
      },
      createdBy: 'system-seed'
    }
  ];

  console.log('📝 Creating AI providers...');
  
  for (const providerData of providers) {
    const provider = await prisma.aiProvider.create({
      data: providerData
    });
    console.log(`✅ Created provider: ${provider.displayName}`);
  }

  // Criar configurações iniciais de serviços
  console.log('⚙️ Creating initial service configurations...');

  const serviceConfigs = [
    // Chat usa OpenAI GPT-4 como principal
    {
      serviceType: 'CHAT' as const,
      providerId: 'openai-default',
      model: 'gpt-4',
      priority: 0,
      isActive: true,
      config: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9
      },
      maxRequestsPerMinute: 60,
      costPerRequest: 0.03
    },
    // Chat com Groq como fallback (mais rápido/barato)
    {
      serviceType: 'CHAT' as const,
      providerId: 'groq-default',
      model: 'llama3-70b-8192',
      priority: 1,
      isActive: true,
      config: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9
      },
      maxRequestsPerMinute: 120,
      costPerRequest: 0.01
    },
    // Transcrição usa Groq Whisper
    {
      serviceType: 'TRANSCRIPTION' as const,
      providerId: 'groq-default',
      model: 'whisper-large-v3-turbo',
      priority: 0,
      isActive: true,
      config: {
        temperature: 0,
        language: 'pt',
        responseFormat: 'verbose_json'
      },
      maxRequestsPerMinute: 30,
      costPerRequest: 0.005
    },
    // Análise de imagem usa Gemini Vision
    {
      serviceType: 'IMAGE_ANALYSIS' as const,
      providerId: 'gemini-default',
      model: 'gemini-pro-vision',
      priority: 0,
      isActive: true,
      config: {
        temperature: 0.4,
        maxTokens: 1500
      },
      maxRequestsPerMinute: 40,
      costPerRequest: 0.02
    },
    // Geração de treinos usa GPT-4
    {
      serviceType: 'WORKOUT' as const,
      providerId: 'openai-default',
      model: 'gpt-4',
      priority: 0,
      isActive: true,
      config: {
        temperature: 0.8,
        maxTokens: 3000,
        topP: 0.9
      },
      maxRequestsPerMinute: 20,
      costPerRequest: 0.05
    },
    // Nutrição usa Gemini (bom custo-benefício)
    {
      serviceType: 'NUTRITION' as const,
      providerId: 'gemini-default',
      model: 'gemini-pro',
      priority: 0,
      isActive: true,
      config: {
        temperature: 0.6,
        maxTokens: 2500,
        topP: 0.8
      },
      maxRequestsPerMinute: 30,
      costPerRequest: 0.015
    },
    // Analytics usa Groq (rápido para dados estruturados)
    {
      serviceType: 'ANALYTICS' as const,
      providerId: 'groq-default',
      model: 'llama3-70b-8192',
      priority: 0,
      isActive: true,
      config: {
        temperature: 0.3,
        maxTokens: 2000,
        topP: 0.7
      },
      maxRequestsPerMinute: 50,
      costPerRequest: 0.008
    },
    // Predição de Churn usa GPT-4
    {
      serviceType: 'CHURN' as const,
      providerId: 'openai-default',
      model: 'gpt-4',
      priority: 0,
      isActive: true,
      config: {
        temperature: 0.5,
        maxTokens: 1500,
        topP: 0.8
      },
      maxRequestsPerMinute: 10,
      costPerRequest: 0.04
    }
  ];

  // Buscar IDs dos provedores criados
  const openaiProvider = await prisma.aiProvider.findUnique({
    where: { name: 'openai-default' }
  });
  const groqProvider = await prisma.aiProvider.findUnique({
    where: { name: 'groq-default' }
  });
  const geminiProvider = await prisma.aiProvider.findUnique({
    where: { name: 'gemini-default' }
  });

  if (!openaiProvider || !groqProvider || !geminiProvider) {
    throw new Error('Failed to find created providers');
  }

  // Atualizar providerId nos service configs
  const configsWithIds = serviceConfigs.map(config => ({
    ...config,
    providerId: config.providerId === 'openai-default' ? openaiProvider.id :
                config.providerId === 'groq-default' ? groqProvider.id :
                config.providerId === 'gemini-default' ? geminiProvider.id :
                config.providerId
  }));

  for (const configData of configsWithIds) {
    const config = await prisma.aiServiceConfig.create({
      data: configData
    });
    console.log(`✅ Created service config: ${config.serviceType} -> ${config.model}`);
  }

  console.log('🎉 AI Providers seed completed successfully!');
  console.log(`📊 Created ${providers.length} providers and ${serviceConfigs.length} service configurations`);
}

export { main };

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
