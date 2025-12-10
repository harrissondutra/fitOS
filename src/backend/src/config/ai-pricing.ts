/**
 * Configuração de preços dos provedores de IA
 * Baseado nas documentações oficiais dos principais provedores
 * 
 * NOTA: Para a lista completa de modelos e preços atualizados, consulte
 * ProviderTemplatesService.getAllTemplates() que contém todos os 31 provedores
 * com preços atualizados em USD por 1K tokens.
 * 
 * Este arquivo mantém os modelos principais para cálculo de custos.
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
  },
  {
    name: 'Mistral AI',
    timezone: 'UTC',
    models: [
      {
        model: 'mistral-large-latest',
        provider: 'Mistral AI',
        pricing: {
          standard: {
            inputTokensPerMillion: 2.70,
            outputTokensPerMillion: 8.10,
            currency: 'USD'
          }
        },
        contextLength: 128000,
        maxOutput: 8192,
        features: {
          jsonOutput: true,
          functionCalling: true,
          vision: false,
          audio: false,
          streaming: true
        }
      },
      {
        model: 'mistral-small-latest',
        provider: 'Mistral AI',
        pricing: {
          standard: {
            inputTokensPerMillion: 0.20,
            outputTokensPerMillion: 0.60,
            currency: 'USD'
          }
        },
        contextLength: 128000,
        maxOutput: 8192,
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
    name: 'Cohere',
    timezone: 'UTC',
    models: [
      {
        model: 'command-r-plus',
        provider: 'Cohere',
        pricing: {
          standard: {
            inputTokensPerMillion: 3.00,
            outputTokensPerMillion: 15.00,
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
        model: 'command-r',
        provider: 'Cohere',
        pricing: {
          standard: {
            inputTokensPerMillion: 0.50,
            outputTokensPerMillion: 1.50,
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
      }
    ]
  },
  {
    name: 'xAI',
    timezone: 'UTC',
    models: [
      {
        model: 'grok-2-vision-1212',
        provider: 'xAI',
        pricing: {
          standard: {
            inputTokensPerMillion: 2.50,
            outputTokensPerMillion: 10.00,
            currency: 'USD'
          }
        },
        contextLength: 131072,
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
        model: 'grok-beta',
        provider: 'xAI',
        pricing: {
          standard: {
            inputTokensPerMillion: 1.00,
            outputTokensPerMillion: 4.00,
            currency: 'USD'
          }
        },
        contextLength: 131072,
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
    name: 'Meta',
    timezone: 'UTC',
    models: [
      {
        model: 'llama-3.1-70b-instruct',
        provider: 'Meta',
        pricing: {
          standard: {
            inputTokensPerMillion: 0.59,
            outputTokensPerMillion: 0.79,
            currency: 'USD'
          }
        },
        contextLength: 131072,
        maxOutput: 8192,
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
    name: 'Perplexity',
    timezone: 'UTC',
    models: [
      {
        model: 'pplx-70b-online',
        provider: 'Perplexity',
        pricing: {
          standard: {
            inputTokensPerMillion: 0.70,
            outputTokensPerMillion: 2.80,
            currency: 'USD'
          }
        },
        contextLength: 131072,
        maxOutput: 4096,
        features: {
          jsonOutput: false,
          functionCalling: false,
          vision: false,
          audio: false,
          streaming: true
        }
      }
    ]
  },
  {
    name: 'Amazon',
    timezone: 'UTC',
    models: [
      {
        model: 'amazon.titan-text-premier-v1:0',
        provider: 'Amazon',
        pricing: {
          standard: {
            inputTokensPerMillion: 1.25,
            outputTokensPerMillion: 5.00,
            currency: 'USD'
          }
        },
        contextLength: 128000,
        maxOutput: 8192,
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
    name: 'Microsoft Azure',
    timezone: 'UTC',
    models: [
      {
        model: 'gpt-4o',
        provider: 'Microsoft Azure',
        pricing: {
          standard: {
            inputTokensPerMillion: 5.00,
            outputTokensPerMillion: 15.00,
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

/**
 * Busca preços dos templates quando não encontrado neste arquivo
 * Converte de preço por 1K tokens para por milhão de tokens
 */
export function getPricingFromTemplate(model: string, provider?: string): ModelPricing | null {
  try {
    // Importação dinâmica para evitar dependência circular
    const { ProviderTemplatesService } = require('../services/provider-templates.service');
    const templates = ProviderTemplatesService.getAllTemplates();
    
    const template = templates.find((t: any) => 
      provider ? t.provider === provider : t.models.includes(model)
    );
    
    if (!template) {
      return null;
    }
    
    const priceInfo = template.pricing.find((p: any) => p.model === model);
    if (!priceInfo) {
      return null;
    }
    
    // Converter de USD por 1K tokens para USD por milhão de tokens
    return {
      model,
      provider: template.name,
      pricing: {
        standard: {
          inputTokensPerMillion: priceInfo.inputCost * 1000,
          outputTokensPerMillion: priceInfo.outputCost * 1000,
          currency: 'USD'
        }
      },
      contextLength: 128000, // Default, pode ser ajustado
      maxOutput: 4096, // Default
      features: {
        jsonOutput: template.capabilities.functionCalling || false,
        functionCalling: template.capabilities.functionCalling || false,
        vision: template.capabilities.vision || false,
        audio: template.capabilities.audio || false,
        streaming: template.capabilities.streaming || false
      }
    };
  } catch (error) {
    console.warn('Error fetching pricing from templates:', error);
    return null;
  }
}

/**
 * Obtém preços com fallback para templates
 */
export function getModelPricingWithFallback(model: string, provider?: string): ModelPricing | null {
  // Primeiro tenta buscar no arquivo local
  const localPricing = getModelPricing(model, provider);
  if (localPricing) {
    return localPricing;
  }
  
  // Se não encontrar, busca nos templates
  return getPricingFromTemplate(model, provider);
}
