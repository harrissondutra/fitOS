import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WhatsAppConfigData {
  tenantId: string;
  provider: string;
  phoneNumber: string;
  apiKey: string;
  apiSecret: string;
  isActive: boolean;
  settings: any;
}

/**
 * ⭐ CONFIGURAÇÃO CENTRAL ÚNICA DO WHATSAPP
 * Todas as funcionalidades DEVEM usar esta classe
 */
export class WhatsAppConfigManager {
  private static instance: WhatsAppConfigManager;
  private configCache: Map<string, WhatsAppConfigData> = new Map();

  private constructor() {}

  public static getInstance(): WhatsAppConfigManager {
    if (!WhatsAppConfigManager.instance) {
      WhatsAppConfigManager.instance = new WhatsAppConfigManager();
    }
    return WhatsAppConfigManager.instance;
  }

  /**
   * Obter configuração WhatsApp do tenant
   * TODAS as funcionalidades devem usar este método
   */
  async getConfig(tenantId: string): Promise<WhatsAppConfigData | null> {
    // Verificar cache
    if (this.configCache.has(tenantId)) {
      return this.configCache.get(tenantId)!;
    }

    // Buscar do banco
    const config = await prisma.whatsAppConfig.findFirst({
      where: { tenantId, isActive: true }
    });

    if (config) {
      const configData: WhatsAppConfigData = {
        tenantId: config.tenantId,
        provider: config.provider,
        phoneNumber: config.phoneNumber,
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
        isActive: config.isActive,
        settings: config.settings
      };
      
      // Cachear por 5 minutos
      this.configCache.set(tenantId, configData);
      setTimeout(() => this.configCache.delete(tenantId), 5 * 60 * 1000);
      
      return configData;
    }

    return null;
  }

  /**
   * Invalidar cache quando config é atualizada
   */
  invalidateCache(tenantId: string): void {
    this.configCache.delete(tenantId);
  }
}

export const whatsAppConfigManager = WhatsAppConfigManager.getInstance();


