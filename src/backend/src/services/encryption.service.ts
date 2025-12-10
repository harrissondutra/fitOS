import * as crypto from 'node:crypto';
import { logger } from '../utils/logger';

/**
 * Serviço de criptografia para credenciais de banco de dados
 * Usa AES-256-GCM para criptografia simétrica segura
 */
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  
  private encryptionKey: Buffer;

  constructor() {
    const envKey = process.env.ENCRYPTION_KEY;
    
    if (!envKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Garantir que a chave tenha 32 bytes
    if (envKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }

    // Converter string para Buffer (32 bytes)
    this.encryptionKey = Buffer.from(envKey.slice(0, 32), 'utf8');
    
    logger.info('EncryptionService initialized');
  }

  /**
   * Criptografa um texto usando ένα-256-GCM
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Retornar: iv:tag:encrypted (todos em hex)
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Descriptografa um texto criptografado
   */
  decrypt(encryptedText: string): string {
    try {
      const parts = encryptedText.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
      }

      const [ivHex, tagHex, encrypted] = parts;
      
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Gera uma chave de criptografia aleatória (para setup inicial)
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Retorna uma versão mascarada de uma chave (exibe apenas os 4 últimos chars)
   */
  maskApiKey(key: string | null | undefined): string | null {
    if (!key) return null;
    const visible = key.slice(-4);
    return `••••••••••••••••${visible}`;
  }

  /**
   * Heurística simples para identificar se um valor foi criptografado por este serviço
   * Formato esperado: iv:tag:payload (hex)
   */
  isEncrypted(value: string | null | undefined): boolean {
    if (!value) return false;
    const parts = value.split(':');
    return parts.length === 3 && parts.every(p => /^[0-9a-fA-F]+$/.test(p));
  }

  /**
   * Criptografa campos sensíveis de um objeto de configuração conforme uma lista de campos
   */
  encryptSensitiveFields(config: Record<string, any>, fields: Array<{ name: string }>): Record<string, any> {
    const clone: Record<string, any> = { ...config };
    for (const field of fields) {
      const name = field.name;
      if (clone[name] && typeof clone[name] === 'string' && !this.isEncrypted(clone[name])) {
        clone[name] = this.encrypt(clone[name]);
      }
    }
    return clone;
  }

  /**
   * Descriptografa campos sensíveis de um objeto de configuração conforme uma lista de campos
   */
  decryptSensitiveFields(config: Record<string, any>, fields: Array<{ name: string }>): Record<string, any> {
    const clone: Record<string, any> = { ...config };
    for (const field of fields) {
      const name = field.name;
      if (clone[name] && typeof clone[name] === 'string' && this.isEncrypted(clone[name])) {
        clone[name] = this.decrypt(clone[name]);
      }
    }
    return clone;
  }
}
