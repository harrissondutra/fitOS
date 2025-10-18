import { PrismaClient } from '@prisma/client';

// Cache de clientes Prisma por tenant
const clients = new Map<string, PrismaClient>();

/**
 * Sanitiza o nome do schema para evitar SQL injection
 */
function sanitizeSchemaName(input: string): string {
  // Apenas letras, números e underscore
  return input.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Adiciona o parâmetro schema à URL do banco
 */
function withSchemaInUrl(baseUrl: string, schema: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('schema', schema);
  return url.toString();
}

/**
 * Obtém ou cria um PrismaClient para o tenant especificado
 */
export function getTenantPrisma(tenantId: string): PrismaClient {
  const schema = sanitizeSchemaName(tenantId || 'default');

  // Retorna cliente existente se disponível
  if (clients.has(schema)) {
    return clients.get(schema)!;
  }

  // Cria novo cliente para o tenant
  const baseUrl = process.env.DATABASE_URL!;
  const url = withSchemaInUrl(baseUrl, schema);

  const client = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });

  // Armazena no cache
  clients.set(schema, client);
  
  return client;
}

/**
 * Limpa o cache de clientes (útil para testes)
 */
export function clearTenantClients(): void {
  clients.forEach(client => client.$disconnect());
  clients.clear();
}

/**
 * Obtém o tenant ID da requisição
 */
export function getTenantIdFromRequest(req: any): string {
  return req.headers['x-tenant-id'] || 'default';
}
