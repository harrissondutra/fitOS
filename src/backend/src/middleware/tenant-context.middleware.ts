import { Request, Response, NextFunction } from 'express';
import { PrismaClient, DbStrategy } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { ConnectionManagerService, connectionManager } from '../services/connection-manager.service';
import { logger } from '../utils/logger';

// Usar o tipo Request global já estendido em superAdmin.ts
// Não criar nova declaração global aqui para evitar conflitos

/**
 * Middleware de Tenant Context
 * Extrai e injeta contexto de tenant para todas as requests
 * Adiciona ao request: organizationId, connection (PrismaClient), dbStrategy
 */
export class TenantContextMiddleware {
  private connectionManager: ConnectionManagerService;
  private prisma: PrismaClient;

  constructor(connectionManager: ConnectionManagerService) {
    this.connectionManager = connectionManager;
    this.prisma = getPrismaClient();
  }

  /**
   * Retry helper para operações Prisma com tratamento de P1001/P1017/P2024
   */
  private async withPrismaRetry<T>(op: () => Promise<T>, retries: number = 3): Promise<T> {
    let lastErr: any;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await op();
      } catch (err: any) {
        const code = err?.code || err?.meta?.code;

        // P1017: Server closed connection - reconectar e tentar novamente
        if (code === 'P1017') {
          logger.warn(`Database connection closed (P1017), attempt ${attempt}/${retries}. Reconnecting...`);
          // Pequeno delay antes de tentar novamente - Prisma reconecta automaticamente
          await new Promise(r => setTimeout(r, 300 * attempt));
          lastErr = err;
          if (attempt < retries) {
            continue; // Tentar novamente - Prisma reconecta automaticamente na próxima query
          }
        }

        if (code === 'P2024') {
          // Pool timeout – backoff curto e tentar de novo
          await new Promise(r => setTimeout(r, attempt * 100));
          lastErr = err;
          if (attempt < retries) continue;
        }

        if (code === 'P1001') {
          // Host inacessível – não adianta insistir muito; repropagar
          throw err;
        }

        // Outros erros - lançar imediatamente
        throw err;
      }
    }
    throw lastErr || new Error('Prisma operation failed after retries');
  }

  /**
   * Middleware principal
   */
  async middleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Skip para rotas públicas
      if (this.isPublicRoute(req.path)) {
        next();
        return;
      }

      // Extrair organizationId do request
      const organizationId = await this.extractOrganizationId(req);

      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: 'Organization ID required',
        });
        return;
      }

      // Validar organização
      const tenant = await this.validateOrganization(organizationId);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: 'Organization not found',
        });
        return;
      }

      // Obter conexão apropriada
      let connection = await this.connectionManager.getConnection(organizationId);

      // Injetar tenant context baseado na estratégia (pode retornar nova conexão se a original estava fechada)
      connection = await this.injectTenantContext(connection, organizationId, tenant.dbStrategy);

      // Adicionar ao request (usar type assertion)
      (req as any).organizationId = organizationId;
      (req as any).connection = connection;
      (req as any).dbStrategy = tenant.dbStrategy;

      // Adicionar header de resposta
      res.set('X-Organization-ID', organizationId);

      // Auditoria de acesso (se necessário)
      await this.auditAccess(req, organizationId, tenant.dbStrategy);

      next();
    } catch (error: any) {
      // Tratamento específico para P1001 (host inacessível) e P1017 (conexão fechada)
      if (error?.code === 'P1001' || error?.code === 'P1017') {
        const errorType = error?.code === 'P1017' ? 'connection closed' : 'host unreachable';
        logger.error(`Database ${errorType} during tenant context:`, error);
        res.status(503).json({
          success: false,
          error: 'Database unavailable',
          message: 'Não foi possível conectar ao servidor de banco de dados do tenant. Tente novamente em instantes.'
        });
        return;
      }
      logger.error('TenantContextMiddleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Extrai organizationId do request (JWT, header, subdomain)
   */
  private async extractOrganizationId(req: Request): Promise<string | null> {
    // 1. Header X-Organization-Id ou X-Tenant-Id
    const headerOrgId = req.headers['x-organization-id'] || req.headers['x-tenant-id'];
    if (headerOrgId && typeof headerOrgId === 'string') {
      return headerOrgId;
    }

    // 2. JWT Token (se disponível)
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      const orgId = await this.extractFromJWT(token);
      if (orgId) {
        return orgId;
      }
    }

    // 3. Subdomain
    const hostname = req.get('host') || '';
    const subdomain = this.extractSubdomain(hostname);
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      // Buscar tenant por subdomain
      const tenant = await this.prisma.tenant.findUnique({
        where: { subdomain },
        select: { id: true },
      });
      if (tenant) {
        return tenant.id;
      }
    }

    // 4. User ID do JWT (se disponível) - buscar tenant do usuário
    const userId = await this.extractUserIdFromJWT(req);
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true },
      });
      if (user?.tenantId) {
        return user.tenantId;
      }
    }

    return null;
  }

  /**
   * Extrai organizationId do JWT
   */
  private async extractFromJWT(token: string): Promise<string | null> {
    try {
      // Verificar formato básico
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decodificar payload (sem validação completa aqui - apenas extração)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));

      // Tentar 'org' ou 'tenantId' no payload
      return payload.org || payload.tenantId || payload.organizationId || null;
    } catch (error) {
      logger.debug('Failed to extract from JWT:', error);
      return null;
    }
  }

  /**
   * Extrai userId do JWT
   */
  private async extractUserIdFromJWT(req: Request): Promise<string | null> {
    try {
      if (!req.headers.authorization) {
        return null;
      }

      const token = req.headers.authorization.replace('Bearer ', '');
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      return payload.sub || payload.userId || payload.id || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extrai subdomain do hostname
   */
  private extractSubdomain(hostname: string): string | null {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }
    // Se for localhost:port, retornar null
    if (hostname.startsWith('localhost')) {
      return null;
    }
    return parts[0] || null;
  }

  /**
   * Valida organização e retorna dados
   */
  private async validateOrganization(organizationId: string): Promise<{ dbStrategy: DbStrategy; status: string } | null> {
    try {
      const tenant = await this.withPrismaRetry(() =>
        this.prisma.tenant.findUnique({
          where: { id: organizationId },
          select: { dbStrategy: true, status: true },
        })
      );

      if (!tenant || tenant.status !== 'active') {
        return null;
      }

      return tenant;
    } catch (error: any) {
      // Repropagar P1001 e P1017 para que o handler superior responda adequadamente
      if (error?.code === 'P1001' || error?.code === 'P1017') {
        throw error;
      }
      logger.error('Error validating organization:', error);
      return null;
    }
  }

  /**
   * Verifica saúde da conexão
   */
  private async checkConnectionHealth(connection: PrismaClient): Promise<boolean> {
    try {
      await connection.$queryRaw`SELECT 1`;
      return true;
    } catch (error: any) {
      // Verificar se é erro de conexão fechada
      if (error?.code === 'P1017' || error?.message?.includes('closed')) {
        logger.warn('Connection health check failed: connection closed');
        return false;
      }
      // Outros erros podem ser temporários, considerar conexão como OK
      return true;
    }
  }

  /**
   * Injeta tenant context baseado na estratégia com retry e verificação de saúde
   */
  private async injectTenantContext(
    connection: PrismaClient,
    organizationId: string,
    strategy: DbStrategy
  ): Promise<PrismaClient> {
    const maxRetries = 3;
    let currentConnection = connection;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Verificar saúde da conexão antes de usar
        const isHealthy = await this.checkConnectionHealth(currentConnection);

        if (!isHealthy) {
          logger.warn(`Connection unhealthy for ${organizationId}, attempt ${attempt}/${maxRetries}`);

          // Limpar cache de conexão para forçar recriação
          if (this.connectionManager && typeof this.connectionManager.clearCache === 'function') {
            this.connectionManager.clearCache(organizationId);
          }

          // Se não é a última tentativa, obter nova conexão
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Backoff exponencial
            currentConnection = await this.connectionManager.getConnection(organizationId);
            continue;
          } else {
            throw new Error('Connection closed and failed to reconnect after retries');
          }
        }

        // Executar query baseado na estratégia
        switch (strategy) {
          case 'row_level':
            // Usar variável de sessão PostgreSQL
            await currentConnection.$executeRawUnsafe(
              `SET app.current_tenant = '${organizationId.replace(/'/g, "''")}'`
            );
            break;

          case 'schema_level':
            // search_path já foi setado no ConnectionFactory
            // Apenas garantir que está correto
            const schemaName = `tenant_${organizationId.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`;
            await currentConnection.$executeRawUnsafe(`SET search_path TO ${schemaName}, public`);
            break;

          case 'database_level':
            // Conexão dedicada - não precisa injetar contexto
            break;

          default:
            logger.warn(`Unknown strategy: ${strategy}`);
        }

        // Sucesso - retornar conexão (pode ser nova)
        return currentConnection;
      } catch (error: any) {
        lastError = error;

        // Verificar se é erro de conexão fechada
        if (error?.code === 'P1017' || error?.message?.includes('closed')) {
          logger.warn(`Connection closed during tenant context injection (attempt ${attempt}/${maxRetries})`);

          // Limpar cache de conexão
          if (this.connectionManager && typeof this.connectionManager.clearCache === 'function') {
            this.connectionManager.clearCache(organizationId);
          }

          // Se não é a última tentativa, aguardar e tentar novamente
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Backoff exponencial

            // Obter nova conexão
            try {
              currentConnection = await this.connectionManager.getConnection(organizationId);
            } catch (reconnectError) {
              logger.error('Failed to get new connection during retry:', reconnectError);
              // Continuar para próxima tentativa ou falhar
            }
            continue;
          }
        }

        // Outros erros: apenas logar e tentar novamente se não for última tentativa
        if (attempt < maxRetries) {
          logger.warn(`Error injecting tenant context (attempt ${attempt}/${maxRetries}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue;
        }
      }
    }

    // Todas as tentativas falharam
    logger.error('Error injecting tenant context after all retries:', lastError);
    throw lastError || new Error('Failed to inject tenant context');
  }

  /**
   * Verifica se rota é pública ou administrativa
   */
  private isPublicRoute(path: string): boolean {
    const publicRoutes = [
      '/api/health',
      '/api/auth/login',
      '/api/auth/signup',
      '/api/auth/verify-email',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/refresh',
      '/api/docs',
      '/api/admin',  // Rotas administrativas não precisam de tenant context via middleware
      '/api/super-admin',  // Rotas de super-admin não precisam de tenant context (usam próprio sistema de autenticação)
      '/api/sidebar',  // Configuração de sidebar não precisa de tenant context
      '/api/settings',  // Configurações do sistema não precisam de tenant context
      '/api/subscription', // Fluxo de assinatura deve ser independente de tenant
      '/api/contact', // Rota de contato de vendas e suporte pública
      '/api/webhooks', // Webhooks não têm contexto de tenant
      '/api/plan-limits', // Visualização de planos deve ser pública
      '/api/exercises', // Permite acesso público a exercícios (tratado no handler)
    ];

    return publicRoutes.some(route => path.startsWith(route));
  }

  /**
   * Auditoria de acesso (detecta queries sem tenant context)
   */
  private async auditAccess(
    req: Request,
    organizationId: string,
    strategy: DbStrategy
  ): Promise<void> {
    // Em desenvolvimento, pode ser verbose
    // Em produção, apenas logar tentativas suspeitas
    if (process.env.NODE_ENV === 'development' && process.env.AUDIT_ALL_REQUESTS === 'true') {
      try {
        await this.prisma.tenantAccessAudit.create({
          data: {
            organizationId,
            userId: (req as any).userId || req.user?.id || null,
            action: req.method,
            resource: req.path,
            hasTenantContext: true,
            ipAddress: req.ip || null,
            userAgent: req.headers['user-agent'] || null,
          },
        });
      } catch (error) {
        // Não bloquear request se auditoria falhar
        logger.error('Audit access error:', error);
      }
    }
  }
}

/**
 * Factory para criar instância do middleware
 */
export function createTenantContextMiddleware(connectionManager: ConnectionManagerService) {
  const middleware = new TenantContextMiddleware(connectionManager);
  return middleware.middleware.bind(middleware);
}

/**
 * Exportar instância padrão (opcional)
 */
export const tenantContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const middleware = new TenantContextMiddleware(connectionManager);
  return middleware.middleware(req, res, next);
};
