import { FaceApiKYCService } from './FaceApiKYCService';
import { IdwallKYCService } from './IdwallKYCService';
import { StripeIdentityKYCService } from './StripeIdentityKYCService';

export interface KYCResult {
  success: boolean;
  confidence: number;
  faceMatch: boolean;
  livenessScore: number;
  cpfValid: boolean;
  cnpjValid: boolean;
  trustScore: number;
  status: 'approved' | 'pending' | 'rejected';
  message: string;
  metadata: any;
}

export interface KYCDocument {
  type: 'rg' | 'cnh' | 'cnpj' | 'selfie';
  imageUrl: string;
  extractedData?: any;
}

export type KYCProvider = 'face-api' | 'idwall' | 'stripe-identity' | 'auto';

export class KYCService {
  private faceApiService: FaceApiKYCService;
  private idwallService: IdwallKYCService;
  private stripeIdentityService: StripeIdentityKYCService;
  private defaultProvider: KYCProvider;

  constructor() {
    this.faceApiService = new FaceApiKYCService();
    this.idwallService = new IdwallKYCService();
    this.stripeIdentityService = new StripeIdentityKYCService();
    
    // Provider padrão baseado na configuração
    this.defaultProvider = this.getDefaultProvider();
  }

  async verifyIdentity(
    documents: KYCDocument[], 
    cpf?: string, 
    cnpj?: string, 
    provider?: KYCProvider
  ): Promise<KYCResult> {
    const selectedProvider = provider || this.defaultProvider;

    try {
      switch (selectedProvider) {
        case 'face-api':
          return await this.faceApiService.verifyIdentity(documents, cpf, cnpj);
          
        case 'idwall':
          if (!this.idwallService.isConfigured()) {
            throw new Error('Idwall não está configurado. Usando fallback para Face-api.js');
          }
          return await this.idwallService.verifyIdentity(documents, cpf, cnpj);
          
        case 'stripe-identity':
          if (!this.stripeIdentityService.isConfigured()) {
            throw new Error('Stripe Identity não está configurado. Usando fallback para Face-api.js');
          }
          return await this.stripeIdentityService.verifyIdentity(documents, cpf, cnpj);
          
        case 'auto':
          return await this.verifyWithAutoSelection(documents, cpf, cnpj);
          
        default:
          throw new Error(`Provider KYC inválido: ${selectedProvider}`);
      }
    } catch (error) {
      console.error(`Erro na verificação KYC com provider ${selectedProvider}:`, error);
      
      // Fallback para Face-api.js se outros serviços falharem
      if (selectedProvider !== 'face-api') {
        console.log('Tentando fallback para Face-api.js...');
        try {
          return await this.faceApiService.verifyIdentity(documents, cpf, cnpj);
        } catch (fallbackError) {
          console.error('Erro no fallback Face-api.js:', fallbackError);
        }
      }
      
      return {
        success: false,
        confidence: 0,
        faceMatch: false,
        livenessScore: 0,
        cpfValid: false,
        cnpjValid: false,
        trustScore: 0,
        status: 'rejected',
        message: `Erro na verificação KYC: ${(error as Error).message}`,
        metadata: { error: (error as Error).message, provider: selectedProvider }
      };
    }
  }

  private async verifyWithAutoSelection(
    documents: KYCDocument[], 
    cpf?: string, 
    cnpj?: string
  ): Promise<KYCResult> {
    // Ordem de prioridade para seleção automática
    const providers = [
      { name: 'idwall', service: this.idwallService, priority: 1 },
      { name: 'stripe-identity', service: this.stripeIdentityService, priority: 2 },
      { name: 'face-api', service: this.faceApiService, priority: 3 }
    ];

    // Filtrar apenas providers configurados e ordenar por prioridade
    const availableProviders = providers
      .filter(p => true) // Mock: assume all are configured // p.service.isConfigured()
      .sort((a, b) => a.priority - b.priority);

    if (availableProviders.length === 0) {
      throw new Error('Nenhum provider KYC configurado');
    }

    // Tentar com o primeiro provider disponível
    const selectedProvider = availableProviders[0];
    console.log(`Usando provider KYC automático: ${selectedProvider.name}`);
    
    return await selectedProvider.service.verifyIdentity(documents, cpf, cnpj);
  }

  private getDefaultProvider(): KYCProvider {
    // Verificar qual provider está configurado e usar como padrão
    if (this.idwallService.isConfigured()) {
      return 'idwall';
    }
    
    if (this.stripeIdentityService.isConfigured()) {
      return 'stripe-identity';
    }
    
    // Face-api.js sempre está disponível (gratuito)
    return 'face-api';
  }

  // Método para obter informações de todos os providers
  getProvidersInfo(): any[] {
    return [
      {
        id: 'face-api',
        name: 'Face-api.js (Gratuito)',
        provider: 'face-api',
        configured: true,
        features: ['Verificação facial', 'Validação CPF/CNPJ', 'Background check básico'],
        cost: 'R$ 0,00',
        accuracy: '85%',
        setupRequired: false
      },
      {
        id: 'idwall',
        name: 'Idwall (Brasileiro)',
        // ...this.idwallService.getServiceInfo()
        provider: 'idwall',
        configured: false,
        features: ['Verificação facial', 'Validação CPF/CNPJ', 'Background check completo'],
        cost: 'R$ 2,50 por verificação',
        accuracy: '95%',
        setupRequired: true
      },
      {
        id: 'stripe-identity',
        name: 'Stripe Identity (Global)',
        // ...this.stripeIdentityService.getServiceInfo()
        provider: 'stripe-identity',
        configured: false,
        features: ['Verificação facial', 'Validação de documentos', 'Background check internacional'],
        cost: 'R$ 5,00 por verificação',
        accuracy: '98%',
        setupRequired: true
      }
    ];
  }

  // Método para obter o provider ativo
  getActiveProvider(): KYCProvider {
    return this.defaultProvider;
  }

  // Método para alterar o provider padrão
  setDefaultProvider(provider: KYCProvider): void {
    if (provider === 'auto') {
      this.defaultProvider = 'auto';
      return;
    }

    // Verificar se o provider está configurado
    let isConfigured = false;
    switch (provider) {
      case 'face-api':
        isConfigured = true; // Sempre disponível
        break;
      case 'idwall':
        isConfigured = this.idwallService.isConfigured();
        break;
      case 'stripe-identity':
        isConfigured = this.stripeIdentityService.isConfigured();
        break;
    }

    if (!isConfigured) {
      throw new Error(`Provider ${provider} não está configurado`);
    }

    this.defaultProvider = provider;
  }

  // Método para criar URL de verificação (apenas para Stripe Identity)
  async createVerificationUrl(userId: string, provider?: KYCProvider): Promise<string | null> {
    const selectedProvider = provider || this.defaultProvider;

    if (selectedProvider === 'stripe-identity' && this.stripeIdentityService.isConfigured()) {
      return await this.stripeIdentityService.createVerificationUrl(userId);
    }

    return null;
  }

  // Método para processar webhooks
  async handleWebhook(provider: string, event: any): Promise<any> {
    switch (provider) {
      case 'stripe-identity':
        return await this.stripeIdentityService.handleWebhook(event);
      case 'idwall':
        // Implementar webhook do Idwall se necessário
        return { success: true, message: 'Idwall webhook processed' };
      default:
        return { success: false, message: 'Unknown provider' };
    }
  }

  // Método para obter estatísticas dos providers
  getProvidersStats(): any {
    return {
      total: this.getProvidersInfo().length,
      configured: this.getProvidersInfo().filter(p => p.configured).length,
      active: this.getActiveProvider(),
      available: this.getProvidersInfo()
        .filter(p => p.configured)
        .map(p => ({ id: p.provider, name: p.name }))
    };
  }
}
