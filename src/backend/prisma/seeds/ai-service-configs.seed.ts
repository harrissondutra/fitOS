import { PrismaClient } from '@prisma/client';
import { AiServiceType } from '../../../shared/types/ai.types';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AI Service Configs seed...');

  // Buscar provedores existentes
  const providers = await prisma.aiProvider.findMany({
    where: { isActive: true },
    select: { id: true, name: true, displayName: true, provider: true }
  });

  if (providers.length === 0) {
    console.log('❌ No active providers found. Please run ai-providers seed first.');
    return;
  }

  console.log(`📋 Found ${providers.length} active providers`);

  // Encontrar provedores específicos
  const openaiProvider = providers.find(p => p.provider === 'OPENAI');
  const groqProvider = providers.find(p => p.provider === 'GROQ');
  const geminiProvider = providers.find(p => p.provider === 'GEMINI');

  if (!openaiProvider) {
    console.log('❌ OpenAI provider not found');
    return;
  }

  console.log('⚙️ Creating initial service configurations...');

  // 1. Chat Service (OpenAI GPT-4)
  await prisma.aiServiceConfig.upsert({
    where: { 
      serviceType_providerId_serviceName: { 
        serviceType: AiServiceType.CHAT, 
        providerId: openaiProvider.id, 
        serviceName: 'Chat Geral' 
      } 
    },
    update: {},
    create: {
      serviceType: AiServiceType.CHAT,
      serviceName: 'Chat Geral',
      providerId: openaiProvider.id,
      model: 'gpt-4',
      priority: 100,
      isActive: true,
      config: {
        temperature: 0.7,
        maxTokens: 1024,
        topP: 0.9
      },
      maxRequestsPerMinute: 60,
      costPerRequest: 0.001,
    },
  });

  // 2. Transcription Service (OpenAI Whisper)
  await prisma.aiServiceConfig.upsert({
    where: { 
      serviceType_providerId_serviceName: { 
        serviceType: AiServiceType.TRANSCRIPTION, 
        providerId: openaiProvider.id, 
        serviceName: 'Transcrição de Áudio' 
      } 
    },
    update: {},
    create: {
      serviceType: AiServiceType.TRANSCRIPTION,
      serviceName: 'Transcrição de Áudio',
      providerId: openaiProvider.id,
      model: 'whisper-1',
      priority: 80,
      isActive: true,
      config: {
        temperature: 0.0,
        maxTokens: 0
      },
      maxRequestsPerMinute: 20,
      costPerRequest: 0.006,
    },
  });

  // 3. Image Analysis Service (OpenAI GPT-4 Vision)
  await prisma.aiServiceConfig.upsert({
    where: { 
      serviceType_providerId_serviceName: { 
        serviceType: AiServiceType.IMAGE_ANALYSIS, 
        providerId: openaiProvider.id, 
        serviceName: 'Análise de Imagem' 
      } 
    },
    update: {},
    create: {
      serviceType: AiServiceType.IMAGE_ANALYSIS,
      serviceName: 'Análise de Imagem',
      providerId: openaiProvider.id,
      model: 'gpt-4-vision-preview',
      priority: 85,
      isActive: true,
      config: {
        temperature: 0.1,
        maxTokens: 1024,
        topP: 0.9
      },
      maxRequestsPerMinute: 10,
      costPerRequest: 0.01,
    },
  });

  // 4. Workout Generation Service (Groq - mais rápido e barato)
  if (groqProvider) {
    await prisma.aiServiceConfig.upsert({
      where: { 
        serviceType_providerId_serviceName: { 
          serviceType: AiServiceType.WORKOUT, 
          providerId: groqProvider.id, 
          serviceName: 'Geração de Treinos' 
        } 
      },
      update: {},
      create: {
        serviceType: AiServiceType.WORKOUT,
        serviceName: 'Geração de Treinos',
        providerId: groqProvider.id,
        model: 'llama3-70b-8192',
        priority: 95,
        isActive: true,
        config: {
          temperature: 0.6,
          maxTokens: 2048,
          topP: 0.9
        },
        maxRequestsPerMinute: 25,
        costPerRequest: 0.005,
      },
    });
  }

  // 5. Nutrition Analysis Service (Gemini - bom para análise)
  if (geminiProvider) {
    await prisma.aiServiceConfig.upsert({
      where: { 
        serviceType_providerId_serviceName: { 
          serviceType: AiServiceType.NUTRITION, 
          providerId: geminiProvider.id, 
          serviceName: 'Análise Nutricional' 
        } 
      },
      update: {},
      create: {
        serviceType: AiServiceType.NUTRITION,
        serviceName: 'Análise Nutricional',
        providerId: geminiProvider.id,
        model: 'gemini-pro',
        priority: 85,
        isActive: true,
        config: {
          temperature: 0.5,
          maxTokens: 1536,
          topP: 0.9
        },
        maxRequestsPerMinute: 20,
        costPerRequest: 0.004,
      },
    });
  }

  // 6. Analytics Service (OpenAI GPT-4 - melhor para análise complexa)
  await prisma.aiServiceConfig.upsert({
    where: { 
      serviceType_providerId_serviceName: { 
        serviceType: AiServiceType.ANALYTICS, 
        providerId: openaiProvider.id, 
        serviceName: 'Business Analytics' 
      } 
    },
    update: {},
    create: {
      serviceType: AiServiceType.ANALYTICS,
      serviceName: 'Business Analytics',
      providerId: openaiProvider.id,
      model: 'gpt-4',
      priority: 85,
      isActive: true,
      config: {
        temperature: 0.1,
        maxTokens: 2048,
        topP: 0.9
      },
      maxRequestsPerMinute: 10,
      costPerRequest: 0.01,
    },
  });

  // 7. Churn Prediction Service (OpenAI GPT-4 - análise preditiva)
  await prisma.aiServiceConfig.upsert({
    where: { 
      serviceType_providerId_serviceName: { 
        serviceType: AiServiceType.CHURN, 
        providerId: openaiProvider.id, 
        serviceName: 'Predição de Churn' 
      } 
    },
    update: {},
    create: {
      serviceType: AiServiceType.CHURN,
      serviceName: 'Predição de Churn',
      providerId: openaiProvider.id,
      model: 'gpt-4',
      priority: 95,
      isActive: true,
      config: {
        temperature: 0.1,
        maxTokens: 1024,
        topP: 0.9
      },
      maxRequestsPerMinute: 5,
      costPerRequest: 0.015,
    },
  });

  console.log('✅ AI Service Configs seed completed successfully!');
  console.log('📊 Created 7 initial service configurations:');
  console.log('   - Chat Geral (OpenAI GPT-4)');
  console.log('   - Transcrição de Áudio (OpenAI Whisper)');
  console.log('   - Análise de Imagem (OpenAI GPT-4 Vision)');
  console.log('   - Geração de Treinos (Groq Llama3)');
  console.log('   - Análise Nutricional (Gemini Pro)');
  console.log('   - Business Analytics (OpenAI GPT-4)');
  console.log('   - Predição de Churn (OpenAI GPT-4)');
}

export { main };

main()
  .catch((e) => {
    console.error('❌ Error during AI Service Configs seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
