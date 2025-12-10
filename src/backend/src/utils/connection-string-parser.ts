/**
 * Utility to parse database connection strings
 */

export interface ParsedConnectionString {
  protocol: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  database?: string;
  schema?: string;
  queryParams?: Record<string, string>;
}

/**
 * Parse a database connection string
 * Supports: postgresql://, mysql://, redis://
 */
export function parseConnectionString(connectionString: string): ParsedConnectionString {
  try {
    // Remove espaços em branco
    const cleaned = connectionString.trim();

    // Detectar protocolo
    const protocolMatch = cleaned.match(/^([^:]+):/);
    if (!protocolMatch) {
      throw new Error('Invalid connection string format');
    }

    const protocol = protocolMatch[1];

    // Extrair partes da URL
    const urlPattern = /^([^:]+):\/\/(?:([^:]+):([^@]+)@)?([^\/:]+)(?::(\d+))?(?:\/([^?]+))?(?:\?(.+))?$/;
    const match = cleaned.match(urlPattern);

    if (!match) {
      throw new Error('Invalid connection string format');
    }

    const [, , username, password, host, portStr, database, queryStr] = match;

    // Parse query parameters
    const queryParams: Record<string, string> = {};
    if (queryStr) {
      queryStr.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          queryParams[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    }

    // Portas padrão por protocolo
    const defaultPorts: Record<string, number> = {
      postgresql: 5432,
      postgres: 5432,
      mysql: 3306,
      redis: 6379
    };

    const port = portStr ? parseInt(portStr, 10) : (defaultPorts[protocol] || 5432);

    return {
      protocol,
      host,
      port,
      username: username ? decodeURIComponent(username) : undefined,
      password: password ? decodeURIComponent(password) : undefined,
      database: database ? decodeURIComponent(database) : undefined,
      schema: queryParams.schema,
      queryParams
    };
  } catch (error) {
    throw new Error(`Failed to parse connection string: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Map provision target to DatabaseProvider enum
 */
export function mapProvisionTargetToProvider(target: string): string | null {
  const mapping: Record<string, string> = {
    vps_ssh: 'vps_ssh',
    railway: 'railway',
    supabase: 'supabase',
    neon: 'neon',
    aiven: 'aiven',
    render: 'render',
    clever: 'clever_cloud',
    redis_cloud: 'redis_cloud',
    upstash: 'upstash',
    aws: 'aws_rds',
    gcp: 'gcp_cloud_sql',
    other: 'custom'
  };

  return mapping[target] || null;
}



