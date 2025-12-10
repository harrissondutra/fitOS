import { Router } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { ProviderTemplatesService } from '../services/provider-templates.service'
import { AiPricingSyncService } from '../services/ai-pricing-sync.service'

const router = Router()

/**
 * GET /api/super-admin/ai-providers/help
 * Retorna dados formatados para a página Help com recomendações por caso de uso
 */
router.get('/', asyncHandler(async (req, res) => {
  const templates = ProviderTemplatesService.getAllTemplates()
  
  // Mapeamento de casos de uso recomendados
  const useCaseRecommendations = {
    'Conversação Avançada': [
      { provider: 'OPENAI', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4'], description: 'Melhor para conversação natural e complexa' },
      { provider: 'CLAUDE', models: ['claude-3-7-sonnet', 'claude-4', 'claude-3-5-sonnet-20241022'], description: 'Excelente para diálogos longos e análise de contexto' },
      { provider: 'GEMINI', models: ['gemini-2.5-pro', 'gemini-1.5-pro'], description: 'Conversação multimodal com contexto longo' }
    ],
    'Análise de Vídeos': [
      { provider: 'GEMINI', models: ['gemini-2.5-pro', 'gemini-1.5-pro-vision'], description: 'Recomendado para análise de vídeos e conteúdo visual' },
      { provider: 'OPENAI', models: ['gpt-4o', 'gpt-4-vision'], description: 'Análise de vídeos e imagens com alta qualidade' },
      { provider: 'REKA_AI', models: ['reka-core', 'reka-flash'], description: 'Especializado em análise multimodal de vídeos' }
    ],
    'Análise de Imagens': [
      { provider: 'OPENAI', models: ['gpt-4o', 'gpt-4-vision'], description: 'Análise detalhada de imagens com alta precisão' },
      { provider: 'CLAUDE', models: ['claude-3-7-sonnet', 'claude-3-5-sonnet-20241022'], description: 'Análise visual avançada com contexto' },
      { provider: 'GEMINI', models: ['gemini-1.5-pro-vision', 'gemini-2.5-pro'], description: 'Visão computacional multimodal' }
    ],
    'Geração de Código': [
      { provider: 'DEEPSEEK', models: ['deepseek-coder', 'deepseek-v3'], description: 'Especializado em geração e análise de código' },
      { provider: 'MISTRAL', models: ['codestral-latest', 'mistral-large-latest'], description: 'Modelos otimizados para código' },
      { provider: 'OPENAI', models: ['gpt-4o', 'gpt-4-turbo'], description: 'Geração de código com alta qualidade' }
    ],
    'Embeddings': [
      { provider: 'OPENAI', models: ['text-embedding-3-large', 'text-embedding-3-small'], description: 'Embeddings de alta qualidade' },
      { provider: 'COHERE', models: ['embed-english-v3.0', 'embed-multilingual-v3.0'], description: 'Embeddings multilíngues especializados' },
      { provider: 'HUGGINGFACE', models: ['sentence-transformers/all-MiniLM-L6-v2', 'BAAI/bge-large-en-v1.5'], description: 'Modelos open-source para embeddings' }
    ],
    'Raciocínio Complexo': [
      { provider: 'CLAUDE', models: ['claude-3-7-sonnet', 'claude-4'], description: 'Raciocínio avançado e análise profunda' },
      { provider: 'OPENAI', models: ['o1-preview', 'o3', 'gpt-4o'], description: 'Modelos especializados em raciocínio' },
      { provider: 'DEEPSEEK', models: ['deepseek-r1', 'deepseek-reasoner'], description: 'Raciocínio matemático e lógico' }
    ],
    'Velocidade': [
      { provider: 'GROQ', models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile'], description: 'Inferência ultra-rápida' },
      { provider: 'OLLAMA', models: ['llama3.1:70b', 'mistral:7b'], description: 'Execução local com baixa latência' },
      { provider: 'MISTRAL', models: ['mistral-small-3.2', 'mistral-small-latest'], description: 'Modelos compactos e rápidos' }
    ],
    'Custo-Benefício': [
      { provider: 'GEMINI', models: ['gemini-1.5-flash', 'gemini-2.0-flash-exp'], description: 'Melhor custo-benefício para uso geral' },
      { provider: 'DEEPSEEK', models: ['deepseek-chat', 'deepseek-v3'], description: 'Alta qualidade com baixo custo' },
      { provider: 'GROQ', models: ['llama-3.1-8b-instant', 'gemma2-9b-it'], description: 'Modelos rápidos e econômicos' }
    ],
    'Multimodal': [
      { provider: 'GEMINI', models: ['gemini-2.5-pro', 'gemini-1.5-pro'], description: 'Líder em capacidades multimodais' },
      { provider: 'OPENAI', models: ['gpt-4o', 'gpt-4-turbo'], description: 'Visão, áudio e texto integrados' },
      { provider: 'REKA_AI', models: ['reka-core', 'reka-flash'], description: 'Análise multimodal avançada' }
    ],
    'Pesquisa/Busca': [
      { provider: 'XAI', models: ['grok-3', 'grok-2'], description: 'Pesquisa em tempo real com acesso à internet' },
      { provider: 'PERPLEXITY', models: ['pplx-70b-online', 'llama-3.1-sonar-large-128k-online'], description: 'Busca avançada com citações' }
    ],
    'Especializado': [
      { provider: 'REKA_AI', models: ['reka-core', 'reka-flash'], description: 'Especializado em análise multimodal' },
      { provider: 'WRITER', models: ['palmyra-large', 'palmyra-x'], description: 'Geração de conteúdo profissional' },
      { provider: 'INFLECTION_AI', models: ['pi-3.1', 'pi-2'], description: 'Conversação empática e assistência' }
    ]
  }
  
  // Formatar dados para a página
  const formattedData = {
    templates: templates.map(template => ({
      id: template.id,
      name: template.name,
      displayName: template.displayName,
      provider: template.provider,
      description: template.description,
      icon: template.icon,
      color: template.color,
      models: template.models,
      features: template.features,
      pricing: template.pricing,
      capabilities: template.capabilities,
      documentationUrl: template.documentationUrl,
      setup: {
        requiresApiKey: template.setup.requiresApiKey,
        apiKeyHelp: template.setup.apiKeyHelp
      }
    })),
    useCaseRecommendations,
    stats: {
      totalProviders: templates.length,
      totalModels: templates.reduce((sum, t) => sum + t.models.length, 0),
      byCapability: {
        chat: templates.filter(t => t.capabilities.chat).length,
        vision: templates.filter(t => t.capabilities.vision).length,
        audio: templates.filter(t => t.capabilities.audio).length,
        embeddings: templates.filter(t => t.capabilities.embeddings).length,
        functionCalling: templates.filter(t => t.capabilities.functionCalling).length,
        streaming: templates.filter(t => t.capabilities.streaming).length
      }
    }
  }
  
  return res.json({
    success: true,
    data: formattedData
  })
}))

/**
 * POST /api/super-admin/ai-providers/help/sync-prices
 * Sincroniza preços de todos os provedores
 */
router.post('/sync-prices', asyncHandler(async (req, res) => {
  const result = await AiPricingSyncService.syncAllPrices()
  
  return res.json({
    success: true,
    data: result,
    message: `Sincronização concluída: ${result.updated} modelos atualizados`
  })
}))

/**
 * GET /api/super-admin/ai-providers/help/pricing-stats
 * Obtém estatísticas de preços
 */
router.get('/pricing-stats', asyncHandler(async (req, res) => {
  const stats = AiPricingSyncService.getPricingStats()
  
  return res.json({
    success: true,
    data: stats
  })
}))

export default router

