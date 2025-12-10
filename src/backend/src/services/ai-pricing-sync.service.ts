/**
 * Serviço de Sincronização de Preços de LLMs
 * 
 * Este serviço permite sincronizar preços atualizados dos provedores LLM
 * quando disponível via API ou web scraping (conforme documentação oficial)
 */

import { ProviderTemplatesService } from './provider-templates.service'
import { logger } from '../utils/logger'

export interface PricingUpdate {
  provider: string
  model: string
  inputCost: number // USD per 1K tokens
  outputCost: number // USD per 1K tokens
  lastUpdated: Date
  source: 'official-api' | 'manual' | 'scraped'
}

export class AiPricingSyncService {
  /**
   * Sincroniza preços de todos os provedores
   * Por enquanto retorna os preços dos templates (estáticos)
   * TODO: Implementar busca de preços atualizados quando APIs disponíveis
   */
  static async syncAllPrices(): Promise<{
    updated: number
    errors: string[]
    lastSync: Date
  }> {
    const errors: string[] = []
    let updated = 0

    try {
      logger.info('Starting pricing sync for all providers')

      const templates = ProviderTemplatesService.getAllTemplates()

      // Por enquanto, apenas valida que os preços estão presentes
      // TODO: Implementar busca de preços atualizados via APIs quando disponível
      for (const template of templates) {
        if (template.pricing.length === 0) {
          errors.push(`No pricing data for provider: ${template.name}`)
        } else {
          updated += template.pricing.length
        }
      }

      logger.info(`Pricing sync completed: ${updated} models validated`)

      return {
        updated,
        errors,
        lastSync: new Date()
      }
    } catch (error) {
      logger.error('Error syncing prices:', error)
      throw error
    }
  }

  /**
   * Sincroniza preços de um provedor específico
   */
  static async syncProviderPrices(providerId: string): Promise<{
    updated: number
    errors: string[]
  }> {
    const errors: string[] = []
    let updated = 0

    try {
      const template = ProviderTemplatesService.getTemplateById(providerId)

      if (!template) {
        errors.push(`Provider not found: ${providerId}`)
        return { updated: 0, errors }
      }

      // TODO: Implementar busca de preços específicos do provedor
      // Por enquanto retorna os preços do template
      updated = template.pricing.length

      logger.info(`Pricing sync completed for ${providerId}: ${updated} models`)

      return {
        updated,
        errors
      }
    } catch (error) {
      logger.error(`Error syncing prices for ${providerId}:`, error)
      errors.push(error instanceof Error ? error.message : 'Unknown error')
      return { updated: 0, errors }
    }
  }

  /**
   * Obtém preços atualizados de um provedor via API oficial (quando disponível)
   * 
   * TODO: Implementar integrações com APIs oficiais quando disponíveis:
   * - OpenAI: https://openai.com/api/pricing/
   * - Anthropic: https://www.anthropic.com/pricing
   * - Google: https://ai.google.dev/pricing
   * - etc.
   */
  static async fetchProviderPricesFromAPI(provider: string): Promise<PricingUpdate[] | null> {
    // TODO: Implementar busca de preços via APIs oficiais
    // Por enquanto retorna null
    logger.info(`Fetching prices from API for provider: ${provider} (not implemented yet)`)
    return null
  }

  /**
   * Valida se os preços estão atualizados
   */
  static validatePrices(): {
    valid: boolean
    issues: string[]
  } {
    const issues: string[] = []
    const templates = ProviderTemplatesService.getAllTemplates()

    for (const template of templates) {
      // Verificar se tem preços
      if (template.pricing.length === 0) {
        issues.push(`Provider ${template.name} has no pricing data`)
        continue
      }

      // Verificar se os preços são válidos (maiores ou iguais a zero)
      for (const price of template.pricing) {
        if (price.inputCost < 0 || price.outputCost < 0) {
          issues.push(`Invalid pricing for ${template.name} model ${price.model}`)
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * Obtém estatísticas de preços
   */
  static getPricingStats() {
    const templates = ProviderTemplatesService.getAllTemplates()
    
    const allPrices = templates.flatMap(t => t.pricing)
    
    const avgInputCost = allPrices.reduce((sum, p) => sum + p.inputCost, 0) / allPrices.length
    const avgOutputCost = allPrices.reduce((sum, p) => sum + p.outputCost, 0) / allPrices.length
    
    const minInputCost = Math.min(...allPrices.map(p => p.inputCost))
    const maxInputCost = Math.max(...allPrices.map(p => p.inputCost))
    
    const minOutputCost = Math.min(...allPrices.map(p => p.outputCost))
    const maxOutputCost = Math.max(...allPrices.map(p => p.outputCost))

    return {
      totalModels: allPrices.length,
      averageInputCost: avgInputCost,
      averageOutputCost: avgOutputCost,
      minInputCost,
      maxInputCost,
      minOutputCost,
      maxOutputCost,
      providersCount: templates.length
    }
  }
}

