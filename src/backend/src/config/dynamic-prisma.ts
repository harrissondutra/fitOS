import { PrismaClient } from '@prisma/client';
import { config } from './config-simple'; // Assuming config has database URL

// Cache de clientes Prisma por schema
const prismaClients: Map<string, PrismaClient> = new Map();

export function getDynamicPrismaClient(tenantSchema: string): PrismaClient {
  if (!prismaClients.has(tenantSchema)) {
    const baseUrl = config.database.url || '';
    const hasQuery = baseUrl.includes('?');
    const urlWithSchema = `${baseUrl}${hasQuery ? '&' : '?'}schema=${tenantSchema}`;
    const client = new PrismaClient({
      datasources: {
        db: {
          url: urlWithSchema,
        },
      },
      // Adicione logs ou outras configurações conforme necessário
    });
    prismaClients.set(tenantSchema, client);
  }
  return prismaClients.get(tenantSchema)!;
}

// Função para desconectar todos os clientes Prisma (útil para shutdown)
export async function disconnectAllPrismaClients(): Promise<void> {
  for (const client of prismaClients.values()) {
    await client.$disconnect();
  }
  prismaClients.clear();
}