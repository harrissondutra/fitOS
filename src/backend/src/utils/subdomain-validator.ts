/**
 * Subdomain Validator
 * 
 * Validação de subdomains com cache Redis para otimização:
 * - Validação de formato
 * - Verificação de disponibilidade
 * - Lista de subdomains reservados
 * - Cache negativo para subdomains indisponíveis
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

interface ValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  reason?: string;
}

export class SubdomainValidator {
  private redis: Redis;
  private reservedSubdomains: Set<string>;

  constructor(private prisma: PrismaClient) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Lista de subdomains reservados
    this.reservedSubdomains = new Set([
      'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'store',
      'support', 'help', 'docs', 'status', 'dev', 'test', 'staging', 'prod',
      'cdn', 'static', 'assets', 'img', 'images', 'css', 'js', 'js',
      'login', 'signup', 'register', 'auth', 'oauth', 'sso', 'dashboard',
      'panel', 'control', 'manage', 'settings', 'config', 'system',
      'monitor', 'logs', 'analytics', 'stats', 'metrics', 'health',
      'ping', 'status', 'up', 'down', 'maintenance', 'backup',
      'secure', 'ssl', 'tls', 'cert', 'key', 'token', 'session',
      'cache', 'redis', 'db', 'database', 'sql', 'nosql',
      'queue', 'job', 'worker', 'cron', 'schedule', 'task',
      'webhook', 'callback', 'notify', 'alert', 'notification',
      'email', 'sms', 'push', 'message', 'chat', 'support',
      'ticket', 'issue', 'bug', 'feature', 'request', 'feedback',
      'contact', 'about', 'privacy', 'terms', 'legal', 'policy',
      'faq', 'guide', 'tutorial', 'manual', 'documentation',
      'download', 'upload', 'file', 'media', 'video', 'audio',
      'image', 'photo', 'gallery', 'album', 'portfolio', 'showcase',
      'demo', 'preview', 'beta', 'alpha', 'rc', 'release',
      'v1', 'v2', 'v3', 'version', 'latest', 'stable', 'unstable',
      'master', 'main', 'develop', 'feature', 'hotfix', 'bugfix',
      'fitos', 'sistudo', 'fitness', 'gym', 'academia', 'personal',
      'trainer', 'coach', 'nutrition', 'diet', 'health', 'wellness'
    ]);
  }

  /**
   * Validar subdomain completo (formato + disponibilidade)
   */
  async validateSubdomain(subdomain: string): Promise<boolean> {
    const result = await this.validateSubdomainDetailed(subdomain);
    return result.isValid && result.isAvailable;
  }

  /**
   * Validar subdomain com detalhes
   */
  async validateSubdomainDetailed(subdomain: string): Promise<ValidationResult> {
    // 1. Validar formato
    const formatValidation = this.validateFormat(subdomain);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    // 2. Verificar se é reservado
    if (this.isReserved(subdomain)) {
      return {
        isValid: false,
        isAvailable: false,
        reason: 'Subdomain reservado'
      };
    }

    // 3. Verificar disponibilidade (com cache)
    const availability = await this.checkAvailability(subdomain);
    return availability;
  }

  /**
   * Validar formato do subdomain
   */
  private validateFormat(subdomain: string): ValidationResult {
    // Verificar comprimento
    if (subdomain.length < 3) {
      return {
        isValid: false,
        isAvailable: false,
        reason: 'Subdomain deve ter pelo menos 3 caracteres'
      };
    }

    if (subdomain.length > 20) {
      return {
        isValid: false,
        isAvailable: false,
        reason: 'Subdomain deve ter no máximo 20 caracteres'
      };
    }

    // Verificar caracteres permitidos
    const validPattern = /^[a-z0-9-]+$/;
    if (!validPattern.test(subdomain)) {
      return {
        isValid: false,
        isAvailable: false,
        reason: 'Subdomain deve conter apenas letras minúsculas, números e hífens'
      };
    }

    // Verificar se não começa ou termina com hífen
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
      return {
        isValid: false,
        isAvailable: false,
        reason: 'Subdomain não pode começar ou terminar com hífen'
      };
    }

    // Verificar se não tem hífens consecutivos
    if (subdomain.includes('--')) {
      return {
        isValid: false,
        isAvailable: false,
        reason: 'Subdomain não pode ter hífens consecutivos'
      };
    }

    return {
      isValid: true,
      isAvailable: true
    };
  }

  /**
   * Verificar se subdomain é reservado
   */
  private isReserved(subdomain: string): boolean {
    return this.reservedSubdomains.has(subdomain.toLowerCase());
  }

  /**
   * Verificar disponibilidade com cache Redis
   */
  private async checkAvailability(subdomain: string): Promise<ValidationResult> {
    const cacheKey = `onboarding:subdomain:taken:${subdomain.toLowerCase()}`;
    
    try {
      // Tentar buscar do cache primeiro
      const cached = await this.redis.get(cacheKey);
      if (cached !== null) {
        const isTaken = cached === 'true';
        return {
          isValid: true,
          isAvailable: !isTaken,
          reason: isTaken ? 'Subdomain já está em uso' : undefined
        };
      }
    } catch (error) {
      console.warn('Erro ao buscar subdomain do cache Redis:', error);
    }

    // Se não estiver no cache, verificar no banco
    try {
      const existingTenant = await this.prisma.tenant.findFirst({
        where: {
          subdomain: subdomain.toLowerCase()
        }
      });

      const isTaken = !!existingTenant;

      // Cachear resultado por 5 minutos
      try {
        await this.redis.setex(cacheKey, 300, isTaken.toString());
      } catch (error) {
        console.warn('Erro ao cachear resultado do subdomain:', error);
      }

      return {
        isValid: true,
        isAvailable: !isTaken,
        reason: isTaken ? 'Subdomain já está em uso' : undefined
      };

    } catch (error) {
      console.error('Erro ao verificar disponibilidade do subdomain:', error);
      return {
        isValid: false,
        isAvailable: false,
        reason: 'Erro interno ao verificar disponibilidade'
      };
    }
  }

  /**
   * Invalidar cache de subdomain (usado quando novo tenant é criado)
   */
  async invalidateSubdomainCache(subdomain: string): Promise<void> {
    const cacheKey = `onboarding:subdomain:taken:${subdomain.toLowerCase()}`;
    
    try {
      await this.redis.del(cacheKey);
      console.log(`Cache invalidado para subdomain: ${subdomain}`);
    } catch (error) {
      console.warn('Erro ao invalidar cache do subdomain:', error);
    }
  }

  /**
   * Sugerir subdomains alternativos
   */
  async suggestAlternatives(subdomain: string, count = 5): Promise<string[]> {
    const suggestions: string[] = [];
    const baseSubdomain = subdomain.toLowerCase();
    
    // Tentar variações com números
    for (let i = 1; i <= count; i++) {
      const suggestion = `${baseSubdomain}${i}`;
      if (await this.validateSubdomain(suggestion)) {
        suggestions.push(suggestion);
        if (suggestions.length >= count) break;
      }
    }

    // Se não conseguiu com números, tentar com palavras
    if (suggestions.length < count) {
      const suffixes = ['gym', 'fitness', 'academia', 'club', 'center'];
      for (const suffix of suffixes) {
        const suggestion = `${baseSubdomain}-${suffix}`;
        if (await this.validateSubdomain(suggestion)) {
          suggestions.push(suggestion);
          if (suggestions.length >= count) break;
        }
      }
    }

    return suggestions;
  }

  /**
   * Validar múltiplos subdomains em lote
   */
  async validateMultiple(subdomains: string[]): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};
    
    // Processar em paralelo para melhor performance
    const promises = subdomains.map(async (subdomain) => {
      const result = await this.validateSubdomainDetailed(subdomain);
      return { subdomain, result };
    });

    const resolved = await Promise.all(promises);
    
    resolved.forEach(({ subdomain, result }) => {
      results[subdomain] = result;
    });

    return results;
  }

  /**
   * Obter estatísticas de subdomains
   */
  async getSubdomainStats(): Promise<{
    total: number;
    available: number;
    taken: number;
    reserved: number;
  }> {
    try {
      const total = await this.prisma.tenant.count({
        where: {
          subdomain: {
            not: null
          }
        }
      });

      return {
        total,
        available: 0, // Seria necessário calcular
        taken: total,
        reserved: this.reservedSubdomains.size
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de subdomains:', error);
      return {
        total: 0,
        available: 0,
        taken: 0,
        reserved: this.reservedSubdomains.size
      };
    }
  }

  /**
   * Limpar cache de subdomains expirados
   */
  async cleanupExpiredCache(): Promise<void> {
    try {
      const pattern = 'onboarding:subdomain:taken:*';
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        // Verificar quais keys ainda são válidas
        const validKeys: string[] = [];
        
        for (const key of keys) {
          const subdomain = key.replace('onboarding:subdomain:taken:', '');
          const exists = await this.prisma.tenant.findFirst({
            where: { subdomain }
          });
          
          if (!exists) {
            validKeys.push(key);
          }
        }
        
        // Remover keys inválidas
        if (validKeys.length > 0) {
          await this.redis.del(...validKeys);
          console.log(`Removidos ${validKeys.length} caches expirados de subdomains`);
        }
      }
    } catch (error) {
      console.warn('Erro ao limpar cache de subdomains:', error);
    }
  }
}

