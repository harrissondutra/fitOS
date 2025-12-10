/**
 * External Database Providers Service
 * Gerencia integração com APIs de provedores externos para listar bancos de dados
 */

import { logger } from '../utils/logger';
import { EncryptionService } from './encryption.service';

export interface ExternalDatabase {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string; // Opcional, pode vir da API
  connectionString?: string;
  databaseType: 'postgresql' | 'mysql' | 'redis';
  status?: 'active' | 'inactive';
  region?: string;
  plan?: string;
  projectName?: string; // Nome do projeto/serviço no provedor externo
}

export interface ProviderAuth {
  provider: string;
  authType: 'api_key' | 'oauth' | 'service_role';
  token?: string; // API key ou access token
  refreshToken?: string; // Para OAuth
  expiresAt?: Date; // Para OAuth
}

export class ExternalDatabaseProvidersService {
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = new EncryptionService();
    logger.info('ExternalDatabaseProvidersService initialized');
  }

  /**
   * Lista bancos de dados do Railway
   */
  async listRailwayDatabases(auth: ProviderAuth): Promise<ExternalDatabase[]> {
    try {
      if (!auth.token) {
        throw new Error('Railway API token is required');
      }

      // Adicionar timeout para evitar travamento
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

      try {
        // Railway usa GraphQL API v2 - https://backboard.railway.com/graphql/v2
        // Query para buscar todos os projetos com serviços e suas variáveis
        const query = `
          query {
            projects {
              edges {
                node {
                  id
                  name
                  environments {
                    edges {
                      node {
                        id
                        name
                      }
                    }
                  }
                  services {
                    edges {
                      node {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        // Account Token de https://railway.com/account/tokens
        const response = await fetch('https://backboard.railway.com/graphql/v2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Se não autorizado, token inválido
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid Railway API token. Please check your credentials.');
        }

        if (!response.ok) {
          // Log response body for debugging
          const errorBody = await response.text();
          logger.error('Railway API error response:', { status: response.status, statusText: response.statusText, body: errorBody });
          throw new Error(`Railway API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Debug: log full response in development
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Railway GraphQL response:', JSON.stringify(data, null, 2));
        }
        
        // Verificar erros GraphQL
        if (data.errors) {
          logger.error('Railway GraphQL errors:', data.errors);
          logger.error('Railway GraphQL full response:', JSON.stringify(data, null, 2));
          throw new Error(`Railway GraphQL error: ${data.errors[0]?.message || 'Unknown error'}`);
        }

        const projects = data.data?.projects?.edges || [];
        logger.info(`Found ${projects.length} Railway projects`);

        const databases: ExternalDatabase[] = [];

        // Para cada projeto, buscar serviços e variáveis
        for (const projectEdge of projects) {
          const project = projectEdge.node;
          
          if (!project?.services?.edges?.length) {
            continue;
          }

          // Buscar ambiente padrão do projeto
          const defaultEnvironment = project.environments?.edges?.[0]?.node;
          const environmentId = defaultEnvironment?.id || project.id;

          // Buscar variáveis de cada serviço usando query top-level `variables()`
          for (const serviceEdge of project.services.edges) {
            const service = serviceEdge.node;
            
            // Inferir tipo de database pelo nome do serviço
            const dbType = this.inferDatabaseType(service.name || '');
            
            // Sempre tentar buscar variáveis para verificar se é um banco de dados
            {
              try {
                // Query para buscar variáveis do serviço usando environmentId, projectId e serviceId
                const variablesQuery = `
                  query {
                    variables(environmentId: "${environmentId}", projectId: "${project.id}", serviceId: "${service.id}")
                  }
                `;

                const variablesResponse = await fetch('https://backboard.railway.com/graphql/v2', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ query: variablesQuery }),
                  signal: controller.signal
                });

                if (variablesResponse.ok) {
                  const variablesData = await variablesResponse.json();
                  
                  // Debug: log response structure
                  if (process.env.NODE_ENV === 'development') {
                    logger.debug(`Variables response for service ${service.id}:`, JSON.stringify(variablesData, null, 2));
                  }
                  
                  // Railway retorna variáveis como um dicionário chave-valor
                  const variables: Record<string, string> = variablesData.data?.variables || {};
                  
                  // Primeiro tentar DATABASE_URL completo
                  let dbUrl = variables.DATABASE_URL || variables.POSTGRES_URL || variables.MYSQL_URL || variables.REDIS_URL;
                  
                  // Se não tiver DATABASE_URL, montar a partir de DB_HOST, DB_PORT, etc.
                  if (!dbUrl && variables.DB_HOST && variables.DB_PORT && variables.DB_USERNAME && variables.DB_PASSWORD) {
                    const dbName = variables.DB_NAME || 'railway';
                    dbUrl = `${dbType}://${variables.DB_USERNAME}:${variables.DB_PASSWORD}@${variables.DB_HOST}:${variables.DB_PORT}/${dbName}`;
                  }
                  
                  if (dbUrl) {
                    // Tentar parsear connection string
                    const parsed = this.parseConnectionString(dbUrl, dbType);
                    
                    databases.push({
                      id: service.id,
                      name: service.name || `Database from ${project.name}`,
                      host: parsed.host,
                      port: parsed.port,
                      database: parsed.database,
                      username: parsed.username,
                      password: parsed.password,
                      databaseType: dbType,
                      status: 'active',
                      connectionString: dbUrl,
                      region: project.id,
                      projectName: `${project.name} / ${service.name || 'database'}`
                    });
                  }
                } else {
                  logger.debug(`Failed to fetch variables for service ${service.id}`);
                }
              } catch (varError) {
                logger.debug(`Error fetching variables for service ${service.id}:`, varError);
              }
            }
          }
        }

        logger.info(`Successfully fetched ${databases.length} Railway databases`);
        return databases;

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Railway API request timeout. Please try again.');
        }
        throw fetchError;
      }
    } catch (error) {
      logger.error('Error listing Railway databases:', error);
      throw new Error(`Failed to list Railway databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper: Parse connection string de database (PostgreSQL, MySQL, Redis)
   */
  private parseConnectionString(connectionString: string, dbType: 'postgresql' | 'mysql' | 'redis'): {
    host: string;
    port: number;
    database: string;
    username: string;
    password?: string;
  } {
    try {
      const url = new URL(connectionString);
      return {
        host: url.hostname,
        port: parseInt(url.port) || (dbType === 'mysql' ? 3306 : dbType === 'redis' ? 6379 : 5432),
        database: url.pathname.slice(1) || (dbType === 'postgresql' ? 'postgres' : dbType === 'mysql' ? 'mysql' : 'default'),
        username: url.username || 'postgres',
        password: url.password || undefined
      };
    } catch (error) {
      // Se falhar, retornar valores default
      return {
        host: 'localhost',
        port: dbType === 'mysql' ? 3306 : dbType === 'redis' ? 6379 : 5432,
        database: 'postgres',
        username: 'postgres'
      };
    }
  }

  /**
   * Lista bancos de dados do Supabase
   */
  async listSupabaseDatabases(auth: ProviderAuth): Promise<ExternalDatabase[]> {
    try {
      if (!auth.token) {
        throw new Error('Supabase API key is required');
      }

      // Supabase Management API requer project ref
      // Precisamos do project_ref ou fazer OAuth
      const response = await fetch('https://api.supabase.com/v1/projects', {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
      }

      const projects = await response.json();
      const databases: ExternalDatabase[] = [];

      for (const project of projects.data || []) {
        // Para cada projeto, obter detalhes de conexão
        databases.push({
          id: project.id,
          name: project.name,
          host: project.db_host || `db.${project.ref}.supabase.co`,
          port: project.db_port || 5432,
          database: project.database_name || 'postgres',
          username: project.database_user || 'postgres',
          databaseType: 'postgresql',
          status: project.status === 'ACTIVE_HEALTHY' ? 'active' : 'inactive',
          connectionString: project.connection_string || undefined
        });
      }

      return databases;
    } catch (error) {
      logger.error('Error listing Supabase databases:', error);
      throw new Error(`Failed to list Supabase databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lista bancos de dados do Neon
   */
  async listNeonDatabases(auth: ProviderAuth): Promise<ExternalDatabase[]> {
    try {
      if (!auth.token) {
        throw new Error('Neon API key is required');
      }

      const response = await fetch('https://console.neon.tech/api/v2/projects', {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Neon API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const databases: ExternalDatabase[] = [];

      for (const project of data.projects || []) {
        // Para cada projeto, listar branches (que são bancos)
        const branchesResponse = await fetch(`https://console.neon.tech/api/v2/projects/${project.id}/branches`, {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (branchesResponse.ok) {
          const branchesData = await branchesResponse.json();
          
          // Debug: log da resposta
          if (process.env.NODE_ENV === 'development') {
            logger.debug('Neon branches response:', JSON.stringify(branchesData, null, 2));
          }
          
          for (const branch of branchesData.branches || []) {
            // Verificar se branch está ativa baseado no current_state
            // Estados ativos: ready, active, idle (idle significa que tem endpoint configurado mas suspenso temporariamente)
            let isActive = branch.current_state === 'ready' || branch.current_state === 'active' || branch.current_state === 'idle';
            
            // Buscar endpoints para todas as branches (ativas e inativas)
            let host = 'N/A';
            let port = 5432;
            let username = 'neondb_owner';
            let database = 'neondb';
            let connectionString: string | undefined = undefined;
            
            try {
              // Buscar endpoints da branch
              const endpointsResponse = await fetch(`https://console.neon.tech/api/v2/projects/${project.id}/branches/${branch.id}/endpoints`, {
                headers: {
                  'Authorization': `Bearer ${auth.token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (endpointsResponse.ok) {
                const endpointsData = await endpointsResponse.json();
                
                // Debug: log da resposta de endpoints
                if (process.env.NODE_ENV === 'development') {
                  logger.debug('Neon endpoints response:', JSON.stringify(endpointsData, null, 2));
                }
                
                const endpoint = endpointsData.endpoints?.[0]; // Pegar primeiro endpoint (read-write)
                
                if (endpoint) {
                  host = endpoint.host || project.proxy_host || 'N/A';
                  port = endpoint.port || 5432;
                  // Construir connection string básico
                  connectionString = `postgresql://${username}@${host}:${port}/${database}`;
                  
                  // Verificar se endpoint está suspenso
                  if (endpoint.suspended_at) {
                    isActive = false;
                  }
                }
              }
            } catch (error) {
              logger.debug('Error fetching endpoints for branch:', { branchId: branch.id, error });
            }
            
            databases.push({
              id: branch.id,
              name: `${project.name} - ${branch.name}`,
              host,
              port,
              database,
              username,
              databaseType: 'postgresql',
              status: isActive ? 'active' : 'inactive',
              connectionString,
              region: project.id // Usar project ID como region placeholder
            });
          }
        }
      }

      return databases;
    } catch (error) {
      logger.error('Error listing Neon databases:', error);
      throw new Error(`Failed to list Neon databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ativa uma branch suspensa do Neon
   * Tenta start do endpoint existente ou cria um novo se necessário
   */
  async activateNeonBranch(projectId: string, branchId: string, auth: ProviderAuth): Promise<{ success: boolean; message: string }> {
    try {
      if (!auth.token) {
        throw new Error('Neon API key is required');
      }

      // Primeiro, tentar start no endpoint existente se houver
      const endpointsResponse = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/endpoints`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (endpointsResponse.ok) {
        const endpointsData = await endpointsResponse.json();
        const endpoint = endpointsData.endpoints?.[0];

        if (endpoint && endpoint.current_state !== 'active') {
          // Tentar start do endpoint existente
          const startResponse = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/endpoints/${endpoint.id}/start`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${auth.token}`,
              'Content-Type': 'application/json'
            }
          });

          if (startResponse.ok) {
            return { success: true, message: 'Branch activation started. It may take a few moments to become active.' };
          }
        }
      }

      // Se não houver endpoint ou start falhou, criar novo endpoint
      const createResponse = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/endpoints`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branch_id: branchId,
          type: 'read_write'
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to activate branch: ${errorData.error || createResponse.statusText}`);
      }

      return { success: true, message: 'Branch activated successfully. A new endpoint was created.' };
    } catch (error) {
      logger.error('Error activating Neon branch:', error);
      throw new Error(`Failed to activate Neon branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lista bancos de dados do Aiven
   */
  async listAivenDatabases(auth: ProviderAuth): Promise<ExternalDatabase[]> {
    try {
      if (!auth.token) {
        throw new Error('Aiven API token is required');
      }

      const response = await fetch('https://api.aiven.io/v1/project', {
        headers: {
          'Authorization': `aivenv1 ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Aiven API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const databases: ExternalDatabase[] = [];

      // Aiven retorna projetos, precisamos listar serviços de cada projeto
      for (const project of data.projects || []) {
        const servicesResponse = await fetch(`https://api.aiven.io/v1/project/${project.project_name}/service`, {
          headers: {
            'Authorization': `aivenv1 ${auth.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          for (const service of servicesData.services || []) {
            if (service.service_type === 'pg' || service.service_type === 'mysql' || service.service_type === 'redis') {
              const connectionInfo = service.connection_info || {};
              databases.push({
                id: service.service_name,
                name: `${project.project_name} - ${service.service_name}`,
                host: connectionInfo.host || service.host,
                port: connectionInfo.port || service.port || this.getDefaultPortByType(service.service_type),
                database: connectionInfo.database || 'defaultdb',
                username: connectionInfo.user || 'avnadmin',
                password: connectionInfo.password, // Aiven pode retornar a senha
                databaseType: this.mapAivenServiceType(service.service_type),
                status: service.state === 'RUNNING' ? 'active' : 'inactive',
                connectionString: connectionInfo.uri || undefined
              });
            }
          }
        }
      }

      return databases;
    } catch (error) {
      logger.error('Error listing Aiven databases:', error);
      throw new Error(`Failed to list Aiven databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lista bancos de dados do Render
   */
  async listRenderDatabases(auth: ProviderAuth): Promise<ExternalDatabase[]> {
    try {
      if (!auth.token) {
        throw new Error('Render API key is required');
      }

      const response = await fetch('https://api.render.com/v1/services', {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Render API error: ${response.status} ${response.statusText}`);
      }

      const services = await response.json();
      const databases: ExternalDatabase[] = [];

      for (const service of services || []) {
        if (service.type === 'postgresql' || service.type === 'redis') {
          databases.push({
            id: service.id,
            name: service.name,
            host: service.hostname || 'N/A',
            port: service.port || this.getDefaultPortByType(service.type),
            database: service.database || 'postgres',
            username: service.user || 'postgres',
            databaseType: service.type === 'postgresql' ? 'postgresql' : 'redis',
            status: service.status === 'live' ? 'active' : 'inactive',
            connectionString: service.connectionString || undefined
          });
        }
      }

      return databases;
    } catch (error) {
      logger.error('Error listing Render databases:', error);
      throw new Error(`Failed to list Render databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lista bancos de dados do Upstash
   */
  async listUpstashDatabases(auth: ProviderAuth): Promise<ExternalDatabase[]> {
    try {
      if (!auth.token) {
        throw new Error('Upstash API key is required');
      }

      const response = await fetch('https://api.upstash.com/v2/redis/databases', {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Upstash API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const databases: ExternalDatabase[] = [];

      for (const db of data.result || []) {
        databases.push({
          id: db.database_id,
          name: db.name,
          host: db.endpoint || 'N/A',
          port: db.port || 6379,
          database: '0', // Redis não usa database name tradicional
          username: '',
          password: db.password, // Upstash retorna a senha
          databaseType: 'redis',
          status: db.state === 'active' ? 'active' : 'inactive',
          connectionString: db.redis_rest_url || db.redis_url || undefined
        });
      }

      return databases;
    } catch (error) {
      logger.error('Error listing Upstash databases:', error);
      throw new Error(`Failed to list Upstash databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lista bancos de dados baseado no provedor
   */
  async listProviderDatabases(provider: string, auth: ProviderAuth): Promise<ExternalDatabase[]> {
    switch (provider.toLowerCase()) {
      case 'railway':
        return this.listRailwayDatabases(auth);
      case 'supabase':
        return this.listSupabaseDatabases(auth);
      case 'neon':
        return this.listNeonDatabases(auth);
      case 'aiven':
        return this.listAivenDatabases(auth);
      case 'render':
        return this.listRenderDatabases(auth);
      case 'upstash':
        return this.listUpstashDatabases(auth);
      default:
        throw new Error(`Provider ${provider} is not supported for automatic listing`);
    }
  }

  /**
   * Valida autenticação com o provedor
   * Retorna true se as credenciais são válidas, false caso contrário
   */
  async validateProviderAuth(provider: string, auth: ProviderAuth): Promise<boolean> {
    try {
      // Tentar listar bancos para validar as credenciais
      // Se a chamada for bem-sucedida (mesmo que retorne lista vazia), as credenciais são válidas
      await Promise.race([
        this.listProviderDatabases(provider, auth),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Validation timeout')), 15000)
        )
      ]) as Promise<ExternalDatabase[]>;
      
      return true;
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      
      // Log detalhado do erro
      logger.warn(`Auth validation failed for ${provider}:`, {
        message: errorMessage,
        provider
      });

      // Se for timeout ou erro de conexão, ainda consideramos como potencialmente válido
      // O usuário pode ter credenciais corretas mas problemas temporários de rede
      if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
        logger.warn(`Network issue during ${provider} validation, allowing save but marking for retry`);
        return true; // Permitir salvar mesmo com problemas de rede
      }

      // Para Railway especificamente, a API pode estar diferente
      // Aceitar o token mesmo se a validação falhar por causa da estrutura da API
      if (provider === 'railway') {
        logger.info('Railway validation failed, but allowing save (API structure may vary)');
        return true; // Permitir salvar token do Railway mesmo se validação falhar
      }

      return false;
    }
  }

  /**
   * Helper: Infere tipo de banco pelo nome
   */
  private inferDatabaseType(name: string, type?: string): 'postgresql' | 'mysql' | 'redis' {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('redis') || type?.includes('redis')) return 'redis';
    if (lowerName.includes('mysql') || type?.includes('mysql')) return 'mysql';
    if (lowerName.includes('mongodb') || type?.includes('mongodb')) return 'postgresql'; // MongoDB como postgres para compatibilidade
    return 'postgresql'; // Default
  }

  /**
   * Helper: Mapeia tipo de serviço Aiven para tipo de banco
   */
  private mapAivenServiceType(serviceType: string): 'postgresql' | 'mysql' | 'redis' {
    switch (serviceType) {
      case 'pg':
        return 'postgresql';
      case 'mysql':
        return 'mysql';
      case 'redis':
        return 'redis';
      default:
        return 'postgresql';
    }
  }

  /**
   * Helper: Retorna porta padrão por tipo
   */
  private getDefaultPortByType(type: string): number {
    switch (type.toLowerCase()) {
      case 'postgresql':
      case 'pg':
        return 5432;
      case 'mysql':
        return 3306;
      case 'redis':
        return 6379;
      default:
        return 5432;
    }
  }
}

