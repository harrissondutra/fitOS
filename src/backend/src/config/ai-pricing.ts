/**
 * Configuração de preços dos provedores de IA
 * Baseado nas documentações oficiais dos principais provedores
 */

export interface PricingTier {
  inputTokensPerMillion: number;
  outputTokensPerMillion: number;
  currency: string;
  description?: string;
}

export interface ModelPricing {
  model: string;
  provider: string;
  pricing: {
    standard: PricingTier;
    discounted?: PricingTier;
    cacheHit?: PricingTier;
    cacheMiss?: PricingTier;
  };
  contextLength: number;
  maxOutput: number;
  features: {
    jsonOutput: boolean;
    functionCalling: boolean;
    vision: boolean;
    audio: boolean;
    streaming: boolean;
  };
}

export interface ProviderPricing {
  name: string;
  models: ModelPricing[];
  timezone: string;
  discountHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

// Configuração de preços baseada nas documentações oficiais
export const AI_PRICING_CONFIG: ProviderPricing[] = [
  {
    name: 'OpenAI',
    timezone: 'UTC',
    models: [
      {
        model: 'gpt-4o',
        provider: 'OpenAI',
        pricing: {
          standard: {
            inputTokensPerMillion: 2.50,
            outputTokensPerMillion: 10.00,
            currency: 'USD'
          }
        },
        contextLength: 128000,
        maxOutput: 4096,
        features: {
          jsonOutput: true,
          functionCalling: true,
          vision: true,
          audio: false,
          streaming: true
        }
      },
      {
        model: 'gpt-4o-mini',
        provider: 'OpenAI',
        pricing: {
          standard: {
            inputTokensPerMillion: 0.15,
            outputTokensPerMillion: 0.60,
            currency: 'USD'
          }
        },
        contextLength: 128000,
        maxOutput: 16384,
        features: {
          jsonOutput: true,
          functionCalling: true,
          vision: true,
          audio: false,
          streaming: true
        }
      },
      {
        model: 'gpt-3.5-turbo',
        provider: 'OpenAI',
        pricing: {
          standard: {
            inputTokensPerMillion: 0.50,
            outputTokensPerMillion: 1.50,
            currency: 'USD'
          }
        },
        contextLength: 16385,
        maxOutput: 4096,
        features: {
          jsonOutput: true,
          functionCalling: true,
          vision: false,
          audio: false,
          streaming: true
        }
      }
    ]
  },
  {
    name: 'Anthropic',
    timezone: 'UTC',
    models: [
      {
        model: 'claude-3-5-sonnet-20241022',
        provider: 'Anthropic',
        pricing: {
          standard: {
            inputTokensPerMillion: 3.00,
            outputTokensPerMillion: 15.00,
            currency: 'USD'
          }
        },
        contextLength: 200000,
        maxOutput: 8192,
        features: {
          jsonOutput: true,
          functionCalling: true,
          vision: true,
          audio: false,
          streaming: true
        }
      },
      {
        model: 'claude-3-5-haiku-20241022',
        provider: 'Anthropic',
        pricing: {
          standard: {
            inputTokensPerMillion: 1.00,
            outputTokensPerMillion: 5.00,
            currency: 'USD'
          }
        },
        contextLength: 200000,
        maxOutput: 8192,
        features: {
          jsonOutput: true,
          functionCalling: true,
          vision: true,
          audio: false,
          streaming: true
        }
      }
    ]
  },
  {
    name: 'Google Gemini',
    timezone: 'UTC',
    models: [
      {
        model: 'gemini-1.5-pro',
        provider: 'Google',
        pricing: {
          standard: {
            inputTokensPerMillion: 1.25,
            outputTokensPerMillion: 5.00,
            currency: 'USD'
          }
        },
        contextLength: 2000000,
        maxOutput: 8192,
        features: {
          jsonOutput: true,
          functionCalling: true,
          vision: true,
          audio: true,
          streaming: true
        }
      },
      {
        model: 'gemini-1.5-flash',
        provider: 'Google',
        pricing: {
          standard: {
            inputTokensPerMillion: 0.075,
            outputTokensPerMillion: 0.30,
            currency: 'USD'
          }
        },
        contextLength: 1000000,
        maxOutput: 8192,
        features: {
          jsonOutput: true,
          functionCalling: true,
          vision: true,
          audio: true,
          streaming: true
        }
      }
    ]
  },
  {
    name: 'Groq',
    timezone: 'UTC',
    models: [
      {
        model: 'llama-3.1-70b-versatile',
        provider: 'Groq',
        pricing: {
          standard: {
            inputTokensPerMillion: 0.59,
            outputTokensPerMillion: 0.79,
            currency: 'USD'
          }
        },
        contextLength: 131072,
        maxOutput: 2048,
        features: {
          jsonOutput: true,
          functionCalling: false,
          vision: false,
          audio: false,
          streaming: true
        }
      },
      {
        model: 'mixtral-8x7b-32768',
        provider: 'Groq',
        pricing: {
          standard: {
            inputTokensPerMillion: 0.24,
            outputTokensPerMillion: 0.24,
            currency: 'USD'
          }
        },
        contextLength: 32768,
        maxOutput: 2048,
        features: {
          jsonOutput: true,
          functionCalling: false,
          vision: false,
          audio: false,
          streaming: true
        }
      }
    ]
  },
  {
    name: 'DeepSeek',
    timezone: 'Asia/Shanghai',
    discountHours: {
      start: '00:30',
      end: '08:30'
    },
    models: [
      {
        model: 'deepseek-chat',
        provider: 'DeepSeek',
        pricing: {
          standard: {
            inputTokensPerMillion: 0.27,
            outputTokensPerMillion: 1.10,
            currency: 'USD'
          },
          discounted: {
            inputTokensPerMillion: 0.135,
            outputTokensPerMillion: 0.550,
            currency: 'USD',
            description: 'Off-peak hours (UTC 16:30-00:30)'
          },
          cacheHit: {
            inputTokensPerMillion: 0.07,
            outputTokensPerMillion: 1.10,
            currency: 'USD'
          },
          cacheMiss: {
            inputTokensPerMillion: 0.27,
            outputTokensPerMillion: 1.10,
            currency: 'USD'
          }
        },
        contextLength: 128000,
        maxOutput: 4096,
        features: {
          jsonOutput: true,
          functionCalling: true,
          vision: false,
          audio: false,
          streaming: true
        }
      },
      {
        model: 'deepseek-reasoner',
        provider: 'DeepSeek',
        pricing: {
          standard: {
            inputTokensPerMillion: 0.55,
            outputTokensPerMillion: 2.19,
            currency: 'USD'
          },
          discounted: {
            inputTokensPerMillion: 0.135,
            outputTokensPerMillion: 0.550,
            currency: 'USD',
            description: 'Off-peak hours (UTC 16:30-00:30)'
          },
          cacheHit: {
            inputTokensPerMillion: 0.14,
            outputTokensPerMillion: 2.19,
            currency: 'USD'
          },
          cacheMiss: {
            inputTokensPerMillion: 0.55,
            outputTokensPerMillion: 2.19,
            currency: 'USD'
          }
        },
        contextLength: 128000,
        maxOutput: 32000,
        features: {
          jsonOutput: true,
          functionCalling: false,
          vision: false,
          audio: false,
          streaming: true
        }
      }
    ]
  }
];

/**
 * Calcula o custo de uma requisição baseado no modelo e tokens utilizados
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  provider?: string,
  isCacheHit?: boolean,
  isDiscountTime?: boolean
): number {
  const providerConfig = AI_PRICING_CONFIG.find(p => 
    provider ? p.name === provider : p.models.some(m => m.model === model)
  );

  if (!providerConfig) {
    throw new Error(`Provider not found for model: ${model}`);
  }

  const modelConfig = providerConfig.models.find(m => m.model === model);
  if (!modelConfig) {
    throw new Error(`Model not found: ${model}`);
  }

  let pricing = modelConfig.pricing.standard;

  // Aplicar desconto se estiver no horário de desconto
  if (isDiscountTime && modelConfig.pricing.discounted) {
    pricing = modelConfig.pricing.discounted;
  }

  // Aplicar preço de cache hit/miss se disponível
  if (isCacheHit !== undefined) {
    if (isCacheHit && modelConfig.pricing.cacheHit) {
      pricing = modelConfig.pricing.cacheHit;
    } else if (!isCacheHit && modelConfig.pricing.cacheMiss) {
      pricing = modelConfig.pricing.cacheMiss;
    }
  }

  const inputCost = (inputTokens / 1000000) * pricing.inputTokensPerMillion;
  const outputCost = (outputTokens / 1000000) * pricing.outputTokensPerMillion;

  return inputCost + outputCost;
}

/**
 * Verifica se está no horário de desconto para um provedor
 */
export function isDiscountTime(provider: string): boolean {
  const providerConfig = AI_PRICING_CONFIG.find(p => p.name === provider);
  if (!providerConfig?.discountHours) {
    return false;
  }

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    timeZone: providerConfig.timezone 
  });

  const { start, end } = providerConfig.discountHours;
  return currentTime >= start && currentTime <= end;
}

/**
 * Obtém informações de preço para um modelo específico
 */
export function getModelPricing(model: string, provider?: string): ModelPricing | null {
  const providerConfig = AI_PRICING_CONFIG.find(p => 
    provider ? p.name === provider : p.models.some(m => m.model === model)
  );

  if (!providerConfig) {
    return null;
  }

  return providerConfig.models.find(m => m.model === model) || null;
}

/**
 * Lista todos os modelos disponíveis com seus preços
 */
export function getAllModels(): ModelPricing[] {
  return AI_PRICING_CONFIG.flatMap(provider => provider.models);
}

/**
 * Obtém estatísticas de preços por provedor
 */
export function getProviderStats() {
  return AI_PRICING_CONFIG.map(provider => ({
    name: provider.name,
    modelCount: provider.models.length,
    avgInputPrice: provider.models.reduce((sum, model) => 
      sum + model.pricing.standard.inputTokensPerMillion, 0) / provider.models.length,
    avgOutputPrice: provider.models.reduce((sum, model) => 
      sum + model.pricing.standard.outputTokensPerMillion, 0) / provider.models.length,
    hasDiscount: !!provider.discountHours,
    timezone: provider.timezone
  }));
}
