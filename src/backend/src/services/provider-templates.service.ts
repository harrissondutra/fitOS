import { AiProviderType, AI_PROVIDER_DISPLAY_NAMES } from '../../../shared/types/ai.types'

export interface ProviderTemplate {
  id: string
  name: string
  displayName: string
  provider: AiProviderType
  description: string
  icon: string // Emoji fallback
  iconUrl?: string // URL pública do SVG (opcional)
  documentationUrl?: string
  color: string
  models: string[]
  features: string[]
  pricing: {
    model: string
    inputCost: number // per 1K tokens
    outputCost: number // per 1K tokens
  }[]
  capabilities: {
    chat: boolean
    vision: boolean
    audio: boolean
    embeddings: boolean
    functionCalling: boolean
    streaming: boolean
  }
  config: {
    baseUrl?: string
    timeout: number
    maxRetries: number
    headers?: Record<string, string>
  }
  setup: {
    requiresApiKey: boolean
    apiKeyPlaceholder: string
    apiKeyHelp: string
    additionalConfig?: Array<{
      key: string
      label: string
      type: 'text' | 'url' | 'number' | 'boolean'
      placeholder?: string
      help?: string
      required?: boolean
    }>
  }
}

export class ProviderTemplatesService {
  private static templates: ProviderTemplate[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      displayName: 'OpenAI GPT',
      provider: AiProviderType.OPENAI,
      description: 'Modelos GPT-4, GPT-3.5 e DALL-E para conversação, análise de imagens e geração de conteúdo',
      icon: '🤖',
      iconUrl: 'https://cdn.svgrepo.com/show/364167/openai.svg',
      color: 'bg-green-100 text-green-800',
      models: [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k',
        'dall-e-3',
        'dall-e-2',
        'whisper-1',
        'tts-1',
        'tts-1-hd'
      ],
      features: [
        'Conversação avançada',
        'Análise de imagens',
        'Geração de imagens',
        'Transcrição de áudio',
        'Síntese de voz',
        'Function calling',
        'Streaming'
      ],
      pricing: [
        { model: 'gpt-4o', inputCost: 0.005, outputCost: 0.015 },
        { model: 'gpt-4o-mini', inputCost: 0.00015, outputCost: 0.0006 },
        { model: 'gpt-4-turbo', inputCost: 0.01, outputCost: 0.03 },
        { model: 'gpt-4', inputCost: 0.03, outputCost: 0.06 },
        { model: 'gpt-3.5-turbo', inputCost: 0.0015, outputCost: 0.002 }
      ],
      capabilities: {
        chat: true,
        vision: true,
        audio: true,
        embeddings: true,
        functionCalling: true,
        streaming: true
      },
      config: {
        baseUrl: 'https://api.openai.com/v1',
        timeout: 30000,
        maxRetries: 3,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      setup: {
        requiresApiKey: true,
        apiKeyPlaceholder: 'sk-...',
        apiKeyHelp: 'Sua chave API do OpenAI. Obtenha em https://platform.openai.com/api-keys',
        additionalConfig: [
          {
            key: 'organization',
            label: 'Organization ID',
            type: 'text',
            placeholder: 'org-...',
            help: 'ID da organização (opcional)',
            required: false
          }
        ]
      }
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      displayName: 'Google Gemini',
      provider: AiProviderType.GEMINI,
      description: 'Modelos Gemini Pro e Gemini Pro Vision para conversação multimodal e análise de imagens',
      icon: '💎',
      iconUrl: 'https://cdn.svgrepo.com/show/303108/google-icon-logo.svg',
      color: 'bg-blue-100 text-blue-800',
      models: [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'gemini-1.0-pro-vision',
        'gemini-1.5-pro-vision'
      ],
      features: [
        'Conversação multimodal',
        'Análise de imagens',
        'Processamento de documentos',
        'Raciocínio avançado',
        'Contexto longo (1M tokens)',
        'Streaming'
      ],
      pricing: [
        { model: 'gemini-1.5-pro', inputCost: 0.00125, outputCost: 0.005 },
        { model: 'gemini-1.5-flash', inputCost: 0.000075, outputCost: 0.0003 },
        { model: 'gemini-1.0-pro', inputCost: 0.0005, outputCost: 0.0015 }
      ],
      capabilities: {
        chat: true,
        vision: true,
        audio: false,
        embeddings: true,
        functionCalling: true,
        streaming: true
      },
      config: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        timeout: 30000,
        maxRetries: 3,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      setup: {
        requiresApiKey: true,
        apiKeyPlaceholder: 'AIza...',
        apiKeyHelp: 'Sua chave API do Google AI. Obtenha em https://makersuite.google.com/app/apikey',
        additionalConfig: []
      }
    },
    {
      id: 'groq',
      name: 'Groq',
      displayName: 'Groq (Llama/Mixtral)',
      provider: AiProviderType.GROQ,
      description: 'Modelos Llama 3, Mixtral e Whisper com inferência ultra-rápida para aplicações em tempo real',
      icon: '⚡',
      iconUrl: 'https://cdn.simpleicons.org/groq',
      color: 'bg-purple-100 text-purple-800',
      models: [
        'llama-3.1-70b-versatile',
        'llama-3.1-8b-instant',
        'llama-3-70b-8192',
        'llama-3-8b-8192',
        'mixtral-8x7b-32768',
        'gemma-7b-it',
        'whisper-large-v3'
      ],
      features: [
        'Inferência ultra-rápida',
        'Modelos open-source',
        'Transcrição de áudio',
        'Streaming',
        'Baixo custo',
        'Alta performance'
      ],
      pricing: [
        { model: 'llama-3.1-70b-versatile', inputCost: 0.00059, outputCost: 0.00079 },
        { model: 'llama-3.1-8b-instant', inputCost: 0.00005, outputCost: 0.00005 },
        { model: 'mixtral-8x7b-32768', inputCost: 0.00027, outputCost: 0.00027 }
      ],
      capabilities: {
        chat: true,
        vision: false,
        audio: true,
        embeddings: false,
        functionCalling: false,
        streaming: true
      },
      config: {
        baseUrl: 'https://api.groq.com/openai/v1',
        timeout: 30000,
        maxRetries: 3,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      setup: {
        requiresApiKey: true,
        apiKeyPlaceholder: 'gsk_...',
        apiKeyHelp: 'Sua chave API do Groq. Obtenha em https://console.groq.com/keys',
        additionalConfig: []
      }
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      displayName: 'Anthropic Claude',
      provider: AiProviderType.CLAUDE,
      description: 'Modelos Claude 3 Opus, Sonnet e Haiku para conversação avançada e análise de documentos',
      icon: '🧠',
      iconUrl: 'https://cdn.simpleicons.org/anthropic',
      color: 'bg-orange-100 text-orange-800',
      models: [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ],
      features: [
        'Conversação avançada',
        'Análise de documentos',
        'Raciocínio complexo',
        'Contexto longo (200K tokens)',
        'Streaming',
        'Function calling'
      ],
      pricing: [
        { model: 'claude-3-5-sonnet-20241022', inputCost: 0.003, outputCost: 0.015 },
        { model: 'claude-3-5-haiku-20241022', inputCost: 0.0008, outputCost: 0.004 },
        { model: 'claude-3-opus-20240229', inputCost: 0.015, outputCost: 0.075 }
      ],
      capabilities: {
        chat: true,
        vision: true,
        audio: false,
        embeddings: false,
        functionCalling: true,
        streaming: true
      },
      config: {
        baseUrl: 'https://api.anthropic.com/v1',
        timeout: 30000,
        maxRetries: 3,
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      },
      setup: {
        requiresApiKey: true,
        apiKeyPlaceholder: 'sk-ant-...',
        apiKeyHelp: 'Sua chave API do Anthropic. Obtenha em https://console.anthropic.com/',
        additionalConfig: []
      }
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      displayName: 'Mistral AI',
      provider: AiProviderType.MISTRAL,
      description: 'Modelos Mistral 7B, Mixtral 8x7B e Codestral para conversação e geração de código',
      icon: '🌪️',
      iconUrl: 'https://cdn.simpleicons.org/mistral',
      color: 'bg-cyan-100 text-cyan-800',
      models: [
        'mistral-large-latest',
        'mistral-medium-latest',
        'mistral-small-latest',
        'codestral-latest'
      ],
      features: [
        'Conversação eficiente',
        'Geração de código',
        'Modelos compactos',
        'Streaming',
        'Baixo custo',
        'Multilíngue'
      ],
      pricing: [
        { model: 'mistral-large-latest', inputCost: 0.002, outputCost: 0.006 },
        { model: 'mistral-medium-latest', inputCost: 0.0025, outputCost: 0.0075 },
        { model: 'mistral-small-latest', inputCost: 0.001, outputCost: 0.003 }
      ],
      capabilities: {
        chat: true,
        vision: false,
        audio: false,
        embeddings: true,
        functionCalling: false,
        streaming: true
      },
      config: {
        baseUrl: 'https://api.mistral.ai/v1',
        timeout: 30000,
        maxRetries: 3,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      setup: {
        requiresApiKey: true,
        apiKeyPlaceholder: '...',
        apiKeyHelp: 'Sua chave API do Mistral AI. Obtenha em https://console.mistral.ai/',
        additionalConfig: []
      }
    },
    {
      id: 'cohere',
      name: 'Cohere',
      displayName: 'Cohere',
      provider: AiProviderType.COHERE,
      description: 'Modelos Command e Embed para conversação, análise de texto e embeddings',
      icon: '🔮',
      iconUrl: 'https://cdn.simpleicons.org/cohere',
      color: 'bg-pink-100 text-pink-800',
      models: [
        'command',
        'command-light',
        'command-nightly',
        'embed-english-v3.0',
        'embed-multilingual-v3.0'
      ],
      features: [
        'Conversação especializada',
        'Análise de texto',
        'Embeddings de alta qualidade',
        'Classificação de texto',
        'Streaming',
        'Multilíngue'
      ],
      pricing: [
        { model: 'command', inputCost: 0.0015, outputCost: 0.002 },
        { model: 'command-light', inputCost: 0.0003, outputCost: 0.0006 },
        { model: 'embed-english-v3.0', inputCost: 0.0001, outputCost: 0 }
      ],
      capabilities: {
        chat: true,
        vision: false,
        audio: false,
        embeddings: true,
        functionCalling: false,
        streaming: true
      },
      config: {
        baseUrl: 'https://api.cohere.ai/v1',
        timeout: 30000,
        maxRetries: 3,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      setup: {
        requiresApiKey: true,
        apiKeyPlaceholder: '...',
        apiKeyHelp: 'Sua chave API do Cohere. Obtenha em https://dashboard.cohere.ai/',
        additionalConfig: []
      }
    },
    {
      id: 'ollama',
      name: 'Ollama',
      displayName: 'Ollama (Local)',
      provider: AiProviderType.OLLAMA,
      description: 'Modelos locais Llama, Mistral e CodeLlama para uso privado e desenvolvimento',
      icon: '🏠',
      iconUrl: 'https://cdn.simpleicons.org/ollama',
      color: 'bg-gray-100 text-gray-800',
      models: [
        'llama3.1:70b',
        'llama3.1:8b',
        'mistral:7b',
        'codellama:13b',
        'phi3:medium',
        'gemma2:9b'
      ],
      features: [
        'Execução local',
        'Privacidade total',
        'Sem custos de API',
        'Modelos open-source',
        'Customização completa',
        'Offline'
      ],
      pricing: [
        { model: 'llama3.1:70b', inputCost: 0, outputCost: 0 },
        { model: 'llama3.1:8b', inputCost: 0, outputCost: 0 },
        { model: 'mistral:7b', inputCost: 0, outputCost: 0 }
      ],
      capabilities: {
        chat: true,
        vision: true,
        audio: false,
        embeddings: true,
        functionCalling: false,
        streaming: true
      },
      config: {
        baseUrl: 'http://localhost:11434',
        timeout: 60000,
        maxRetries: 2,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      setup: {
        requiresApiKey: false,
        apiKeyPlaceholder: '',
        apiKeyHelp: 'Ollama roda localmente, não requer chave API',
        additionalConfig: [
          {
            key: 'baseUrl',
            label: 'URL do Ollama',
            type: 'url',
            placeholder: 'http://localhost:11434',
            help: 'URL onde o Ollama está rodando',
            required: true
          }
        ]
      }
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      displayName: 'Hugging Face',
      provider: AiProviderType.HUGGINGFACE,
      description: 'Milhares de modelos open-source para conversação, análise de texto e embeddings',
      icon: '🤗',
      iconUrl: 'https://cdn.simpleicons.org/huggingface',
      color: 'bg-yellow-100 text-yellow-800',
      models: [
        'microsoft/DialoGPT-medium',
        'facebook/blenderbot-400M-distill',
        'google/flan-t5-large',
        'sentence-transformers/all-MiniLM-L6-v2',
        'microsoft/DialoGPT-large'
      ],
      features: [
        'Milhares de modelos',
        'Modelos especializados',
        'Embeddings gratuitos',
        'Modelos de pesquisa',
        'Customização',
        'Open-source'
      ],
      pricing: [
        { model: 'microsoft/DialoGPT-medium', inputCost: 0.0001, outputCost: 0.0001 },
        { model: 'google/flan-t5-large', inputCost: 0.0001, outputCost: 0.0001 },
        { model: 'sentence-transformers/all-MiniLM-L6-v2', inputCost: 0.0001, outputCost: 0 }
      ],
      capabilities: {
        chat: true,
        vision: true,
        audio: true,
        embeddings: true,
        functionCalling: false,
        streaming: false
      },
      config: {
        baseUrl: 'https://api-inference.huggingface.co',
        timeout: 30000,
        maxRetries: 3,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      setup: {
        requiresApiKey: true,
        apiKeyPlaceholder: 'hf_...',
        apiKeyHelp: 'Sua chave API do Hugging Face. Obtenha em https://huggingface.co/settings/tokens',
        additionalConfig: []
      }
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      displayName: 'DeepSeek',
      provider: AiProviderType.DEEPSEEK,
      description: 'Modelos DeepSeek para conversação, análise de código e raciocínio avançado',
      icon: '🧠',
      iconUrl: 'https://cdn.simpleicons.org/deepseek',
      color: 'bg-purple-100 text-purple-800',
      models: [
        'deepseek-chat',
        'deepseek-coder',
        'deepseek-reasoner',
        'deepseek-vl'
      ],
      features: [
        'Conversação avançada',
        'Análise de código',
        'Raciocínio matemático',
        'Visão computacional',
        'Streaming',
        'Multilíngue',
        'Baixo custo',
        'Retry automático',
        'Tratamento de erros robusto'
      ],
      pricing: [
        { model: 'deepseek-chat', inputCost: 0.00014, outputCost: 0.00028 },
        { model: 'deepseek-coder', inputCost: 0.00014, outputCost: 0.00028 },
        { model: 'deepseek-reasoner', inputCost: 0.00055, outputCost: 0.00219 },
        { model: 'deepseek-vl', inputCost: 0.00014, outputCost: 0.00028 }
      ],
      capabilities: {
        chat: true,
        vision: true,
        audio: false,
        embeddings: false,
        functionCalling: false,
        streaming: true
      },
      config: {
        baseUrl: 'https://api.deepseek.com',
        timeout: 60000,
        maxRetries: 3,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      setup: {
        requiresApiKey: true,
        apiKeyPlaceholder: 'sk-...',
        apiKeyHelp: 'Sua chave API do DeepSeek. Obtenha em https://platform.deepseek.com/',
        additionalConfig: []
      }
    }
  ]

  /**
   * Lista todos os templates disponíveis
   */
  static getAllTemplates(): ProviderTemplate[] {
    // Gerar placeholders para provedores que ainda não possuem template dedicado
    const existingProviders = new Set(this.templates.map(t => t.provider))
    const allProviders = Object.values(AiProviderType) as AiProviderType[]

    const placeholders: ProviderTemplate[] = allProviders
      .filter((prov) => !existingProviders.has(prov))
      .map((prov) => this.createPlaceholderTemplate(prov))

    return [...this.templates, ...placeholders]
  }

  /**
   * Busca template por ID
   */
  static getTemplateById(id: string): ProviderTemplate | null {
    return this.templates.find(template => template.id === id) || null
  }

  /**
   * Busca templates por provedor
   */
  static getTemplatesByProvider(provider: AiProviderType): ProviderTemplate[] {
    return this.templates.filter(template => template.provider === provider)
  }

  /**
   * Busca templates por capacidade
   */
  static getTemplatesByCapability(capability: keyof ProviderTemplate['capabilities']): ProviderTemplate[] {
    return this.templates.filter(template => template.capabilities[capability])
  }

  /**
   * Gera configuração inicial baseada no template
   */
  static generateInitialConfig(templateId: string, apiKey?: string, additionalConfig?: Record<string, any>) {
    const template = this.getTemplateById(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const config: any = {
      name: template.displayName,
      displayName: template.displayName,
      provider: template.provider,
      models: template.models,
      isActive: true,
      isDefault: false,
      timeout: template.config.timeout,
      maxRetries: template.config.maxRetries,
      config: {
        ...template.config,
        ...additionalConfig
      }
    }

    if (apiKey && template.setup.requiresApiKey) {
      config.apiKey = apiKey
    }

    return config
  }

  /**
   * Valida configuração baseada no template
   */
  static validateConfig(templateId: string, config: any): { valid: boolean; errors: string[] } {
    const template = this.getTemplateById(templateId)
    if (!template) {
      return { valid: false, errors: [`Template ${templateId} not found`] }
    }

    const errors: string[] = []

    // Validar API key se necessário
    if (template.setup.requiresApiKey && !config.apiKey) {
      errors.push('API key é obrigatória para este provedor')
    }

    // Validar configurações adicionais obrigatórias
    if (template.setup.additionalConfig) {
      for (const additional of template.setup.additionalConfig) {
        if (additional.required && !config[additional.key]) {
          errors.push(`${additional.label} é obrigatório`)
        }
      }
    }

    // Validar modelos
    if (config.models && Array.isArray(config.models)) {
      const invalidModels = config.models.filter((model: string) => !template.models.includes(model))
      if (invalidModels.length > 0) {
        errors.push(`Modelos inválidos: ${invalidModels.join(', ')}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Obtém estatísticas dos templates
   */
  static getTemplatesStats() {
    const templates = this.getAllTemplates()
    
    return {
      total: templates.length,
      byProvider: templates.reduce((acc, template) => {
        acc[template.provider] = (acc[template.provider] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      capabilities: {
        chat: templates.filter(t => t.capabilities.chat).length,
        vision: templates.filter(t => t.capabilities.vision).length,
        audio: templates.filter(t => t.capabilities.audio).length,
        embeddings: templates.filter(t => t.capabilities.embeddings).length,
        functionCalling: templates.filter(t => t.capabilities.functionCalling).length,
        streaming: templates.filter(t => t.capabilities.streaming).length
      },
      averagePricing: templates.reduce((acc, template) => {
        const avgInput = template.pricing.reduce((sum, p) => sum + p.inputCost, 0) / template.pricing.length
        const avgOutput = template.pricing.reduce((sum, p) => sum + p.outputCost, 0) / template.pricing.length
        acc.input += avgInput
        acc.output += avgOutput
        return acc
      }, { input: 0, output: 0 })
    }
  }

  /**
   * Cria um template placeholder para um provedor ainda não detalhado
   */
  private static createPlaceholderTemplate(provider: AiProviderType): ProviderTemplate {
    const id = String(provider).toLowerCase()
    const display = (AI_PROVIDER_DISPLAY_NAMES as any)?.[provider] || provider

    return {
      id,
      name: display,
      displayName: display,
      provider,
      description: 'Template genérico pronto para configuração rápida. Insira a API Key e a Base URL para ativar.',
      icon: '🤖',
      iconUrl: undefined,
      documentationUrl: undefined,
      color: 'bg-muted text-foreground',
      models: [],
      features: ['Configuração rápida', 'Compatível com múltiplos serviços'],
      pricing: [],
      capabilities: {
        chat: true,
        vision: false,
        audio: false,
        embeddings: false,
        functionCalling: false,
        streaming: false
      },
      config: {
        timeout: 30000,
        maxRetries: 3,
        headers: { 'Content-Type': 'application/json' }
      },
      setup: {
        requiresApiKey: true,
        apiKeyPlaceholder: 'sk-...'
        ,
        apiKeyHelp: 'Insira sua API Key deste provedor para ativar. Consulte a documentação oficial.',
        additionalConfig: [
          {
            key: 'baseUrl',
            label: 'Base URL',
            type: 'url',
            placeholder: 'https://api.exemplo.com/v1',
            help: 'Endpoint base da API oficial',
            required: true
          }
        ]
      }
    }
  }
}
