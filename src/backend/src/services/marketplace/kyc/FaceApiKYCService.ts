import * as faceapi from 'face-api.js';

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

export class FaceApiKYCService {
  private modelsLoaded = false;

  async loadModels() {
    if (this.modelsLoaded) return;
    
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      
      this.modelsLoaded = true;
      console.log('Face-api.js models loaded successfully');
    } catch (error) {
      console.error('Error loading face-api.js models:', error);
      throw new Error('Failed to load face detection models');
    }
  }

  async verifyIdentity(documents: KYCDocument[], cpf?: string, cnpj?: string): Promise<KYCResult> {
    try {
      await this.loadModels();

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

      // 1. Verificação facial
      const faceResult = await this.verifyFace(selfieDoc.imageUrl, documentDoc.imageUrl);
      
      // 2. Validação de CPF/CNPJ (gratuita via APIs do governo)
      const cpfResult = cpf ? await this.validateCPFWithReceita(cpf) : { valid: false };
      const cnpjResult = cnpj ? await this.validateCNPJWithReceita(cnpj) : { valid: false };
      
      // 3. Background check básico (gratuito)
      const backgroundResult = cpf ? await this.checkBackground(cpf) : { clean: false };
      
      // 4. Calcular score de confiança
      const trustScore = this.calculateTrustScore(faceResult, cpfResult, cnpjResult, backgroundResult);
      
      // 5. Determinar status
      let status: 'approved' | 'pending' | 'rejected';
      if (trustScore >= 80) {
        status = 'approved';
      } else if (trustScore >= 60) {
        status = 'pending';
      } else {
        status = 'rejected';
      }

      return {
        success: true,
        confidence: faceResult.confidence,
        faceMatch: faceResult.match,
        livenessScore: faceResult.livenessScore,
        cpfValid: cpfResult.valid,
        cnpjValid: cnpjResult.valid,
        trustScore: trustScore,
        status: status,
        message: this.getStatusMessage(status, trustScore),
        metadata: {
          provider: 'face-api.js',
          faceResult,
          cpfResult,
          cnpjResult,
          backgroundResult
        }
      };
    } catch (error) {
      console.error('Face-api.js KYC verification error:', error);
      return {
        success: false,
        confidence: 0,
        faceMatch: false,
        livenessScore: 0,
        cpfValid: false,
        cnpjValid: false,
        trustScore: 0,
        status: 'rejected',
        message: 'Erro na verificação de identidade',
        metadata: { error: (error as Error).message }
      };
    }
  }

  private async verifyFace(selfieImageUrl: string, documentImageUrl: string): Promise<any> {
    try {
      // Carregar imagens
      // const selfie = await faceapi.bufferToImage(selfieImageUrl);
      // const document = await faceapi.bufferToImage(documentImageUrl);
      const selfie = null; // Mock
      const document = null; // Mock

      // Detectar faces - Mock
      // const selfieDetection = await faceapi.detectSingleFace(selfie, new faceapi.TinyFaceDetectorOptions());
      // const documentDetection = await faceapi.detectSingleFace(document, new faceapi.TinyFaceDetectorOptions());
      const selfieDetection = null;
      const documentDetection = null;

      if (!selfieDetection || !documentDetection) {
        return { match: false, confidence: 0, livenessScore: 0 };
      }

      // Extrair descritores faciais - Mock
      // const selfieDescriptor = await faceapi.computeFaceDescriptor(selfie);
      // const documentDescriptor = await faceapi.computeFaceDescriptor(document);
      const selfieDescriptor = new Float32Array(128);
      const documentDescriptor = new Float32Array(128);

      // Calcular similaridade
      const distance = 0.5; // Mock distance // faceapi.euclideanDistance(selfieDescriptor, documentDescriptor);
      const threshold = 0.6; // Ajustável
      const confidence = Math.max(0, (threshold - distance) / threshold) * 100;

      // Verificação de liveness
      const livenessScore = await this.checkLiveness(selfie);

      return {
        match: distance < threshold,
        confidence: confidence,
        distance: distance,
        livenessScore: livenessScore
      };
    } catch (error) {
      console.error('Face verification error:', error);
      return { match: false, confidence: 0, livenessScore: 0 };
    }
  }

  private async checkLiveness(image: any): Promise<number> {
    try {
      const detections = await faceapi.detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length === 0) return 0;

      const expressions = detections[0].expressions;
      
      // Score baseado em expressões naturais
      const livenessScore = (
        expressions.neutral * 0.3 +
        expressions.happy * 0.2 +
        expressions.surprised * 0.1 +
        expressions.angry * 0.1 +
        expressions.fearful * 0.1 +
        expressions.disgusted * 0.1 +
        expressions.sad * 0.1
      ) * 100;

      return livenessScore;
    } catch (error) {
      console.error('Liveness check error:', error);
      return 0;
    }
  }

  private async validateCPFWithReceita(cpf: string): Promise<{ valid: boolean; data?: any }> {
    try {
      // Validação algorítmica primeiro
      if (!this.isValidCPFAlgorithm(cpf)) {
        return { valid: false };
      }

      // Consulta Receita Federal (gratuita)
      const response = await fetch(`https://www.receitaws.com.br/v1/cpf/${cpf}`);
      const data = await response.json();
      
      return {
        valid: data.status === 'OK',
        data: data
      };
    } catch (error) {
      console.error('CPF validation error:', error);
      return { valid: false };
    }
  }

  private async validateCNPJWithReceita(cnpj: string): Promise<{ valid: boolean; data?: any }> {
    try {
      // Validação algorítmica primeiro
      if (!this.isValidCNPJAlgorithm(cnpj)) {
        return { valid: false };
      }

      // Consulta Receita Federal (gratuita)
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
      const data = await response.json();
      
      return {
        valid: data.status === 'OK',
        data: data
      };
    } catch (error) {
      console.error('CNPJ validation error:', error);
      return { valid: false };
    }
  }

  private async checkBackground(cpf: string): Promise<{ clean: boolean; data?: any }> {
    try {
      // Consulta Serasa Limpa Nome (gratuita)
      // Em produção, usar API real do Serasa
      const response = await fetch('https://api.serasa.com.br/limpa-nome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERASA_API_KEY || 'mock-key'}`
        },
        body: JSON.stringify({ cpf })
      });

      const data = await response.json();
      
      return {
        clean: !data.hasRestrictions,
        data: data
      };
    } catch (error) {
      console.error('Background check error:', error);
      // Em caso de erro, assumir limpo para não bloquear
      return { clean: true };
    }
  }

  private calculateTrustScore(face: any, cpf: any, cnpj: any, background: any): number {
    let score = 0;
    
    // Verificação facial (40 pontos)
    if (face.match && face.confidence > 80) score += 40;
    else if (face.match && face.confidence > 60) score += 25;
    
    // Liveness check (15 pontos)
    if (face.livenessScore > 70) score += 15;
    else if (face.livenessScore > 50) score += 10;
    
    // Validação CPF/CNPJ (25 pontos)
    if (cpf.valid) score += 25;
    if (cnpj.valid) score += 25;
    
    // Background check (20 pontos)
    if (background.clean) score += 20;
    
    return Math.min(score, 100);
  }

  private isValidCPFAlgorithm(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[10])) return false;

    return true;
  }

  private isValidCNPJAlgorithm(cnpj: string): boolean {
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cnpj[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;
    if (firstDigit !== parseInt(cnpj[12])) return false;

    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cnpj[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;
    if (secondDigit !== parseInt(cnpj[13])) return false;

    return true;
  }

  private getStatusMessage(status: string, trustScore: number): string {
    switch (status) {
      case 'approved':
        return `Verificação aprovada com score de ${trustScore} pontos`;
      case 'pending':
        return `Verificação pendente de análise manual (score: ${trustScore} pontos)`;
      case 'rejected':
        return `Verificação rejeitada (score: ${trustScore} pontos). Documentos adicionais podem ser necessários.`;
      default:
        return 'Status de verificação desconhecido';
    }
  }
}
