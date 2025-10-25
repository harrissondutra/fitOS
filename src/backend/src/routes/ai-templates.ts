import { Router } from 'express'
import { asyncHandler } from '../utils/async-handler'
import { ProviderTemplatesService } from '../services/provider-templates.service'
import { AiProviderType } from '../../../shared/types/ai.types'

const router = Router()

/**
 * GET /api/super-admin/ai-templates
 * Lista todos os templates de provedores disponíveis
 */
router.get('/',  asyncHandler(async (req, res) => {
  const templates = ProviderTemplatesService.getAllTemplates()
  
  return res.json({
    success: true,
    data: templates,
    count: templates.length
  })
}))

/**
 * GET /api/super-admin/ai-templates/:id
 * Busca template específico por ID
 */
router.get('/:id',  asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const template = ProviderTemplatesService.getTemplateById(id)
  if (!template) {
    return res.status(404).json({
      success: false,
      error: 'Template not found'
    })
  }
  
  return res.json({
    success: true,
    data: template
  })
}))

/**
 * GET /api/super-admin/ai-templates/provider/:provider
 * Lista templates por tipo de provedor
 */
router.get('/provider/:provider',  asyncHandler(async (req, res) => {
  const { provider } = req.params
  
  // Validar se o provider é válido
  if (!Object.values(AiProviderType).includes(provider as AiProviderType)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid provider type'
    })
  }
  
  const templates = ProviderTemplatesService.getTemplatesByProvider(provider as AiProviderType)
  
  return res.json({
    success: true,
    data: templates,
    count: templates.length
  })
}))

/**
 * GET /api/super-admin/ai-templates/capability/:capability
 * Lista templates por capacidade específica
 */
router.get('/capability/:capability',  asyncHandler(async (req, res) => {
  const { capability } = req.params
  
  const validCapabilities = ['chat', 'vision', 'audio', 'embeddings', 'functionCalling', 'streaming']
  if (!validCapabilities.includes(capability)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid capability. Valid capabilities: ' + validCapabilities.join(', ')
    })
  }
  
  const templates = ProviderTemplatesService.getTemplatesByCapability(capability as any)
  
  return res.json({
    success: true,
    data: templates,
    count: templates.length
  })
}))

/**
 * POST /api/super-admin/ai-templates/:id/generate-config
 * Gera configuração inicial baseada no template
 */
router.post('/:id/generate-config',  asyncHandler(async (req, res) => {
  const { id } = req.params
  const { apiKey, additionalConfig } = req.body
  
  try {
    const config = ProviderTemplatesService.generateInitialConfig(id, apiKey, additionalConfig)
    
    return res.json({
      success: true,
      data: config
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate config'
    })
  }
}))

/**
 * POST /api/super-admin/ai-templates/:id/validate-config
 * Valida configuração baseada no template
 */
router.post('/:id/validate-config',  asyncHandler(async (req, res) => {
  const { id } = req.params
  const { config } = req.body
  
  if (!config) {
    return res.status(400).json({
      success: false,
      error: 'Config is required'
    })
  }
  
  const validation = ProviderTemplatesService.validateConfig(id, config)
  
  return res.json({
    success: true,
    data: validation
  })
}))

/**
 * GET /api/super-admin/ai-templates/stats/overview
 * Obtém estatísticas dos templates
 */
router.get('/stats/overview',  asyncHandler(async (req, res) => {
  const stats = ProviderTemplatesService.getTemplatesStats()
  
  return res.json({
    success: true,
    data: stats
  })
}))

/**
 * GET /api/super-admin/ai-templates/search
 * Busca templates por critérios
 */
router.get('/search',  asyncHandler(async (req, res) => {
  const { 
    query, 
    provider, 
    capability, 
    hasVision, 
    hasAudio, 
    hasEmbeddings,
    maxCost 
  } = req.query
  
  let templates = ProviderTemplatesService.getAllTemplates()
  
  // Filtrar por query de texto
  if (query && typeof query === 'string') {
    const searchTerm = query.toLowerCase()
    templates = templates.filter(template => 
      template.name.toLowerCase().includes(searchTerm) ||
      template.displayName.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.features.some(feature => feature.toLowerCase().includes(searchTerm))
    )
  }
  
  // Filtrar por provedor
  if (provider && typeof provider === 'string') {
    templates = templates.filter(template => template.provider === provider)
  }
  
  // Filtrar por capacidade
  if (capability && typeof capability === 'string') {
    const validCapabilities = ['chat', 'vision', 'audio', 'embeddings', 'functionCalling', 'streaming']
    if (validCapabilities.includes(capability)) {
      templates = templates.filter(template => template.capabilities[capability as keyof typeof template.capabilities])
    }
  }
  
  // Filtrar por capacidades específicas
  if (hasVision === 'true') {
    templates = templates.filter(template => template.capabilities.vision)
  }
  
  if (hasAudio === 'true') {
    templates = templates.filter(template => template.capabilities.audio)
  }
  
  if (hasEmbeddings === 'true') {
    templates = templates.filter(template => template.capabilities.embeddings)
  }
  
  // Filtrar por custo máximo
  if (maxCost && typeof maxCost === 'string') {
    const maxCostNum = parseFloat(maxCost)
    if (!isNaN(maxCostNum)) {
      templates = templates.filter(template => 
        template.pricing.some(p => p.inputCost <= maxCostNum || p.outputCost <= maxCostNum)
      )
    }
  }
  
  return res.json({
    success: true,
    data: templates,
    count: templates.length,
    filters: {
      query,
      provider,
      capability,
      hasVision,
      hasAudio,
      hasEmbeddings,
      maxCost
    }
  })
}))

export default router
