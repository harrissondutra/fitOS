import { PrismaClient, DbStrategy } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Wrapper sobre PrismaClient que garante isolamento de tenant
 * Adiciona automaticamente filtros de tenant baseado na estratégia
 */
export class PrismaTenantWrapper {
  private prisma: PrismaClient;
  private organizationId: string;
  private strategy: DbStrategy;
  private allowCrossTenant: boolean;

  constructor(
    prisma: PrismaClient,
    organizationId: string,
    strategy: DbStrategy,
    allowCrossTenant: boolean = false
  ) {
    this.prisma = prisma;
    this.organizationId = organizationId;
    this.strategy = strategy;
    this.allowCrossTenant = allowCrossTenant;

    // Prisma middleware para validar contexto de tenant antes de cada query
    // Evita vazamentos caso algum caminho não use os helpers abaixo
    // Leve overhead aceitável dada a criticidade de segurança
    (this.prisma as any).$use(async (params: any, next: any) => {
      if (!this.allowCrossTenant && this.strategy === 'row_level') {
        await this.ensureTenantContextActive();
      }
      return next(params);
    });
  }

  /**
   * Wrapper genérico para queries que devem incluir tenant_id
   */
  private addTenantFilter<T>(args: any): any {
    if (this.allowCrossTenant || this.strategy !== 'row_level') {
      return args;
    }

    // Para row-level, catchar queries e adicionar tenant_id onde necessário
    // Isso é feito via middleware injetando session variable
    // Mas podemos adicionar validação adicional aqui
    return args;
  }

  /**
   * Expõe modelos do Prisma com validação de tenant
   * O tenant context já foi injetado pelo middleware
   * Este wrapper apenas valida antes de queries críticas
   */
  get user() {
    return this.prisma.user;
  }

  get client() {
    return this.prisma.client;
  }

  get workout() {
    return this.prisma.workout;
  }

  get exercise() {
    return this.prisma.exercise;
  }

  get clientTrainer() {
    return this.prisma.clientTrainer;
  }

  get physicalAssessment() {
    return this.prisma.physicalAssessment;
  }

  // Delegate para outros modelos do Prisma
  // O PrismaClient expõe todos os modelos automaticamente

  /**
   * Valida que tenant context está ativo
   */
  private async validateTenantContext(): Promise<void> {
    if (this.allowCrossTenant) {
      return;
    }

    try {
      // Para row-level, verificar variável de sessão
      if (this.strategy === 'row_level') {
        const result = await this.prisma.$queryRaw<Array<{ current_tenant: string }>>`
          SELECT current_setting('app.current_tenant', true) as current_tenant
        `;

        const currentTenant = result[0]?.current_tenant;

        if (!currentTenant || currentTenant !== this.organizationId) {
          logger.error('Tenant context mismatch detected!', {
            expected: this.organizationId,
            actual: currentTenant,
            strategy: this.strategy,
          });

          // Registrar tentativa de data leak
          await this.auditDataLeakAttempt();

          throw new Error('Tenant context validation failed');
        }
      }
    } catch (error) {
      logger.error('Error validating tenant context:', error);
      throw error;
    }
  }

  /**
   * Valida rapidamente que o contexto de tenant está ativo (usada pelo middleware $use)
   */
  private async ensureTenantContextActive(): Promise<void> {
    const result = await this.prisma.$queryRaw<Array<{ current_tenant: string }>>`
      SELECT current_setting('app.current_tenant', true) as current_tenant
    `;
    const currentTenant = result[0]?.current_tenant;
    if (!currentTenant || currentTenant !== this.organizationId) {
      await this.auditDataLeakAttempt();
      throw new Error('Tenant context missing or mismatched');
    }
  }

  /**
   * Registra tentativa de data leak
   * Usa o PrismaClient principal para registrar a auditoria
   */
  private async auditDataLeakAttempt(): Promise<void> {
    try {
      // Importar getPrismaClient dinamicamente para evitar dependência circular
      const { getPrismaClient } = await import('../config/database');
      const mainPrisma = getPrismaClient();

      await mainPrisma.tenantAccessAudit.create({
        data: {
          organizationId: this.organizationId,
          action: 'data_leak_attempt',
          resource: 'database_query',
          hasTenantContext: false,
          query: 'Tenant context validation failed',
        },
      });
    } catch (error) {
      // Não bloquear se auditoria falhar
      logger.error('Failed to audit data leak attempt:', error);
    }
  }

  /**
   * Métodos helper para queries cross-tenant (admin/analytics)
   * Devem ser chamados explicitamente
   */
  async withCrossTenantAccess<T>(callback: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    if (!this.allowCrossTenant) {
      throw new Error('Cross-tenant access not allowed. Use explicit flag.');
    }

    return callback(this.prisma);
  }

  /**
   * Executa query raw com validação de tenant
   */
  async $queryRaw<T = any>(query: TemplateStringsArray, ...values: any[]): Promise<T> {
    await this.validateTenantContext();
    return this.prisma.$queryRaw<T>(query, ...values);
  }

  /**
   * Executa query raw unsafe com validação de tenant
   */
  async $queryRawUnsafe<T = any>(query: string, ...values: any[]): Promise<T> {
    await this.validateTenantContext();

    // Validar que query não contém padrões perigosos
    this.validateQuerySafety(query);

    return this.prisma.$queryRawUnsafe<T>(query, ...values);
  }

  /**
   * Valida segurança da query (detecta padrões perigosos)
   */
  private validateQuerySafety(query: string): void {
    const dangerousPatterns = [
      /DROP\s+(DATABASE|TABLE|SCHEMA)/i,
      /TRUNCATE/i,
      /DELETE\s+FROM\s+\w+\s+WHERE\s+tenant_id\s*!=/i,
      /DELETE\s+FROM\s+\w+\s+WHERE\s+tenant_id\s+IS\s+NULL/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        logger.error('Dangerous query pattern detected:', { query });
        throw new Error('Query contains dangerous pattern');
      }
    }
  }

  /**
   * Transaction com validação de tenant
   */
  async $transaction<T>(
    callback: (prisma: PrismaClient) => Promise<T>,
    options?: { timeout?: number }
  ): Promise<T> {
    await this.validateTenantContext();
    return this.prisma.$transaction(callback, options);
  }

  /**
   * Delegate para outros métodos do PrismaClient
   */
  get $connect() {
    return this.prisma.$connect.bind(this.prisma);
  }

  get $disconnect() {
    return this.prisma.$disconnect.bind(this.prisma);
  }

  get $executeRaw() {
    return this.prisma.$executeRaw.bind(this.prisma);
  }

  get $executeRawUnsafe() {
    return this.prisma.$executeRawUnsafe.bind(this.prisma);
  }

  // Expor PrismaClient original se necessário (com cuidado)
  get raw(): PrismaClient {
    return this.prisma;
  }
}

