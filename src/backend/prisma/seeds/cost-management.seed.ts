import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCostManagement() {
  console.log('🌱 Seeding Cost Management...');

  // 1. Criar Categorias de Custos
  const categories = [
    {
      name: 'ai',
      displayName: 'Inteligência Artificial',
      icon: 'Brain',
      color: '#8B5CF6',
      description: 'Custos relacionados a serviços de IA (OpenAI, Anthropic, etc)',
    },
    {
      name: 'payment',
      displayName: 'Pagamentos',
      icon: 'CreditCard',
      color: '#10B981',
      description: 'Taxas de processamento de pagamentos (Stripe, Mercado Pago)',
    },
    {
      name: 'communication',
      displayName: 'Comunicação',
      icon: 'MessageCircle',
      color: '#3B82F6',
      description: 'WhatsApp, Email, SMS e outras formas de comunicação',
    },
    {
      name: 'storage',
      displayName: 'Armazenamento',
      icon: 'Database',
      color: '#F59E0B',
      description: 'Cloudinary, AWS S3 e outros serviços de armazenamento',
    },
    {
      name: 'database',
      displayName: 'Database & Cache',
      icon: 'Server',
      color: '#EF4444',
      description: 'PostgreSQL, Redis e outros serviços de banco de dados',
    },
    {
      name: 'automation',
      displayName: 'Automação',
      icon: 'Zap',
      color: '#06B6D4',
      description: 'n8n, Make, Zapier e outras ferramentas de automação',
    },
  ];

  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.costCategory.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
    createdCategories.push(created);
    console.log(`✅ Category: ${category.displayName}`);
  }

  // 2. Criar Serviços para cada categoria
  const services = [
    // Inteligência Artificial
    {
      categoryName: 'ai',
      name: 'openai',
      displayName: 'OpenAI',
      provider: 'OpenAI',
      icon: 'Brain',
      captureType: 'usage_tracking',
      costType: 'variable',
      pricingModel: {
        'gpt-4o': { input: 2.50, output: 10.00 },
        'gpt-4o-mini': { input: 0.15, output: 0.60 },
        'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
      },
    },
    {
      categoryName: 'ai',
      name: 'anthropic',
      displayName: 'Anthropic Claude',
      provider: 'Anthropic',
      icon: 'Brain',
      captureType: 'usage_tracking',
      costType: 'variable',
      pricingModel: {
        'claude-3.5-sonnet': { input: 3.00, output: 15.00 },
        'claude-3.5-haiku': { input: 1.00, output: 5.00 },
      },
    },
    {
      categoryName: 'ai',
      name: 'google-gemini',
      displayName: 'Google Gemini',
      provider: 'Google',
      icon: 'Brain',
      captureType: 'usage_tracking',
      costType: 'variable',
      pricingModel: {
        'gemini-1.5-pro': { input: 1.25, output: 5.00 },
        'gemini-1.5-flash': { input: 0.075, output: 0.30 },
      },
    },
    {
      categoryName: 'ai',
      name: 'groq',
      displayName: 'Groq',
      provider: 'Groq',
      icon: 'Brain',
      captureType: 'usage_tracking',
      costType: 'variable',
      pricingModel: {
        'llama-3.1-70b': { input: 0.59, output: 0.79 },
        'mixtral-8x7b': { input: 0.24, output: 0.24 },
      },
    },
    {
      categoryName: 'ai',
      name: 'deepseek',
      displayName: 'DeepSeek',
      provider: 'DeepSeek',
      icon: 'Brain',
      captureType: 'usage_tracking',
      costType: 'variable',
      pricingModel: {
        'deepseek-chat': { input: 0.27, output: 1.10 },
        'deepseek-reasoner': { input: 0.55, output: 2.19 },
      },
    },

    // Pagamentos
    {
      categoryName: 'payment',
      name: 'stripe',
      displayName: 'Stripe',
      provider: 'Stripe',
      icon: 'CreditCard',
      captureType: 'manual',
      costType: 'variable',
      pricingModel: {
        transaction: 0.029, // 2.9% + R$ 0.39
        fixed: 0.39,
      },
    },
    {
      categoryName: 'payment',
      name: 'mercadopago',
      displayName: 'Mercado Pago',
      provider: 'Mercado Pago',
      icon: 'CreditCard',
      captureType: 'manual',
      costType: 'variable',
      pricingModel: {
        transaction: 0.0499, // 4.99%
        fixed: 0.39,
      },
    },

    // Comunicação
    {
      categoryName: 'communication',
      name: 'whatsapp',
      displayName: 'WhatsApp',
      provider: 'Twilio',
      icon: 'MessageCircle',
      captureType: 'usage_tracking',
      costType: 'variable',
      pricingModel: {
        message: 0.05, // R$ 0.05 por mensagem
      },
    },
    {
      categoryName: 'communication',
      name: 'email',
      displayName: 'Email',
      provider: 'SMTP',
      icon: 'Mail',
      captureType: 'usage_tracking',
      costType: 'variable',
      pricingModel: {
        email: 0.001, // R$ 0.001 por email
      },
    },
    {
      categoryName: 'communication',
      name: 'chatwoot',
      displayName: 'Chatwoot',
      provider: 'Chatwoot',
      icon: 'MessageCircle',
      captureType: 'manual',
      costType: 'fixed',
      pricingModel: {
        monthly: 0, // Self-hosted
      },
    },

    // Armazenamento
    {
      categoryName: 'storage',
      name: 'cloudinary',
      displayName: 'Cloudinary',
      provider: 'Cloudinary',
      icon: 'Image',
      captureType: 'usage_tracking',
      costType: 'variable',
      pricingModel: {
        storage: 0.02, // R$ 0.02 por GB/mês
        bandwidth: 0.05, // R$ 0.05 por GB
        transformations: 0.0001, // R$ 0.0001 por transformação
      },
    },
    {
      categoryName: 'storage',
      name: 'aws-s3',
      displayName: 'AWS S3',
      provider: 'Amazon',
      icon: 'Database',
      captureType: 'manual',
      costType: 'variable',
      pricingModel: {
        storage: 0.023, // R$ 0.023 por GB/mês
        requests: 0.0004, // R$ 0.0004 por 1000 requests
      },
    },

    // Database & Cache
    {
      categoryName: 'database',
      name: 'postgresql',
      displayName: 'PostgreSQL',
      provider: 'AWS RDS',
      icon: 'Database',
      captureType: 'manual',
      costType: 'fixed',
      pricingModel: {
        monthly: 0, // Incluído no servidor
      },
    },
    {
      categoryName: 'database',
      name: 'redis',
      displayName: 'Redis',
      provider: 'Redis Cloud',
      icon: 'Zap',
      captureType: 'manual',
      costType: 'fixed',
      pricingModel: {
        monthly: 0, // Incluído no servidor
      },
    },

    // Automação
    {
      categoryName: 'automation',
      name: 'n8n',
      displayName: 'n8n',
      provider: 'n8n',
      icon: 'Workflow',
      captureType: 'manual',
      costType: 'fixed',
      pricingModel: {
        monthly: 0, // Self-hosted
      },
    },
    {
      categoryName: 'automation',
      name: 'make',
      displayName: 'Make (Integromat)',
      provider: 'Make',
      icon: 'Zap',
      captureType: 'manual',
      costType: 'fixed',
      pricingModel: {
        monthly: 0, // Plano gratuito
      },
    },
    {
      categoryName: 'automation',
      name: 'zapier',
      displayName: 'Zapier',
      provider: 'Zapier',
      icon: 'Zap',
      captureType: 'manual',
      costType: 'fixed',
      pricingModel: {
        monthly: 0, // Plano gratuito
      },
    },
  ];

  for (const service of services) {
    const category = createdCategories.find(c => c.name === service.categoryName);
    if (!category) {
      console.log(`❌ Category not found: ${service.categoryName}`);
      continue;
    }

    const { categoryName, ...serviceData } = service;
    const created = await prisma.costService.upsert({
      where: {
        categoryId_name: {
          categoryId: category.id,
          name: service.name,
        },
      },
      update: {
        ...serviceData,
        categoryId: category.id,
      },
      create: {
        ...serviceData,
        categoryId: category.id,
      },
    });
    console.log(`✅ Service: ${service.displayName} (${service.categoryName})`);
  }

  // 3. Criar Orçamento Padrão (opcional)
  const defaultBudget = await prisma.costBudget.upsert({
    where: { id: 'default-budget' },
    update: {},
    create: {
      id: 'default-budget',
      monthlyLimit: 5000, // R$ 5.000/mês
      currency: 'BRL',
      alertAt75: true,
      alertAt90: true,
      startDate: new Date(),
      isActive: true,
    },
  });

  console.log(`✅ Default Budget: R$ ${defaultBudget.monthlyLimit}/mês`);

  console.log('🎉 Cost Management seeding completed!');
}

// Executar se chamado diretamente
if (require.main === module) {
  seedCostManagement()
    .catch((e) => {
      console.error('❌ Error seeding cost management:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
