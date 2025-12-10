// Script para inserir/atualizar API Keys no banco
// Executar: npx tsx src/backend/prisma/seeds/ai-providers-update.ts

import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../src/services/encryption.service';

const prisma = new PrismaClient();
const encryptionService = new EncryptionService();

const API_KEYS = {
  OPENAI: process.env.OPENAI_API_KEY || '',
  GROQ: process.env.GROQ_API_KEY || '',
  GEMINI: process.env.GEMINI_API_KEY || '',
  ANTHROPIC: process.env.ANTHROPIC_API_KEY || ''
};

async function main() {
  console.log('🔐 Atualizando API Keys dos provedores...');

  // OpenAI
  await upsertProvider({
    name: 'openai-default',
    displayName: 'OpenAI GPT (Padrão)',
    provider: 'OPENAI',
    apiKey: API_KEYS.OPENAI,
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4-vision-preview'],
    isDefault: true,
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 2000,
      supportsVision: true,
      supportsFunctionCalling: true
    }
  });

  // Groq
  await upsertProvider({
    name: 'groq-default',
    displayName: 'Groq (Padrão)',
    provider: 'GROQ',
    apiKey: API_KEYS.GROQ,
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'whisper-large-v3-turbo'],
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 2000,
      supportsTranscription: true,
      fastInference: true
    }
  });

  // Gemini
  await upsertProvider({
    name: 'gemini-default',
    displayName: 'Google Gemini (Padrão)',
    provider: 'GEMINI',
    apiKey: API_KEYS.GEMINI,
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    models: ['gemini-pro', 'gemini-pro-vision'],
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 2000,
      supportsVision: true,
      costEffective: true
    }
  });

  // Anthropic
  await upsertProvider({
    name: 'anthropic-default',
    displayName: 'Anthropic Claude (Padrão)',
    provider: 'CLAUDE',
    apiKey: API_KEYS.ANTHROPIC,
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-20250514', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 2000,
      supportsLongContext: true,
      anthropicVersion: '2023-06-01'
    }
  });

  console.log('✅ API Keys atualizadas com sucesso!');
}

async function upsertProvider(data: {
  name: string;
  displayName: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  models: string[];
  isDefault?: boolean;
  config?: Record<string, any>;
}) {
  const encryptedKey = encryptionService.encrypt(data.apiKey);

  // Buscar tenant system ou criar se não existir
  let systemTenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { id: 'system' },
        { subdomain: 'system' }
      ]
    }
  });

  if (!systemTenant) {
    // Criar tenant system se não existir
    systemTenant = await prisma.tenant.create({
      data: {
        id: 'system',
        name: 'System',
        subdomain: 'system',
        plan: 'starter',
        status: 'active',
        billingEmail: 'system@fitos.com'
      }
    });
    console.log('✅ Created system tenant');
  }

  const provider = await prisma.aiProvider.upsert({
    where: { name: data.name },
    update: {
      apiKey: encryptedKey,
      models: data.models,
      isActive: true,
      config: data.config || {},
      updatedAt: new Date()
    },
    create: {
      name: data.name,
      displayName: data.displayName,
      provider: data.provider,
      apiKey: encryptedKey,
      baseUrl: data.baseUrl,
      models: data.models,
      tenantId: systemTenant.id,
      isActive: true,
      isDefault: data.isDefault || false,
      isAsync: false,
      timeout: 30000,
      maxRetries: 3,
      config: data.config || {},
      createdBy: 'system-update'
    }
  });

  console.log(`✅ ${data.displayName} ${provider.createdAt.getTime() === provider.updatedAt.getTime() ? 'criado' : 'atualizado'}: ${provider.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao atualizar API Keys:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

