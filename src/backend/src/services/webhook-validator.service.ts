import * as crypto from 'crypto';
import { Request } from 'express';

/**
 * WebhookValidatorService - Validação de webhooks recebidos
 * 
 * Implementa validação HMAC signature, timestamp e IP whitelist
 * para garantir segurança dos webhooks N8N e customizados.
 */
export class WebhookValidatorService {
  private readonly webhookSecret: string;
  private readonly ipWhitelist: string[];
  private readonly maxTimestampAge: number; // em segundos

  constructor(
    webhookSecret?: string,
    ipWhitelist: string[] = [],
    maxTimestampAge: number = 300 // 5 minutos
  ) {
    this.webhookSecret = webhookSecret || process.env.WEBHOOK_SECRET || '';
    this.ipWhitelist = ipWhitelist.length > 0 ? ipWhitelist : this.getDefaultIpWhitelist();
    this.maxTimestampAge = maxTimestampAge;

    if (!this.webhookSecret) {
      console.warn('⚠️ WEBHOOK_SECRET not configured - webhook validation disabled');
    }
  }

  /**
   * Valida um webhook recebido
   * @param req Request do Express
   * @param body Body da requisição (string ou Buffer)
   * @returns Resultado da validação
   */
  validateWebhook(req: Request, body: string | Buffer): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // 1. Validar IP (se whitelist configurada)
    if (this.ipWhitelist.length > 0) {
      const clientIp = this.getClientIp(req);
      if (!this.isIpAllowed(clientIp)) {
        result.isValid = false;
        result.errors.push(`IP ${clientIp} not in whitelist`);
      }
    }

    // 2. Validar HMAC signature (se secret configurado)
    if (this.webhookSecret) {
      const signature = req.headers['x-webhook-signature'] as string;
      if (!signature) {
        result.isValid = false;
        result.errors.push('Missing X-Webhook-Signature header');
      } else if (!this.validateHmacSignature(body, signature)) {
        result.isValid = false;
        result.errors.push('Invalid HMAC signature');
      }
    }

    // 3. Validar timestamp (se header presente)
    const timestamp = req.headers['x-webhook-timestamp'] as string;
    if (timestamp) {
      if (!this.validateTimestamp(timestamp)) {
        result.isValid = false;
        result.errors.push('Invalid or expired timestamp');
      }
    } else {
      result.warnings.push('Missing X-Webhook-Timestamp header');
    }

    // 4. Validar headers obrigatórios
    const requiredHeaders = ['user-agent', 'content-type'];
    for (const header of requiredHeaders) {
      if (!req.headers[header]) {
        result.warnings.push(`Missing ${header} header`);
      }
    }

    return result;
  }

  /**
   * Valida assinatura HMAC SHA-256
   * @param body Body da requisição
   * @param signature Assinatura recebida
   * @returns true se a assinatura é válida
   */
  validateHmacSignature(body: string | Buffer, signature: string): boolean {
    try {
      // Converter body para string se necessário
      const bodyString = Buffer.isBuffer(body) ? body.toString('utf8') : body;
      
      // Calcular HMAC esperado
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(bodyString, 'utf8')
        .digest('hex');
      
      // Comparar assinaturas (timing-safe)
      const receivedSignature = signature.replace('sha256=', '');
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
    } catch (error) {
      console.error('HMAC validation error:', error);
      return false;
    }
  }

  /**
   * Valida timestamp para prevenir replay attacks
   * @param timestamp Timestamp em segundos
   * @returns true se o timestamp é válido
   */
  validateTimestamp(timestamp: string): boolean {
    try {
      const timestampNumber = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const age = currentTime - timestampNumber;
      
      // Verificar se o timestamp não é muito antigo
      if (age > this.maxTimestampAge) {
        return false;
      }
      
      // Verificar se o timestamp não é do futuro (tolerância de 5 minutos)
      if (timestampNumber > currentTime + 300) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Timestamp validation error:', error);
      return false;
    }
  }

  /**
   * Obtém IP real do cliente (considerando proxies)
   * @param req Request do Express
   * @returns IP do cliente
   */
  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.headers['x-client-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();
  }

  /**
   * Verifica se IP está na whitelist
   * @param ip IP a ser verificado
   * @returns true se o IP é permitido
   */
  private isIpAllowed(ip: string): boolean {
    if (this.ipWhitelist.length === 0) {
      return true; // Sem whitelist = todos permitidos
    }

    // Verificar IP exato
    if (this.ipWhitelist.includes(ip)) {
      return true;
    }

    // Verificar ranges CIDR
    for (const allowedIp of this.ipWhitelist) {
      if (this.isIpInRange(ip, allowedIp)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica se IP está em range CIDR
   * @param ip IP a ser verificado
   * @param range Range CIDR (ex: 192.168.1.0/24)
   * @returns true se o IP está no range
   */
  private isIpInRange(ip: string, range: string): boolean {
    try {
      if (!range.includes('/')) {
        return false; // Não é um range CIDR
      }

      const [rangeIp, prefixLength] = range.split('/');
      const ipNum = this.ipToNumber(ip);
      const rangeNum = this.ipToNumber(rangeIp);
      const mask = (0xffffffff << (32 - parseInt(prefixLength, 10))) >>> 0;

      return (ipNum & mask) === (rangeNum & mask);
    } catch {
      return false;
    }
  }

  /**
   * Converte IP string para número
   * @param ip IP em formato string
   * @returns Número representando o IP
   */
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  /**
   * Obtém lista padrão de IPs permitidos
   * @returns Lista de IPs padrão
   */
  private getDefaultIpWhitelist(): string[] {
    const defaultIps = process.env.WEBHOOK_IP_WHITELIST;
    if (defaultIps) {
      return defaultIps.split(',').map(ip => ip.trim());
    }

    // IPs padrão para desenvolvimento
    return [
      '127.0.0.1',
      '::1',
      'localhost'
    ];
  }

  /**
   * Gera assinatura HMAC para webhook de saída
   * @param body Body da requisição
   * @returns Assinatura HMAC
   */
  generateHmacSignature(body: string | Buffer): string {
    const bodyString = Buffer.isBuffer(body) ? body.toString('utf8') : body;
    const signature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(bodyString, 'utf8')
      .digest('hex');
    
    return `sha256=${signature}`;
  }

  /**
   * Gera timestamp atual
   * @returns Timestamp em segundos
   */
  generateTimestamp(): string {
    return Math.floor(Date.now() / 1000).toString();
  }

  /**
   * Valida configuração do serviço
   * @returns true se a configuração é válida
   */
  isConfigured(): boolean {
    return Boolean(this.webhookSecret && this.webhookSecret.length >= 16);
  }
}

/**
 * Resultado da validação de webhook
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Instância singleton para uso em toda a aplicação
export const webhookValidator = new WebhookValidatorService();
