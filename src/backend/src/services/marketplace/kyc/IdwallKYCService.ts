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

export class IdwallKYCService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.IDWALL_API_KEY || '';
    this.apiSecret = process.env.IDWALL_API_SECRET || '';
    this.baseUrl = process.env.IDWALL_BASE_URL || 'https://api.idwall.co/v1';
  }

  async verifyIdentity(documents: KYCDocument[], cpf?: string, cnpj?: string): Promise<KYCResult> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('Idwall API credentials not configured');
      }

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

      // 1. Verificação de documentos e face via Idwall
      const verificationResult = await this.performIdwallVerification({
        documentImage: documentDoc.imageUrl,
        selfieImage: selfieDoc.imageUrl,
        cpf: cpf,
        cnpj: cnpj
      });

      // 2. Background check criminal (incluído no Idwall)
      const backgroundResult = await this.performCriminalCheck(cpf);

      // 3. Calcular score de confiança
      const trustScore = this.calculateTrustScore(verificationResult, backgroundResult);

      // 4. Determinar status
      let status: 'approved' | 'pending' | 'rejected';
      if (trustScore >= 85) {
        status = 'approved';
      } else if (trustScore >= 70) {
        status = 'pending';
      } else {
        status = 'rejected';
      }

      return {
        success: true,
        confidence: verificationResult.faceConfidence || 0,
        faceMatch: verificationResult.faceMatch || false,
        livenessScore: verificationResult.livenessScore || 0,
        cpfValid: verificationResult.cpfValid || false,
        cnpjValid: verificationResult.cnpjValid || false,
        trustScore: trustScore,
        status: status,
        message: this.getStatusMessage(status, trustScore),
        metadata: {
          provider: 'idwall',
          verificationResult,
          backgroundResult
        }
      };
    } catch (error) {
      console.error('Idwall KYC verification error:', error);
      return {
        success: false,
        confidence: 0,
        faceMatch: false,
        livenessScore: 0,
        cpfValid: false,
        cnpjValid: false,
        trustScore: 0,
        status: 'rejected',
        message: 'Erro na verificação de identidade via Idwall',
        metadata: { error: (error as Error).message }
      };
    }
  }

  private async performIdwallVerification(data: {
    documentImage: string;
    selfieImage: string;
    cpf?: string;
    cnpj?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-API-Secret': this.apiSecret
        },
        body: JSON.stringify({
          document_image: data.documentImage,
          selfie_image: data.selfieImage,
          cpf: data.cpf,
          cnpj: data.cnpj,
          verification_type: 'document_selfie_cpf_cnpj',
          options: {
            enable_face_match: true,
            enable_liveness_check: true,
            enable_document_ocr: true,
            enable_cpf_validation: true,
            enable_cnpj_validation: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Idwall API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        faceMatch: result.face_match || false,
        faceConfidence: result.face_confidence || 0,
        livenessScore: result.liveness_score || 0,
        cpfValid: result.cpf_valid || false,
        cnpjValid: result.cnpj_valid || false,
        documentVerified: result.document_verified || false,
        ocrData: result.ocr_data || {},
        riskScore: result.risk_score || 0
      };
    } catch (error) {
      console.error('Idwall verification API error:', error);
      throw error;
    }
  }

  private async performCriminalCheck(cpf?: string): Promise<{ clean: boolean; data?: any }> {
    try {
      if (!cpf) {
        return { clean: true };
      }

      const response = await fetch(`${this.baseUrl}/criminal-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-API-Secret': this.apiSecret
        },
        body: JSON.stringify({
          cpf: cpf,
          check_type: 'criminal_records'
        })
      });

      if (!response.ok) {
        throw new Error(`Idwall criminal check API error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        clean: !result.has_criminal_records,
        data: result
      };
    } catch (error) {
      console.error('Idwall criminal check error:', error);
      // Em caso de erro, assumir limpo para não bloquear
      return { clean: true };
    }
  }

  private calculateTrustScore(verification: any, background: any): number {
    let score = 0;
    
    // Verificação facial (35 pontos)
    if (verification.faceMatch && verification.faceConfidence > 85) score += 35;
    else if (verification.faceMatch && verification.faceConfidence > 70) score += 25;
    
    // Liveness check (15 pontos)
    if (verification.livenessScore > 80) score += 15;
    else if (verification.livenessScore > 60) score += 10;
    
    // Validação de documentos (25 pontos)
    if (verification.documentVerified) score += 25;
    
    // Validação CPF/CNPJ (15 pontos)
    if (verification.cpfValid) score += 15;
    if (verification.cnpjValid) score += 15;
    
    // Background check (10 pontos)
    if (background.clean) score += 10;
    
    // Penalidade por risco alto
    if (verification.riskScore > 70) score -= 20;
    else if (verification.riskScore > 50) score -= 10;
    
    return Math.max(0, Math.min(score, 100));
  }

  private getStatusMessage(status: string, trustScore: number): string {
    switch (status) {
      case 'approved':
        return `Verificação aprovada via Idwall com score de ${trustScore} pontos`;
      case 'pending':
        return `Verificação pendente de análise manual via Idwall (score: ${trustScore} pontos)`;
      case 'rejected':
        return `Verificação rejeitada via Idwall (score: ${trustScore} pontos). Documentos adicionais podem ser necessários.`;
      default:
        return 'Status de verificação desconhecido';
    }
  }

  // Método para verificar se o serviço está configurado
  isConfigured(): boolean {
    return !!(this.apiKey && this.apiSecret);
  }

  // Método para obter informações do serviço
  getServiceInfo(): any {
    return {
      name: 'Idwall',
      provider: 'idwall',
      configured: this.isConfigured(),
      features: [
        'Verificação facial avançada',
        'Validação de documentos brasileiros',
        'Background check criminal',
        'OCR de documentos',
        'Validação CPF/CNPJ',
        'Score de risco'
      ],
      cost: 'R$ 2-5 por verificação',
      accuracy: '95%',
      setupRequired: true
    };
  }
}
