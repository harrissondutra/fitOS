import crypto from 'crypto';
import { ConfigField } from '../../../shared/types/integrations.types';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 32; // 256 bits

  private getEncryptionKey(): Buffer {
    const masterKey = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKey) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
    }
    
    // Derive key from master key using PBKDF2
    return crypto.pbkdf2Sync(masterKey, 'fitos-integration-encryption', 100000, this.keyLength, 'sha256');
  }

  /**
   * Encrypt sensitive fields in integration configuration
   */
  encryptSensitiveFields(config: Record<string, any>, fields: ConfigField[]): Record<string, any> {
    const encryptedConfig = { ...config };
    
    for (const field of fields) {
      if (field.type === 'password' && config[field.name]) {
        encryptedConfig[field.name] = this.encrypt(config[field.name]);
      }
    }
    
    return encryptedConfig;
  }

  /**
   * Decrypt sensitive fields in integration configuration
   */
  decryptSensitiveFields(config: Record<string, any>, fields: ConfigField[]): Record<string, any> {
    const decryptedConfig = { ...config };
    
    for (const field of fields) {
      if (field.type === 'password' && config[field.name]) {
        try {
          decryptedConfig[field.name] = this.decrypt(config[field.name]);
        } catch (error) {
          console.error(`Failed to decrypt field ${field.name}:`, error);
          // Keep encrypted value if decryption fails
        }
      }
    }
    
    return decryptedConfig;
  }

  /**
   * Encrypt a string value
   */
  encrypt(text: string): string {
    if (!text) return text;
    
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);
    
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(salt);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
    
    return combined.toString('base64');
  }

  /**
   * Decrypt a string value
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    
    try {
      const key = this.getEncryptionKey();
      const combined = Buffer.from(encryptedText, 'base64');
      
      // Extract components
      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(this.saltLength, this.saltLength + this.ivLength);
      const tag = combined.subarray(this.saltLength + this.ivLength, this.saltLength + this.ivLength + this.tagLength);
      const encrypted = combined.subarray(this.saltLength + this.ivLength + this.tagLength);
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(salt);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt an entire configuration object
   */
  encryptConfig(config: Record<string, any>): string {
    const jsonString = JSON.stringify(config);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypt an entire configuration object
   */
  decryptConfig(encryptedConfig: string): Record<string, any> {
    const jsonString = this.decrypt(encryptedConfig);
    return JSON.parse(jsonString);
  }

  /**
   * Mask API key for display purposes
   */
  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '***';
    }
    return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
  }

  /**
   * Check if a value is encrypted (starts with our encryption prefix)
   */
  isEncrypted(value: string): boolean {
    try {
      const combined = Buffer.from(value, 'base64');
      return combined.length >= this.saltLength + this.ivLength + this.tagLength;
    } catch {
      return false;
    }
  }

  /**
   * Mask sensitive values for display (show only first 4 and last 4 characters)
   */
  maskSensitiveValue(value: string, visibleChars: number = 4): string {
    if (!value || value.length <= visibleChars * 2) {
      return '*'.repeat(8);
    }
    
    const start = value.substring(0, visibleChars);
    const end = value.substring(value.length - visibleChars);
    const middle = '*'.repeat(Math.max(4, value.length - visibleChars * 2));
    
    return `${start}${middle}${end}`;
  }

  /**
   * Generate a secure random string for secrets
   */
  generateSecureSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a value for comparison (one-way)
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Verify a value against its hash
   */
  verifyHash(value: string, hash: string): boolean {
    return this.hash(value) === hash;
  }

  /**
   * Create a secure token for webhooks
   */
  createWebhookToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Sign a payload with HMAC
   */
  signPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verify a payload signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.signPayload(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}

export const encryptionService = new EncryptionService();

