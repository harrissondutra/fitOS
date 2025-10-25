import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Seed de limites padrão para cada plano
const defaultLimits = [
  {
    plan: 'starter',
    aiLimits: {
      globalMonthlyTokens: 100000, // 100K tokens
      perServiceType: {
        openai: {
          monthlyTokens: 50000,
          costBudget: 50.00
        },
        anthropic: {
          monthlyTokens: 30000,
          costBudget: 30.00
        },
        groq: {
          monthlyTokens: 20000,
          costBudget: 20.00
        }
      }
    },
    uploadLimits: {
      maxFileSizeMB: 10,
      totalStorageGB: 5,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt'],
      monthlyUploadQuotaGB: 1
    },
    featureLimits: {
      aiChat: true,
      bioimpedancia: true,
      workoutPlans: 10,
      clientManagement: 50,
      reports: true,
      whatsappIntegration: false,
      stripeIntegration: false,
      advancedAnalytics: false,
      customBranding: false,
      apiAccess: false,
      webhooks: false,
      multiLanguage: false,
      whiteLabel: false
    },
    rateLimits: {
      apiRequestsPerMinute: 100,
      webhookCallsPerMinute: 50
    }
  },
  {
    plan: 'professional',
    aiLimits: {
      globalMonthlyTokens: 500000, // 500K tokens
      perServiceType: {
        openai: {
          monthlyTokens: 250000,
          costBudget: 250.00
        },
        anthropic: {
          monthlyTokens: 150000,
          costBudget: 150.00
        },
        groq: {
          monthlyTokens: 100000,
          costBudget: 100.00
        }
      }
    },
    uploadLimits: {
      maxFileSizeMB: 50,
      totalStorageGB: 25,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'mov', 'avi', 'xlsx', 'csv'],
      monthlyUploadQuotaGB: 5
    },
    featureLimits: {
      aiChat: true,
      bioimpedancia: true,
      workoutPlans: 100,
      clientManagement: 500,
      reports: true,
      whatsappIntegration: true,
      stripeIntegration: true,
      advancedAnalytics: true,
      customBranding: true,
      apiAccess: true,
      webhooks: true,
      multiLanguage: true,
      whiteLabel: false
    },
    rateLimits: {
      apiRequestsPerMinute: 500,
      webhookCallsPerMinute: 200
    }
  },
  {
    plan: 'enterprise',
    aiLimits: {
      globalMonthlyTokens: 2000000, // 2M tokens
      perServiceType: {
        openai: {
          monthlyTokens: 1000000,
          costBudget: 1000.00
        },
        anthropic: {
          monthlyTokens: 600000,
          costBudget: 600.00
        },
        groq: {
          monthlyTokens: 400000,
          costBudget: 400.00
        }
      }
    },
    uploadLimits: {
      maxFileSizeMB: 200,
      totalStorageGB: 100,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'mov', 'avi', 'xlsx', 'csv', 'zip', 'rar', 'json', 'xml'],
      monthlyUploadQuotaGB: 20
    },
    featureLimits: {
      aiChat: true,
      bioimpedancia: true,
      workoutPlans: -1, // Ilimitado
      clientManagement: -1, // Ilimitado
      reports: true,
      whatsappIntegration: true,
      stripeIntegration: true,
      advancedAnalytics: true,
      customBranding: true,
      apiAccess: true,
      webhooks: true,
      multiLanguage: true,
      whiteLabel: true
    },
    rateLimits: {
      apiRequestsPerMinute: 1000,
      webhookCallsPerMinute: 500
    }
  }
];

// Seed de templates de integração
const integrationTemplates = [
  {
    integration: 'openai',
    displayName: 'OpenAI',
    category: 'ai',
    icon: 'openai-icon.svg',
    configSchema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          format: 'password',
          description: 'OpenAI API Key starting with sk-',
          pattern: '^sk-[a-zA-Z0-9]+$'
        },
        organizationId: {
          type: 'string',
          description: 'Optional organization ID'
        },
        timeout: {
          type: 'number',
          default: 60000,
          description: 'Request timeout in milliseconds'
        },
        maxRetries: {
          type: 'number',
          default: 3,
          description: 'Maximum number of retries'
        },
        defaultModel: {
          type: 'string',
          default: 'gpt-3.5-turbo',
          description: 'Default model to use'
        }
      },
      required: ['apiKey']
    },
    requiredFields: [
      {
        name: 'apiKey',
        type: 'password',
        required: true,
        description: 'OpenAI API Key starting with sk-',
        validation: '^sk-[a-zA-Z0-9]+$'
      }
    ],
    optionalFields: [
      {
        name: 'organizationId',
        type: 'text',
        required: false,
        description: 'Optional organization ID'
      },
      {
        name: 'timeout',
        type: 'number',
        required: false,
        default: 60000,
        description: 'Request timeout in milliseconds'
      },
      {
        name: 'maxRetries',
        type: 'number',
        required: false,
        default: 3,
        description: 'Maximum number of retries'
      },
      {
        name: 'defaultModel',
        type: 'select',
        required: false,
        default: 'gpt-3.5-turbo',
        options: [
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
        ],
        description: 'Default model to use'
      }
    ],
    testEndpoint: '/models',
    testMethod: 'GET',
    documentationUrl: 'https://platform.openai.com/docs',
    sdkPackage: 'openai',
    sdkVersion: '^4.0.0',
    exampleConfig: {
      apiKey: 'sk-...',
      organizationId: 'org-...',
      timeout: 60000,
      maxRetries: 3,
      defaultModel: 'gpt-3.5-turbo'
    }
  },
  {
    integration: 'anthropic',
    displayName: 'Anthropic Claude',
    category: 'ai',
    icon: 'anthropic-icon.svg',
    configSchema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          format: 'password',
          description: 'Anthropic API Key starting with sk-ant-',
          pattern: '^sk-ant-[a-zA-Z0-9]+$'
        },
        timeout: {
          type: 'number',
          default: 60000,
          description: 'Request timeout in milliseconds'
        },
        maxRetries: {
          type: 'number',
          default: 3,
          description: 'Maximum number of retries'
        },
        apiVersion: {
          type: 'string',
          default: '2023-06-01',
          description: 'API version to use'
        }
      },
      required: ['apiKey']
    },
    requiredFields: [
      {
        name: 'apiKey',
        type: 'password',
        required: true,
        description: 'Anthropic API Key starting with sk-ant-',
        validation: '^sk-ant-[a-zA-Z0-9]+$'
      }
    ],
    optionalFields: [
      {
        name: 'timeout',
        type: 'number',
        required: false,
        default: 60000,
        description: 'Request timeout in milliseconds'
      },
      {
        name: 'maxRetries',
        type: 'number',
        required: false,
        default: 3,
        description: 'Maximum number of retries'
      },
      {
        name: 'apiVersion',
        type: 'select',
        required: false,
        default: '2023-06-01',
        options: [
          { value: '2023-06-01', label: '2023-06-01' },
          { value: '2023-05-01', label: '2023-05-01' }
        ],
        description: 'API version to use'
      }
    ],
    testEndpoint: '/messages',
    testMethod: 'POST',
    documentationUrl: 'https://docs.anthropic.com',
    sdkPackage: '@anthropic-ai/sdk',
    sdkVersion: '^0.20.0',
    exampleConfig: {
      apiKey: 'sk-ant-...',
      timeout: 60000,
      maxRetries: 3,
      apiVersion: '2023-06-01'
    }
  },
  {
    integration: 'groq',
    displayName: 'Groq',
    category: 'ai',
    icon: 'groq-icon.svg',
    configSchema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          format: 'password',
          description: 'Groq API Key',
          pattern: '^gsk_[a-zA-Z0-9]+$'
        },
        model: {
          type: 'string',
          default: 'llama3-70b-8192',
          description: 'Default model to use'
        },
        timeout: {
          type: 'number',
          default: 30000,
          description: 'Request timeout in milliseconds'
        }
      },
      required: ['apiKey']
    },
    requiredFields: [
      {
        name: 'apiKey',
        type: 'password',
        required: true,
        description: 'Groq API Key',
        validation: '^gsk_[a-zA-Z0-9]+$'
      }
    ],
    optionalFields: [
      {
        name: 'model',
        type: 'select',
        required: false,
        default: 'llama3-70b-8192',
        options: [
          { value: 'llama3-70b-8192', label: 'Llama 3 70B' },
          { value: 'llama3-8b-8192', label: 'Llama 3 8B' },
          { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
          { value: 'gemma-7b-it', label: 'Gemma 7B' }
        ],
        description: 'Default model to use'
      },
      {
        name: 'timeout',
        type: 'number',
        required: false,
        default: 30000,
        description: 'Request timeout in milliseconds'
      }
    ],
    testEndpoint: '/chat/completions',
    testMethod: 'POST',
    documentationUrl: 'https://console.groq.com/docs',
    sdkPackage: 'groq-sdk',
    sdkVersion: '^0.3.0',
    exampleConfig: {
      apiKey: 'gsk_...',
      model: 'llama3-70b-8192',
      timeout: 30000
    }
  },
  {
    integration: 'stripe',
    displayName: 'Stripe',
    category: 'payment',
    icon: 'stripe-icon.svg',
    configSchema: {
      type: 'object',
      properties: {
        secretKey: {
          type: 'string',
          format: 'password',
          description: 'Stripe Secret Key (sk_test_... or sk_live_...)',
          pattern: '^sk_(test_|live_)[a-zA-Z0-9]+$'
        },
        publishableKey: {
          type: 'string',
          description: 'Stripe Publishable Key (pk_test_... or pk_live_...)',
          pattern: '^pk_(test_|live_)[a-zA-Z0-9]+$'
        },
        webhookSecret: {
          type: 'string',
          format: 'password',
          description: 'Webhook Secret (whsec_...)',
          pattern: '^whsec_[a-zA-Z0-9]+$'
        },
        environment: {
          type: 'string',
          default: 'test',
          description: 'Environment (test or live)'
        }
      },
      required: ['secretKey', 'publishableKey', 'webhookSecret']
    },
    requiredFields: [
      {
        name: 'secretKey',
        type: 'password',
        required: true,
        description: 'Stripe Secret Key (sk_test_... or sk_live_...)',
        validation: '^sk_(test_|live_)[a-zA-Z0-9]+$'
      },
      {
        name: 'publishableKey',
        type: 'text',
        required: true,
        description: 'Stripe Publishable Key (pk_test_... or pk_live_...)',
        validation: '^pk_(test_|live_)[a-zA-Z0-9]+$'
      },
      {
        name: 'webhookSecret',
        type: 'password',
        required: true,
        description: 'Webhook Secret (whsec_...)',
        validation: '^whsec_[a-zA-Z0-9]+$'
      }
    ],
    optionalFields: [
      {
        name: 'environment',
        type: 'select',
        required: false,
        default: 'test',
        options: [
          { value: 'test', label: 'Test Mode' },
          { value: 'live', label: 'Live Mode' }
        ],
        description: 'Environment (test or live)'
      }
    ],
    testEndpoint: '/customers',
    testMethod: 'GET',
    documentationUrl: 'https://stripe.com/docs',
    sdkPackage: 'stripe',
    sdkVersion: '^14.0.0',
    exampleConfig: {
      secretKey: 'sk_test_...',
      publishableKey: 'pk_test_...',
      webhookSecret: 'whsec_...',
      environment: 'test'
    }
  },
  {
    integration: 'whatsapp',
    displayName: 'WhatsApp Business',
    category: 'communication',
    icon: 'whatsapp-icon.svg',
    configSchema: {
      type: 'object',
      properties: {
        instanceName: {
          type: 'string',
          description: 'Instance name identifier'
        },
        apiUrl: {
          type: 'string',
          description: 'Evolution API URL'
        },
        apiKey: {
          type: 'string',
          format: 'password',
          description: 'Evolution API Key'
        },
        webhookUrl: {
          type: 'string',
          description: 'Webhook URL for receiving messages'
        },
        headless: {
          type: 'boolean',
          default: true,
          description: 'Run in headless mode'
        }
      },
      required: ['instanceName', 'apiUrl', 'apiKey', 'webhookUrl']
    },
    requiredFields: [
      {
        name: 'instanceName',
        type: 'text',
        required: true,
        description: 'Instance name identifier'
      },
      {
        name: 'apiUrl',
        type: 'text',
        required: true,
        description: 'Evolution API URL'
      },
      {
        name: 'apiKey',
        type: 'password',
        required: true,
        description: 'Evolution API Key'
      },
      {
        name: 'webhookUrl',
        type: 'text',
        required: true,
        description: 'Webhook URL for receiving messages'
      }
    ],
    optionalFields: [
      {
        name: 'headless',
        type: 'toggle',
        required: false,
        default: true,
        description: 'Run in headless mode'
      }
    ],
    testEndpoint: '/instance/connectionState/{instance}',
    testMethod: 'GET',
    documentationUrl: 'https://doc.evolution-api.com',
    sdkPackage: 'whatsapp-web.js',
    sdkVersion: '^1.23.0',
    exampleConfig: {
      instanceName: 'minha-instancia',
      apiUrl: 'https://api.evolution.com',
      apiKey: 'sua-api-key',
      webhookUrl: 'https://api.fitOS.com/webhooks/whatsapp',
      headless: true
    }
  }
];

async function seedGlobalLimits() {
  console.log('🌱 Seeding global limits...');
  
  for (const limit of defaultLimits) {
    await prisma.globalLimitsConfig.upsert({
      where: { plan: limit.plan },
      update: limit,
      create: limit
    });
    
    console.log(`✅ Created/updated limits for ${limit.plan} plan`);
  }
}

async function seedIntegrationTemplates() {
  console.log('🌱 Seeding integration templates...');
  
  for (const template of integrationTemplates) {
    await prisma.integrationTemplate.upsert({
      where: { integration: template.integration },
      update: template,
      create: template
    });
    
    console.log(`✅ Created/updated template for ${template.integration}`);
  }
}

async function main() {
  try {
    console.log('🚀 Starting seed process...');
    
    await seedGlobalLimits();
    await seedIntegrationTemplates();
    
    console.log('✅ Seed process completed successfully!');
  } catch (error) {
    console.error('❌ Seed process failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

export { seedGlobalLimits, seedIntegrationTemplates };









