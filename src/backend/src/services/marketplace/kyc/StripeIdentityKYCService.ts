import Stripe from 'stripe';

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

export class StripeIdentityKYCService {
  private stripe: Stripe;
  private publishableKey: string;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
    
    if (!secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async verifyIdentity(documents: KYCDocument[], cpf?: string, cnpj?: string): Promise<KYCResult> {
    try {
      const selfieDoc = documents.find(doc => doc.type === 'selfie');
      const documentDoc = documents.find(doc => doc.type === 'rg' || doc.type === 'cnh');

      if (!selfieDoc || !documentDoc) {
        return {
          success: false,
          confidence: 0,
          faceMatch: false,
          livenessScore: 0,
          cpfValid: false,
          cnpjValid: false,
          trustScore: 0,
          status: 'rejected',
          message: 'Documentos de selfie e RG/CNH são obrigatórios',
          metadata: {}
        };
      }

      // 1. Criar sessão de verificação Stripe Identity
      const verificationSession = await this.createVerificationSession({
        documentImage: documentDoc.imageUrl,
        selfieImage: selfieDoc.imageUrl,
        cpf: cpf,
        cnpj: cnpj
      });

      // 2. Aguardar processamento (em produção, usar webhooks)
      const verificationResult = await this.waitForVerification(verificationSession.id);

      // 3. Calcular score de confiança
      const trustScore = this.calculateTrustScore(verificationResult);

      // 4. Determinar status
      let status: 'approved' | 'pending' | 'rejected';
      if (verificationResult.status === 'verified') {
        status = 'approved';
      } else if (verificationResult.status === 'pending') {
        status = 'pending';
      } else {
        status = 'rejected';
      }

      return {
        success: true,
        confidence: verificationResult.verification?.face?.confidence || 0,
        faceMatch: verificationResult.verification?.face?.match || false,
        livenessScore: verificationResult.verification?.face?.liveness || 0,
        cpfValid: verificationResult.verification?.document?.cpf_valid || false,
        cnpjValid: verificationResult.verification?.document?.cnpj_valid || false,
        trustScore: trustScore,
        status: status,
        message: this.getStatusMessage(status, trustScore),
        metadata: {
          provider: 'stripe-identity',
          verificationSessionId: verificationSession.id,
          verificationResult
        }
      };
    } catch (error) {
      console.error('Stripe Identity KYC verification error:', error);
      return {
        success: false,
        confidence: 0,
        faceMatch: false,
        livenessScore: 0,
        cpfValid: false,
        cnpjValid: false,
        trustScore: 0,
        status: 'rejected',
        message: 'Erro na verificação de identidade via Stripe Identity',
        metadata: { error: (error as Error).message }
      };
    }
  }

  private async createVerificationSession(data: {
    documentImage: string;
    selfieImage: string;
    cpf?: string;
    cnpj?: string;
  }): Promise<Stripe.Identity.VerificationSession> {
    try {
      const verificationSession = await this.stripe.identity.verificationSessions.create({
        type: 'document',
        options: {
          document: {
            allowed_types: ['driving_license', 'id_card', 'passport'],
            require_id_number: true,
            require_live_capture: true,
            require_matching_selfie: true,
          },
        },
        metadata: {
          cpf: data.cpf || '',
          cnpj: data.cnpj || '',
          document_image: data.documentImage,
          selfie_image: data.selfieImage
        }
      });

      return verificationSession;
    } catch (error) {
      console.error('Error creating Stripe Identity verification session:', error);
      throw error;
    }
  }

  private async waitForVerification(sessionId: string): Promise<any> {
    try {
      // Em produção, isso seria feito via webhooks
      // Aqui simulamos aguardando o processamento
      const maxAttempts = 30; // 30 tentativas = 30 segundos
      let attempts = 0;

      while (attempts < maxAttempts) {
        const session = await this.stripe.identity.verificationSessions.retrieve(sessionId);
        
        if (session.status === 'verified' || session.status === 'canceled' || session.status === 'requires_input') {
          return {
            status: session.status,
            verification: session.verified_outputs,
            last_verification_error: 'mock-error' // session.last_verification_error
          };
        }

        // Aguardar 1 segundo antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      // Timeout
      return {
        status: 'timeout',
        verification: null,
        last_verification_error: { code: 'timeout', message: 'Verification timeout' }
      };
    } catch (error) {
      console.error('Error waiting for Stripe Identity verification:', error);
      throw error;
    }
  }

  private calculateTrustScore(verification: any): number {
    let score = 0;
    
    if (!verification.verification) {
      return 0;
    }

    const v = verification.verification;
    
    // Verificação facial (40 pontos)
    if (v.face?.match && v.face?.confidence > 0.8) score += 40;
    else if (v.face?.match && v.face?.confidence > 0.6) score += 25;
    
    // Liveness check (20 pontos)
    if (v.face?.liveness > 0.8) score += 20;
    else if (v.face?.liveness > 0.6) score += 15;
    
    // Validação de documento (25 pontos)
    if (v.document?.verified) score += 25;
    
    // Validação de ID (15 pontos)
    if (v.document?.id_number_valid) score += 15;
    
    return Math.min(score, 100);
  }

  private getStatusMessage(status: string, trustScore: number): string {
    switch (status) {
      case 'approved':
        return `Verificação aprovada via Stripe Identity com score de ${trustScore} pontos`;
      case 'pending':
        return `Verificação pendente via Stripe Identity (score: ${trustScore} pontos)`;
      case 'rejected':
        return `Verificação rejeitada via Stripe Identity (score: ${trustScore} pontos). Documentos adicionais podem ser necessários.`;
      default:
        return 'Status de verificação desconhecido';
    }
  }

  // Método para criar URL de verificação no frontend
  async createVerificationUrl(userId: string): Promise<string> {
    try {
      const verificationSession = await this.stripe.identity.verificationSessions.create({
        type: 'document',
        options: {
          document: {
            allowed_types: ['driving_license', 'id_card', 'passport'],
            require_id_number: true,
            require_live_capture: true,
            require_matching_selfie: true,
          },
        },
        metadata: {
          user_id: userId
        }
      });

      return verificationSession.url || 'mock-url';
    } catch (error) {
      console.error('Error creating Stripe Identity verification URL:', error);
      throw error;
    }
  }

  // Método para processar webhook do Stripe Identity
  async handleWebhook(event: Stripe.Event): Promise<any> {
    try {
      switch (event.type) {
        case 'identity.verification_session.verified': {
          const verifiedSession = event.data.object as Stripe.Identity.VerificationSession;
          console.log('Verification session verified:', verifiedSession.id);
          // Aqui você pode atualizar o status no banco de dados
          return { success: true, sessionId: verifiedSession.id };
        }
          
        case 'identity.verification_session.canceled': {
          const canceledSession = event.data.object as Stripe.Identity.VerificationSession;
          console.log('Verification session canceled:', canceledSession.id);
          return { success: true, sessionId: canceledSession.id };
        }
          
        default:
          console.log('Unhandled Stripe Identity event type:', event.type);
          return { success: false, message: 'Unhandled event type' };
      }
    } catch (error) {
      console.error('Error handling Stripe Identity webhook:', error);
      throw error;
    }
  }

  // Método para verificar se o serviço está configurado
  isConfigured(): boolean {
    return !!(process.env.STRIPE_SECRET_KEY && this.publishableKey);
  }

  // Método para obter informações do serviço
  getServiceInfo(): any {
    return {
      name: 'Stripe Identity',
      provider: 'stripe-identity',
      configured: this.isConfigured(),
      features: [
        'Verificação facial avançada',
        'Validação de documentos internacionais',
        'Liveness detection',
        'OCR de documentos',
        'Conformidade global',
        'Webhooks automáticos'
      ],
      cost: 'R$ 5-10 por verificação',
      accuracy: '98%',
      setupRequired: true,
      publishableKey: this.publishableKey
    };
  }
}
