import { logger } from '../utils/logger';
import { DatabaseProvider } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Client as SSHClient, ConnectConfig } from 'ssh2';
import * as fs from 'fs/promises';

export interface DatabaseProvisionConfig {
  name: string;
  region?: string;
  plan?: string;
  backupEnabled?: boolean;
}

export interface ProvisionedDatabase {
  provider: DatabaseProvider;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  connectionString: string;
}

/**
 * Provider Integration Service
 * Gerencia provisionamento de databases em diferentes providers
 */
export class ProviderIntegrationService {
  // Mapa de conexões persistentes: username@host:port -> SSHClient
  private persistentSSH: Map<string, SSHClient> = new Map();

  constructor() {
    logger.info('ProviderIntegrationService initialized');
  }
  /** Garante que Docker está instalado no servidor */
  private async ensureDockerInstalledViaSSH(options: { sshHost: string; sshPort?: number; sshUsername: string; sshKey: string }): Promise<void> {
    const installScript = [
      // se docker não existir, instalar via get.docker.com (cobre várias distros)
      `command -v docker >/dev/null 2>&1 || curl -fsSL https://get.docker.com | sh`,
      // garantir que o serviço está ativo
      `sudo systemctl enable docker >/dev/null 2>&1 || true`,
      `sudo systemctl start docker >/dev/null 2>&1 || true`
    ].join(' && ');
    await this.execSSH(options, installScript);
  }

  /** Verifica se a porta está livre no host, lança erro se ocupada */
  private async assertPortFreeViaSSH(options: { sshHost: string; sshPort?: number; sshUsername: string; sshKey: string }, port: number): Promise<void> {
    const out = await this.execSSHWithOutput(options, `ss -tulpn 2>/dev/null | grep -w :${port} || true`);
    if (out && out.trim()) {
      throw new Error(`PORT_IN_USE:${port}`);
    }
  }

  /**
   * Obtém (ou cria) uma conexão SSH persistente com keepalive.
   * A conexão só é encerrada por erro fatal, shutdown explícito ou forceClosePersistentSSH.
   */
  private async getPersistentSSH(options: { sshHost: string; sshPort?: number; sshUsername: string; sshKey: string }): Promise<SSHClient> {
    const key = `${options.sshUsername}@${options.sshHost}:${options.sshPort || 22}`;
    const existing = this.persistentSSH.get(key);
    if (existing) return existing;

    const ssh = new SSHClient();
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      ssh.on('ready', () => {
        settled = true;
        this.persistentSSH.set(key, ssh);
        resolve();
      }).on('error', (e) => {
        if (!settled) { settled = true; reject(e); }
      }).on('close', () => {
        // remover do cache ao fechar
        if (this.persistentSSH.get(key) === ssh) {
          this.persistentSSH.delete(key);
        }
      }).connect({
        host: options.sshHost,
        port: options.sshPort || 22,
        username: options.sshUsername,
        privateKey: options.sshKey,
        readyTimeout: 30000,
        keepaliveInterval: 10000,
        keepaliveCountMax: 6,
      } as ConnectConfig);
    });
    return ssh;
  }

  /** Encerra explicitamente a conexão persistente. */
  async forceClosePersistentSSH(options: { sshHost: string; sshPort?: number; sshUsername: string }) {
    const key = `${options.sshUsername}@${options.sshHost}:${options.sshPort || 22}`;
    const c = this.persistentSSH.get(key);
    if (c) {
      try { c.end(); } catch {}
      this.persistentSSH.delete(key);
    }
  }

  /**
   * Teste simples de SSH (sem criar DB) - conecta e executa 'echo ok'
   */
  async testSSHConnection(options: {
    sshHost: string;
    sshPort?: number;
    sshUsername: string;
    sshKey: string; // conteúdo da chave privada (PEM) ou caminho já resolvido
  }): Promise<{ success: boolean; message?: string }>
  {
    try {
      let privateKey = options.sshKey;
      
      // Validar parâmetros obrigatórios
      if (!privateKey || !privateKey.trim()) {
        return { success: false, message: 'SSH key is required and cannot be empty' };
      }
      
      if (!options.sshHost || !options.sshUsername) {
        return { success: false, message: 'SSH host and username are required' };
      }
      
      try {
        // Tentar ler do arquivo se parecer ser um caminho
        if (privateKey.startsWith('/') || privateKey.startsWith('./') || privateKey.startsWith('../') || privateKey.startsWith('C:\\') || privateKey.startsWith('D:\\')) {
          privateKey = await fs.readFile(privateKey, 'utf8');
        }
      } catch (fileError) {
        logger.warn('Could not read SSH key from file, treating as direct key content:', fileError);
      }
      
      privateKey = this.normalizePrivateKey(privateKey);
      
      // Validação da chave normalizada
      if (!privateKey || privateKey.length < 100) {
        return { success: false, message: 'SSH key appears to be too short or invalid after normalization' };
      }
      
      if (!privateKey.includes('-----BEGIN') || !privateKey.includes('-----END')) {
        return { success: false, message: 'SSH key must be in PEM format (must contain -----BEGIN and -----END)' };
      }

      logger.info('Testing SSH connection', {
        host: options.sshHost,
        port: options.sshPort || 22,
        username: options.sshUsername,
        keyLength: privateKey.length,
        keyStartsWith: privateKey.substring(0, 30)
      });

      return new Promise((resolve) => {
        const ssh = new SSHClient();
        const cfg: ConnectConfig = {
          host: options.sshHost,
          port: options.sshPort || 22,
          username: options.sshUsername,
          privateKey,
          readyTimeout: 30000, // Increased timeout
          keepaliveInterval: 10000, // Send keepalive packets every 10 seconds
          keepaliveCountMax: 3, // Allow 3 keepalive failures before considering connection dead
        };
        
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            ssh.end();
            resolve({ success: false, message: 'SSH connection timeout (30 seconds)' });
          }
        }, 35000);
        
        ssh.on('ready', () => {
          logger.info('SSH connection established, executing test command');
          ssh.exec('echo ok', (err, stream) => {
            if (err) {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                ssh.end();
                resolve({ success: false, message: `Command execution failed: ${err.message}` });
              }
              return;
            }
            let out = '';
            stream.on('data', (d: Buffer) => { out += d.toString(); });
            stream.on('close', () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                ssh.end();
                const result = out.trim() === 'ok';
                logger.info('SSH test command result', { output: out.trim(), success: result });
                resolve({ success: result, message: result ? undefined : `Unexpected output: ${out.trim()}` });
              }
            });
            stream.on('error', (streamErr) => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                ssh.end();
                resolve({ success: false, message: `Stream error: ${streamErr.message}` });
              }
            });
          });
        }).on('error', (e: any) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            logger.error('SSH connection error', {
              message: e.message,
              code: e.code,
              level: e.level,
              host: options.sshHost
            });
            
            let userMessage = 'SSH connection failed';
            if (e.message) {
              userMessage = e.message;
              // Mensagens mais amigáveis para erros comuns
              if (e.message.includes('ECONNREFUSED')) {
                userMessage = `Connection refused. Check if SSH service is running on ${options.sshHost}:${options.sshPort || 22}`;
              } else if (e.message.includes('ETIMEDOUT')) {
                userMessage = `Connection timeout. Check if ${options.sshHost} is reachable and firewall rules allow SSH`;
              } else if (e.message.includes('ENOTFOUND')) {
                userMessage = `Host not found: ${options.sshHost}. Check the hostname or IP address`;
              } else if (e.message.includes('UNPROTECTED PRIVATE KEY')) {
                userMessage = 'SSH key file permissions are too open. The key should have restricted permissions (600 or 400)';
              } else if (e.message.includes('All configured authentication methods failed')) {
                userMessage = 'Authentication failed. Check username and SSH key. Make sure the key is added to the server\'s authorized_keys';
              } else if (e.message.includes('Host key verification failed')) {
                userMessage = 'Host key verification failed. This may be a security issue or the server was reinstalled';
              }
            }
            
            resolve({ success: false, message: userMessage });
          }
        }).connect(cfg);
      });
    } catch (error: any) {
      logger.error('Unexpected error in testSSHConnection', error);
      return { success: false, message: error?.message || 'Unexpected error during SSH connection test' };
    }
  }

  /**
   * Normaliza chaves privadas coladas via textarea ou lidas de arquivo
   * - Converte \r\n e \r em \n
   * - Converte sequências literais "\\n" em quebras reais
   * - Remove espaços extras nas bordas
   * - Remove espaços extras no início/fim de linhas
   * - Garante que cabeçalho/rodapé tenham quebras de linha corretas
   */
  private normalizePrivateKey(raw: string): string {
    if (!raw) return raw;
    let key = String(raw).trim();
    
    // Se veio com \n literais (JSON/campo de texto), transformar em quebras reais
    if (key.includes('\\n') && !key.includes('\n')) {
      key = key.replace(/\\n/g, '\n');
    }
    
    // Normalizar CRLF/CR para LF
    key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Remover espaços extras no início/fim de cada linha
    key = key.split('\n').map(line => line.trim()).join('\n');
    
    // Garantir quebra de linha após -----BEGIN e antes -----END
    if (!key.includes('\n')) {
      // Se não tem quebras, tentar adicionar após BEGIN e antes END
      key = key.replace(/-----BEGIN ([A-Z ]+)-----/g, '-----BEGIN $1-----\n');
      key = key.replace(/-----END ([A-Z ]+)-----/g, '\n-----END $1-----');
    }
    
    // Garantir que o cabeçalho e rodapé estejam em linhas separadas
    key = key.replace(/-----BEGIN/g, '\n-----BEGIN').replace(/-----END/g, '-----END\n');
    
    // Limpar linhas vazias duplicadas e espaços extras
    key = key.split('\n').filter(line => line.trim() || line.includes('-----')).join('\n');
    
    // Remover espaços extras no início/fim novamente
    key = key.trim();
    
    // Validação básica: deve começar com -----BEGIN e terminar com -----END
    if (!key.includes('-----BEGIN') || !key.includes('-----END')) {
      logger.warn('SSH key normalization: Key does not appear to be a valid PEM format');
    }
    
    return key;
  }

  /**
   * Provisionar Postgres via Docker em VPS com Docker instalado (acesso por SSH)
   */
  async provisionDockerPostgresViaSSH(options: {
    sshHost: string;
    sshPort?: number;
    sshUsername: string;
    sshKey: string;
    containerName: string;
    dbName?: string;
    dbUser?: string;
    dbPassword?: string;
    hostPort?: number; // porta exposta no host
    volumeName?: string;
    image?: string; // ex.: postgres:16
  }): Promise<ProvisionedDatabase> {
    await this.ensureDockerInstalledViaSSH(options);
    await this.assertPortFreeViaSSH(options, options.hostPort || 5432);
    const image = options.image || 'postgres:16';
    const dbName = options.dbName || 'postgres';
    const dbUser = options.dbUser || 'postgres';
    const dbPassword = options.dbPassword || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const hostPort = options.hostPort || 5432;
    const volume = options.volumeName || `${options.containerName}_data`;

    const runScript = [
      `docker pull ${image}`,
      `docker volume create ${volume} || true`,
      // Se existir container com mesmo nome, não recriar
      `docker ps -a --format '{{.Names}}' | grep -w ${options.containerName} || docker run -d --name ${options.containerName} -e POSTGRES_DB=${dbName} -e POSTGRES_USER=${dbUser} -e POSTGRES_PASSWORD=${dbPassword} -p ${hostPort}:5432 -v ${volume}:/var/lib/postgresql/data --restart unless-stopped ${image}`,
      // Se já existir parado, apenas iniciar
      `docker start ${options.containerName} || true`
    ].join(' && ');

    await this.execSSH(options, runScript);

    const connectionString = `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${options.sshHost}:${hostPort}/${dbName}`;
    return {
      provider: 'custom' as DatabaseProvider,
      host: options.sshHost,
      port: hostPort,
      databaseName: dbName,
      username: dbUser,
      password: dbPassword,
      connectionString,
    };
  }

  /**
   * Provisionar MySQL via Docker em VPS com Docker instalado (acesso por SSH)
   */
  async provisionDockerMySQLViaSSH(options: {
    sshHost: string;
    sshPort?: number;
    sshUsername: string;
    sshKey: string;
    containerName: string;
    dbName?: string;
    dbUser?: string;
    dbPassword?: string;
    hostPort?: number;
    volumeName?: string;
    image?: string; // ex.: mysql:8.0
  }): Promise<ProvisionedDatabase> {
    await this.ensureDockerInstalledViaSSH(options);
    await this.assertPortFreeViaSSH(options, options.hostPort || 3306);
    const image = options.image || 'mysql:8.0';
    const dbName = options.dbName || 'mysql';
    const dbUser = options.dbUser || 'root';
    const dbPassword = options.dbPassword || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const hostPort = options.hostPort || 3306;
    const volume = options.volumeName || `${options.containerName}_data`;

    const runScript = [
      `docker pull ${image}`,
      `docker volume create ${volume} || true`,
      `docker ps -a --format '{{.Names}}' | grep -w ${options.containerName} || docker run -d --name ${options.containerName} -e MYSQL_DATABASE=${dbName} -e MYSQL_USER=${dbUser} -e MYSQL_PASSWORD=${dbPassword} -e MYSQL_ROOT_PASSWORD=${dbPassword} -p ${hostPort}:3306 -v ${volume}:/var/lib/mysql --restart unless-stopped ${image}`,
      `docker start ${options.containerName} || true`
    ].join(' && ');

    await this.execSSH(options, runScript);

    const connectionString = `mysql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${options.sshHost}:${hostPort}/${dbName}`;
    return {
      provider: 'custom' as DatabaseProvider,
      host: options.sshHost,
      port: hostPort,
      databaseName: dbName,
      username: dbUser,
      password: dbPassword,
      connectionString,
    };
  }

  /**
   * Provisionar Redis via Docker em VPS com Docker instalado (acesso por SSH)
   */
  async provisionDockerRedisViaSSH(options: {
    sshHost: string;
    sshPort?: number;
    sshUsername: string;
    sshKey: string;
    containerName: string;
    password?: string;
    hostPort?: number;
    volumeName?: string;
    image?: string; // ex.: redis:7-alpine
  }): Promise<ProvisionedDatabase> {
    await this.ensureDockerInstalledViaSSH(options);
    await this.assertPortFreeViaSSH(options, options.hostPort || 6379);
    const image = options.image || 'redis:7-alpine';
    const password = options.password || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const hostPort = options.hostPort || 6379;
    const volume = options.volumeName || `${options.containerName}_data`;

    // Redis com senha usando arquivo de configuração ou comando
    const runScript = [
      `docker pull ${image}`,
      `docker volume create ${volume} || true`,
      `docker ps -a --format '{{.Names}}' | grep -w ${options.containerName} || docker run -d --name ${options.containerName} -e REDIS_PASSWORD=${password} -p ${hostPort}:6379 -v ${volume}:/data --restart unless-stopped ${image} redis-server --requirepass ${password}`,
      `docker start ${options.containerName} || true`
    ].join(' && ');

    await this.execSSH(options, runScript);

    const connectionString = `redis://:${encodeURIComponent(password)}@${options.sshHost}:${hostPort}`;
    return {
      provider: 'redis' as DatabaseProvider,
      host: options.sshHost,
      port: hostPort,
      databaseName: '0',
      username: '',
      password: password,
      connectionString,
    };
  }

  /**
   * Criar schema PostgreSQL específico por tenant
   */
  async createPostgresSchema(options: {
    sshHost: string;
    sshPort?: number;
    sshUsername: string;
    sshKey: string;
    containerName: string;
    dbName: string;
    dbUser: string;
    dbPassword: string;
    schemaName: string;
  }): Promise<void> {
    // Usar PGPASSWORD para evitar solicitação de senha interativa
    const schemaCmd = `docker exec -e PGPASSWORD=${options.dbPassword} ${options.containerName} psql -U ${options.dbUser} -d ${options.dbName} -c "CREATE SCHEMA IF NOT EXISTS ${options.schemaName};"`;
    
    await this.execSSH(options, schemaCmd);
  }

  /**
   * Lista containers Docker de MySQL via SSH
   */
  async listDockerMySQLContainersViaSSH(options: {
    sshHost: string;
    sshPort?: number;
    sshUsername: string;
    sshKey: string;
  }): Promise<Array<{
    containerName: string;
    image: string;
    host: string;
    hostPort?: number;
    dbName?: string;
    username?: string;
    password?: string;
  }>> {
    const containers = await this.execSSHWithOutput(options, `docker ps --format '{{.Names}}|{{.Image}}'`);
    const lines = containers.split('\n').map(l => l.trim()).filter(Boolean);
    const mysql = lines
      .map(line => {
        const [name, image] = line.split('|');
        return { name, image };
      })
      .filter(c => /mysql|mariadb/i.test(c.image));

    const results: Array<{ containerName: string; image: string; host: string; hostPort?: number; dbName?: string; username?: string; password?: string; }> = [];

    for (const c of mysql) {
      const out = await this.execSSHWithOutput(options, `docker inspect ${c.name} --format '{{json .NetworkSettings.Ports}}|{{json .Config.Env}}'`);
      const [portsJson, envJson] = out.split('|');
      let hostPort: number | undefined;
      try {
        const ports = JSON.parse(portsJson);
        const key = Object.keys(ports).find(k => k.startsWith('3306/tcp'));
        const bindings = key ? ports[key] : undefined;
        if (bindings && bindings[0] && bindings[0].HostPort) {
          hostPort = Number(bindings[0].HostPort);
        }
      } catch {}
      let dbName: string | undefined;
      let username: string | undefined;
      let password: string | undefined;
      try {
        const env: string[] = JSON.parse(envJson);
        for (const e of env) {
          if (e.startsWith('MYSQL_DATABASE=')) dbName = e.split('=')[1];
          if (e.startsWith('MYSQL_USER=')) username = e.split('=')[1];
          if (e.startsWith('MYSQL_PASSWORD=')) password = e.split('=')[1];
          if (e.startsWith('MYSQL_ROOT_PASSWORD=') && !password) password = e.split('=')[1];
        }
      } catch {}
      results.push({ containerName: c.name, image: c.image, host: options.sshHost, hostPort, dbName, username, password });
    }
    return results;
  }

  private execSSH(options: { sshHost: string; sshPort?: number; sshUsername: string; sshKey: string }, command: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let privateKey = options.sshKey;
      const prepare = async () => {
        try {
          if (privateKey.startsWith('/') || privateKey.startsWith('./') || privateKey.startsWith('../')) {
            privateKey = await fs.readFile(privateKey, 'utf8');
          }
        } catch {}
      };
      await prepare();
      try {
        const ssh = await this.getPersistentSSH({ ...options, sshKey: privateKey });
        ssh.exec(command, (err, stream) => {
          if (err) { return reject(err); }
          let stderr = '';
          stream.on('data', () => { /* ignore stdout */ });
          stream.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
          stream.on('close', (code: number) => {
            if (code && code !== 0) return reject(new Error(stderr || `Remote command failed with code ${code}`));
            resolve();
          });
        });
      } catch (e) { reject(e); }
    });
  }

  /**
   * Lista containers Docker de Postgres via SSH, retornando portas e envs
   */
  async listDockerPostgresContainersViaSSH(options: {
    sshHost: string;
    sshPort?: number;
    sshUsername: string;
    sshKey: string;
  }): Promise<Array<{
    containerName: string;
    image: string;
    host: string;
    hostPort?: number;
    dbName?: string;
    username?: string;
    password?: string;
  }>> {
    const containers = await this.execSSHWithOutput(options, `docker ps --format '{{.Names}}|{{.Image}}'`);
    const lines = containers.split('\n').map(l => l.trim()).filter(Boolean);
    const postgres = lines
      .map(line => {
        const [name, image] = line.split('|');
        return { name, image };
      })
      .filter(c => /postgres/i.test(c.image));

    const results: Array<{ containerName: string; image: string; host: string; hostPort?: number; dbName?: string; username?: string; password?: string; }> = [];

    for (const c of postgres) {
      const out = await this.execSSHWithOutput(options, `docker inspect ${c.name} --format '{{json .NetworkSettings.Ports}}|{{json .Config.Env}}'`);
      const [portsJson, envJson] = out.split('|');
      let hostPort: number | undefined;
      try {
        const ports = JSON.parse(portsJson);
        const key = Object.keys(ports).find(k => k.startsWith('5432/tcp'));
        const bindings = key ? ports[key] : undefined;
        if (bindings && bindings[0] && bindings[0].HostPort) {
          hostPort = Number(bindings[0].HostPort);
        }
      } catch {}
      let dbName: string | undefined;
      let username: string | undefined;
      let password: string | undefined;
      try {
        const env: string[] = JSON.parse(envJson);
        for (const e of env) {
          if (e.startsWith('POSTGRES_DB=')) dbName = e.split('=')[1];
          if (e.startsWith('POSTGRES_USER=')) username = e.split('=')[1];
          if (e.startsWith('POSTGRES_PASSWORD=')) password = e.split('=')[1];
        }
      } catch {}
      results.push({ containerName: c.name, image: c.image, host: options.sshHost, hostPort, dbName, username, password });
    }
    return results;
  }

  private execSSHWithOutput(options: { sshHost: string; sshPort?: number; sshUsername: string; sshKey: string }, command: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let privateKey = options.sshKey;
      const prepare = async () => {
        try {
          if (privateKey.startsWith('/') || privateKey.startsWith('./') || privateKey.startsWith('../')) {
            privateKey = await fs.readFile(privateKey, 'utf8');
          }
        } catch {}
      };
      await prepare();
      try {
        const ssh = await this.getPersistentSSH({ ...options, sshKey: privateKey });
        ssh.exec(command, (err, stream) => {
          if (err) { return reject(err); }
          stream.on('data', (d: Buffer) => { stdout += d.toString(); });
          stream.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
          stream.on('close', (code: number) => {
            if (code && code !== 0) return reject(new Error(stderr || `Remote command failed with code ${code}`));
            resolve(stdout.trim());
          });
        });
      } catch (e) { reject(e); }
    });
  }

  /**
   * Executa múltiplos comandos em uma única sessão SSH persistente e retorna saídas na mesma ordem.
   */
  private execManySSHWithOutput(options: { sshHost: string; sshPort?: number; sshUsername: string; sshKey: string }, commands: string[]): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      let privateKey = options.sshKey;
      const outputs: string[] = [];
      const run = (ssh: SSHClient, idx: number) => {
        if (idx >= commands.length) return resolve(outputs);
        ssh.exec(commands[idx], (err, stream) => {
          if (err) return reject(err);
          let stdout = '';
          let stderr = '';
          stream.on('data', (d: Buffer) => { stdout += d.toString(); });
          stream.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
          stream.on('close', (code: number) => {
            if (code && code !== 0) return reject(new Error(stderr || `Remote command failed with code ${code}`));
            outputs.push(stdout.trim());
            run(ssh, idx + 1);
          });
        });
      };
      try {
        try {
          if (privateKey.startsWith('/') || privateKey.startsWith('./') || privateKey.startsWith('../')) {
            privateKey = await fs.readFile(privateKey, 'utf8');
          }
        } catch {}
        const ssh = await this.getPersistentSSH({ ...options, sshKey: privateKey });
        run(ssh, 0);
      } catch (e) { reject(e); }
    });
  }

  /**
   * Coleta saúde do servidor e containers Postgres/Redis em uma única sessão SSH.
   */
  async getHealthAndContainersViaSSH(options: { sshHost: string; sshPort?: number; sshUsername: string; sshKey: string }): Promise<{
    health: Awaited<ReturnType<ProviderIntegrationService['getServerHealthViaSSH']>>;
    postgres: Awaited<ReturnType<ProviderIntegrationService['listDockerPostgresContainersViaSSH']>>;
    redis: Awaited<ReturnType<ProviderIntegrationService['listDockerRedisContainersViaSSH']>>;
  }> {
    // Comandos necessários (espelham getServerHealthViaSSH) + docker ps
    const commands = [
      `uname -a || cat /etc/os-release || echo unknown`,
      `cat /proc/uptime || uptime -p || echo 0 0`,
      `cat /proc/loadavg || cat /proc/loadavg 2>/dev/null || echo 0 0 0`,
      `nproc || getconf _NPROCESSORS_ONLN || echo 0`,
      `cat /proc/cpuinfo | grep -m1 'model name' | cut -d: -f2 || lscpu | grep -m1 'Model name' | cut -d: -f2 || echo`,
      `cat /proc/meminfo`,
      `df -P -B1 --output=source,size,used,avail,pcent,target | tail -n +2`,
      `command -v docker >/dev/null 2>&1 && docker info --format '{{json .}}' || echo`,
      `docker ps --format '{{.Names}}|{{.Image}}'`
    ];
    const [os, uptimeRaw, loadRaw, coresRaw, cpuModelRaw, meminfo, dfRaw, dockerInfoRaw, dockerPs] = await this.execManySSHWithOutput(options, commands);
    // Parse saúde (mesmo que getServerHealthViaSSH)
    let uptimeSeconds: number | null = null;
    try {
      const parts = uptimeRaw.trim().split(/\s+/);
      uptimeSeconds = Number(parts[0]);
      if (Number.isNaN(uptimeSeconds)) uptimeSeconds = null;
    } catch { uptimeSeconds = null; }
    const loadParts = loadRaw.trim().split(/\s+/);
    const loadAvg: number[] = [Number(loadParts[0]) || 0, Number(loadParts[1]) || 0, Number(loadParts[2]) || 0];
    const cores = Number(coresRaw.trim()) || undefined;
    const cpuModel = cpuModelRaw.trim();
    let memTotal: number | undefined; let memFree: number | undefined; let memAvailable: number | undefined;
    try {
      for (const line of meminfo.split('\n')) {
        if (line.startsWith('MemTotal:')) memTotal = Number(line.replace(/[^0-9]/g, '')) * 1024;
        if (line.startsWith('MemFree:')) memFree = Number(line.replace(/[^0-9]/g, '')) * 1024;
        if (line.startsWith('MemAvailable:')) memAvailable = Number(line.replace(/[^0-9]/g, '')) * 1024;
      }
    } catch {}
    const usedBytes = typeof memTotal === 'number' && typeof memAvailable === 'number' ? Math.max(0, memTotal - memAvailable) : undefined;
    const disks: Array<{ filesystem: string; sizeBytes: number; usedBytes: number; availBytes: number; usePercent: string; mountpoint: string }> = [];
    try {
      for (const line of dfRaw.split('\n')) {
        if (!line.trim()) continue;
        const [fs, size, used, avail, pcent, mount] = line.split(/\s+/);
        disks.push({ filesystem: fs, sizeBytes: Number(size) || 0, usedBytes: Number(used) || 0, availBytes: Number(avail) || 0, usePercent: pcent, mountpoint: mount });
      }
    } catch {}
    let dockerInfoJson: any = null;
    try { dockerInfoJson = dockerInfoRaw ? JSON.parse(dockerInfoRaw) : null; } catch {}
    let docker: { serverVersion?: string; containers?: { total?: number; running?: number; paused?: number; stopped?: number }; images?: number } | undefined;
    if (dockerInfoJson) {
      docker = {
        serverVersion: dockerInfoJson.ServerVersion,
        containers: {
          total: dockerInfoJson.Containers,
          running: dockerInfoJson.ContainersRunning,
          paused: dockerInfoJson.ContainersPaused,
          stopped: dockerInfoJson.ContainersStopped,
        },
        images: dockerInfoJson.Images,
      };
    }
    const health = {
      os: os.trim(),
      uptimeSeconds,
      loadAvg,
      cpu: { cores, model: cpuModel || undefined },
      memory: { totalBytes: memTotal, freeBytes: memFree, availableBytes: memAvailable, usedBytes },
      disks,
      docker,
    };

    // Containers a partir do docker ps capturado
    const lines = dockerPs.split('\n').map(l => l.trim()).filter(Boolean);
    const entries = lines.map(l => { const [name, image] = l.split('|'); return { name, image }; });
    const postgresEntries = entries.filter(e => /postgres/i.test(e.image));
    const redisEntries = entries.filter(e => /redis/i.test(e.image));

    const inspect = async (name: string) => this.execSSHWithOutput(options, `docker inspect ${name} --format '{{json .NetworkSettings.Ports}}|{{json .Config.Env}}'`);
    const postgres: Array<{ containerName: string; image: string; host: string; hostPort?: number; dbName?: string; username?: string; password?: string }> = [];
    for (const c of postgresEntries) {
      const out = await inspect(c.name);
      const [portsJson, envJson] = out.split('|');
      let hostPort: number | undefined;
      try {
        const ports = JSON.parse(portsJson);
        const key = Object.keys(ports).find(k => k.startsWith('5432/tcp'));
        const bindings = key ? ports[key] : undefined;
        if (bindings && bindings[0] && bindings[0].HostPort) hostPort = Number(bindings[0].HostPort);
      } catch {}
      let dbName: string | undefined; let username: string | undefined; let password: string | undefined;
      try {
        const env: string[] = JSON.parse(envJson);
        for (const e of env) {
          if (e.startsWith('POSTGRES_DB=')) dbName = e.split('=')[1];
          if (e.startsWith('POSTGRES_USER=')) username = e.split('=')[1];
          if (e.startsWith('POSTGRES_PASSWORD=')) password = e.split('=')[1];
        }
      } catch {}
      postgres.push({ containerName: c.name, image: c.image, host: options.sshHost, hostPort, dbName, username, password });
    }
    const redis: Array<{ containerName: string; image: string; host: string; hostPort?: number; password?: string }> = [];
    for (const c of redisEntries) {
      const out = await inspect(c.name);
      const [portsJson, envJson] = out.split('|');
      let hostPort: number | undefined;
      try {
        const ports = JSON.parse(portsJson);
        const key = Object.keys(ports).find(k => k.startsWith('6379/tcp'));
        const bindings = key ? ports[key] : undefined;
        if (bindings && bindings[0] && bindings[0].HostPort) hostPort = Number(bindings[0].HostPort);
      } catch {}
      let password: string | undefined;
      try {
        const env: string[] = JSON.parse(envJson);
        for (const e of env) {
          if (e.startsWith('REDIS_PASSWORD=')) password = e.split('=')[1];
        }
      } catch {}
      redis.push({ containerName: c.name, image: c.image, host: options.sshHost, hostPort, password });
    }

    return { health, postgres, redis };
  }

  /**
   * Testa conexão Redis (hostname/porta/senha opcional)
   */
  async testRedisConnection(options: { host: string; port?: number; password?: string; db?: number; tls?: boolean }, timeoutMs: number = 8000): Promise<boolean> {
    const client = new Redis({
      host: options.host,
      port: options.port || 6379,
      password: options.password,
      db: options.db || 0,
      tls: options.tls ? {} as any : undefined,
      connectTimeout: timeoutMs,
      lazyConnect: true,
    } as any);
    try {
      await client.connect();
      await client.ping();
      return true;
    } catch (e) {
      logger.error('testRedisConnection failed:', e);
      return false;
    } finally {
      try { client.disconnect(); } catch {}
    }
  }

  /**
   * Lista containers Docker de Redis via SSH
   */
  async listDockerRedisContainersViaSSH(options: { sshHost: string; sshPort?: number; sshUsername: string; sshKey: string }): Promise<Array<{ containerName: string; image: string; host: string; hostPort?: number; password?: string }>> {
    const containers = await this.execSSHWithOutput(options, `docker ps --format '{{.Names}}|{{.Image}}'`);
    const lines = containers.split('\n').map(l => l.trim()).filter(Boolean);
    const redis = lines
      .map(line => { const [name, image] = line.split('|'); return { name, image }; })
      .filter(c => /redis/i.test(c.image));

    const results: Array<{ containerName: string; image: string; host: string; hostPort?: number; password?: string }> = [];
    for (const c of redis) {
      const out = await this.execSSHWithOutput(options, `docker inspect ${c.name} --format '{{json .NetworkSettings.Ports}}|{{json .Config.Env}}'`);
      const [portsJson, envJson] = out.split('|');
      let hostPort: number | undefined;
      try {
        const ports = JSON.parse(portsJson);
        const key = Object.keys(ports).find(k => k.startsWith('6379/tcp'));
        const bindings = key ? ports[key] : undefined;
        if (bindings && bindings[0] && bindings[0].HostPort) {
          hostPort = Number(bindings[0].HostPort);
        }
      } catch {}
      let password: string | undefined;
      try {
        const env: string[] = JSON.parse(envJson);
        for (const e of env) {
          if (e.startsWith('REDIS_PASSWORD=')) password = e.split('=')[1];
        }
      } catch {}
      results.push({ containerName: c.name, image: c.image, host: options.sshHost, hostPort, password });
    }
    return results;
  }

  /**
   * Lista Postgres e Redis em uma única passada (mesma conexão SSH) para eficiência
   */
  async listDockerPgAndRedisViaSSH(options: { sshHost: string; sshPort?: number; sshUsername: string; sshKey: string }): Promise<{
    postgres: Array<{ containerName: string; image: string; host: string; hostPort?: number; dbName?: string; username?: string; password?: string }>,
    redis: Array<{ containerName: string; image: string; host: string; hostPort?: number; password?: string }>
  }> {
    // Uma chamada para listar todos os containers, depois duas inspeções por tipo
    const containers = await this.execSSHWithOutput(options, `docker ps --format '{{.Names}}|{{.Image}}'`);
    const lines = containers.split('\n').map(l => l.trim()).filter(Boolean);
    const entries = lines.map(l => { const [name, image] = l.split('|'); return { name, image }; });

    const postgresEntries = entries.filter(e => /postgres/i.test(e.image));
    const redisEntries = entries.filter(e => /redis/i.test(e.image));

    const postgres: Array<{ containerName: string; image: string; host: string; hostPort?: number; dbName?: string; username?: string; password?: string }> = [];
    for (const c of postgresEntries) {
      const out = await this.execSSHWithOutput(options, `docker inspect ${c.name} --format '{{json .NetworkSettings.Ports}}|{{json .Config.Env}}'`);
      const [portsJson, envJson] = out.split('|');
      let hostPort: number | undefined;
      try {
        const ports = JSON.parse(portsJson);
        const key = Object.keys(ports).find(k => k.startsWith('5432/tcp'));
        const bindings = key ? ports[key] : undefined;
        if (bindings && bindings[0] && bindings[0].HostPort) hostPort = Number(bindings[0].HostPort);
      } catch {}
      let dbName: string | undefined; let username: string | undefined; let password: string | undefined;
      try {
        const env: string[] = JSON.parse(envJson);
        for (const e of env) {
          if (e.startsWith('POSTGRES_DB=')) dbName = e.split('=')[1];
          if (e.startsWith('POSTGRES_USER=')) username = e.split('=')[1];
          if (e.startsWith('POSTGRES_PASSWORD=')) password = e.split('=')[1];
        }
      } catch {}
      postgres.push({ containerName: c.name, image: c.image, host: options.sshHost, hostPort, dbName, username, password });
    }

    const redis: Array<{ containerName: string; image: string; host: string; hostPort?: number; password?: string }> = [];
    for (const c of redisEntries) {
      const out = await this.execSSHWithOutput(options, `docker inspect ${c.name} --format '{{json .NetworkSettings.Ports}}|{{json .Config.Env}}'`);
      const [portsJson, envJson] = out.split('|');
      let hostPort: number | undefined;
      try {
        const ports = JSON.parse(portsJson);
        const key = Object.keys(ports).find(k => k.startsWith('6379/tcp'));
        const bindings = key ? ports[key] : undefined;
        if (bindings && bindings[0] && bindings[0].HostPort) hostPort = Number(bindings[0].HostPort);
      } catch {}
      let password: string | undefined;
      try {
        const env: string[] = JSON.parse(envJson);
        for (const e of env) {
          if (e.startsWith('REDIS_PASSWORD=')) password = e.split('=')[1];
        }
      } catch {}
      redis.push({ containerName: c.name, image: c.image, host: options.sshHost, hostPort, password });
    }

    return { postgres, redis };
  }

  /**
   * Coleta dados de saúde do servidor via SSH (CPU, memória, discos) e sumário do Docker
   */
  async getServerHealthViaSSH(options: { sshHost: string; sshPort?: number; sshUsername: string; sshKey: string }): Promise<{
    os: string;
    uptimeSeconds: number | null;
    loadAvg: number[];
    cpu: { cores?: number; model?: string };
    memory: { totalBytes?: number; freeBytes?: number; availableBytes?: number; usedBytes?: number };
    disks: Array<{ filesystem: string; sizeBytes: number; usedBytes: number; availBytes: number; usePercent: string; mountpoint: string }>;
    docker?: { serverVersion?: string; containers?: { total?: number; running?: number; paused?: number; stopped?: number }; images?: number };
  }> {
    // OS
    const os = await this.execSSHWithOutput(options, `uname -a || cat /etc/os-release || echo unknown`);
    // Uptime e loadavg
    const uptimeRaw = await this.execSSHWithOutput(options, `cat /proc/uptime || uptime -p || echo 0 0`);
    const loadRaw = await this.execSSHWithOutput(options, `cat /proc/loadavg || cat /proc/loadavg 2>/dev/null || echo 0 0 0`);
    // CPU
    const coresRaw = await this.execSSHWithOutput(options, `nproc || getconf _NPROCESSORS_ONLN || echo 0`);
    const cpuModelRaw = await this.execSSHWithOutput(options, `cat /proc/cpuinfo | grep -m1 'model name' | cut -d: -f2 || lscpu | grep -m1 'Model name' | cut -d: -f2 || echo`);
    // Memória
    const meminfo = await this.execSSHWithOutput(options, `cat /proc/meminfo`);
    // Discos
    const dfRaw = await this.execSSHWithOutput(options, `df -P -B1 --output=source,size,used,avail,pcent,target | tail -n +2`);
    // Docker
    let dockerInfoJson: any = null;
    try {
      const dockerInfo = await this.execSSHWithOutput(options, `command -v docker >/dev/null 2>&1 && docker info --format '{{json .}}' || echo`);
      dockerInfoJson = dockerInfo ? JSON.parse(dockerInfo) : null;
    } catch {}

    // Parse uptime/load
    let uptimeSeconds: number | null = null;
    try {
      const parts = uptimeRaw.trim().split(/\s+/);
      uptimeSeconds = Number(parts[0]);
      if (Number.isNaN(uptimeSeconds)) uptimeSeconds = null;
    } catch { uptimeSeconds = null; }
    const loadParts = loadRaw.trim().split(/\s+/);
    const loadAvg: number[] = [Number(loadParts[0]) || 0, Number(loadParts[1]) || 0, Number(loadParts[2]) || 0];

    // Parse CPU
    const cores = Number(coresRaw.trim()) || undefined;
    const cpuModel = cpuModelRaw.trim();

    // Parse memória
    let memTotal: number | undefined;
    let memFree: number | undefined;
    let memAvailable: number | undefined;
    try {
      for (const line of meminfo.split('\n')) {
        if (line.startsWith('MemTotal:')) memTotal = Number(line.replace(/[^0-9]/g, '')) * 1024;
        if (line.startsWith('MemFree:')) memFree = Number(line.replace(/[^0-9]/g, '')) * 1024;
        if (line.startsWith('MemAvailable:')) memAvailable = Number(line.replace(/[^0-9]/g, '')) * 1024;
      }
    } catch {}
    const usedBytes = typeof memTotal === 'number' && typeof memAvailable === 'number' ? Math.max(0, memTotal - memAvailable) : undefined;

    // Parse discos
    const disks: Array<{ filesystem: string; sizeBytes: number; usedBytes: number; availBytes: number; usePercent: string; mountpoint: string }> = [];
    try {
      for (const line of dfRaw.split('\n')) {
        if (!line.trim()) continue;
        const [fs, size, used, avail, pcent, mount] = line.split(/\s+/);
        disks.push({ filesystem: fs, sizeBytes: Number(size) || 0, usedBytes: Number(used) || 0, availBytes: Number(avail) || 0, usePercent: pcent, mountpoint: mount });
      }
    } catch {}

    // Docker summary
    let docker: { serverVersion?: string; containers?: { total?: number; running?: number; paused?: number; stopped?: number }; images?: number } | undefined;
    if (dockerInfoJson) {
      docker = {
        serverVersion: dockerInfoJson.ServerVersion,
        containers: {
          total: dockerInfoJson.Containers,
          running: dockerInfoJson.ContainersRunning,
          paused: dockerInfoJson.ContainersPaused,
          stopped: dockerInfoJson.ContainersStopped,
        },
        images: dockerInfoJson.Images,
      };
    }

    return {
      os: os.trim(),
      uptimeSeconds,
      loadAvg,
      cpu: { cores, model: cpuModel || undefined },
      memory: { totalBytes: memTotal, freeBytes: memFree, availableBytes: memAvailable, usedBytes },
      disks,
      docker,
    };
  }

  /**
   * Testa uma connection string PostgreSQL criando um PrismaClient temporário
   */
  async testDatabaseConnection(connectionString: string, timeoutMs: number = 15000): Promise<boolean> {
    const client = new PrismaClient({
      datasources: { db: { url: connectionString } },
      log: [
        { emit: 'event', level: 'error' },
      ],
    });

    const timer = setTimeout(() => {
      try { (client as any).$disconnect().catch(() => {}); } catch {}
    }, timeoutMs);

    try {
      await client.$connect();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (err) {
      logger.error('testDatabaseConnection failed:', err);
      return false;
    } finally {
      clearTimeout(timer);
      try { await client.$disconnect(); } catch {}
    }
  }

  /**
   * Provisiona database no Railway
   */
  async provisionRailwayDatabase(config: DatabaseProvisionConfig): Promise<ProvisionedDatabase> {
    logger.info('Provisioning Railway database:', config);

    const apiToken = process.env.RAILWAY_API_TOKEN;
    if (!apiToken) {
      throw new Error('RAILWAY_API_TOKEN environment variable is required');
    }

    try {
      // TODO: Implementar chamada real à Railway API
      // Estrutura básica:
      // 1. Criar projeto via API
      // 2. Criar serviço PostgreSQL no projeto
      // 3. Obter connection string do serviço
      // 4. Retornar ProvisionedDatabase
      
      // Exemplo de estrutura de resposta esperada:
      // const response = await fetch('https://api.railway.app/v1/projects', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${apiToken}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ name: config.name })
      // });
      
      logger.warn('Railway database provisioning API call not yet implemented - returning mock data');
      
      // Mock para desenvolvimento - REMOVER quando implementar API real
      return {
        provider: 'railway' as DatabaseProvider,
        host: 'mock-railway-host.railway.app',
        port: 5432,
        databaseName: config.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        username: 'postgres',
        password: 'mock_password_' + Math.random().toString(36).substring(7),
        connectionString: `postgresql://postgres:mock_password@mock-railway-host.railway.app:5432/${config.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      };
    } catch (error) {
      logger.error('Error provisioning Railway database:', error);
      throw new Error(`Failed to provision Railway database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Provisiona database no Supabase
   */
  async provisionSupabaseDatabase(config: DatabaseProvisionConfig): Promise<ProvisionedDatabase> {
    logger.info('Provisioning Supabase database:', config);

    const apiKey = process.env.SUPABASE_API_KEY;
    const orgId = process.env.SUPABASE_ORG_ID;

    if (!apiKey || !orgId) {
      throw new Error('SUPABASE_API_KEY and SUPABASE_ORG_ID environment variables are required');
    }

    try {
      // TODO: Implementar chamada real à Supabase Management API
      // Estrutura básica:
      // 1. Criar projeto via Management API
      // 2. Aguardar provisionamento completo
      // 3. Obter database connection details
      // 4. Retornar ProvisionedDatabase
      
      // Exemplo de estrutura:
      // const response = await fetch(`https://api.supabase.com/v1/projects`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${apiKey}`,
      //     'apikey': apiKey,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     organization_id: orgId,
      //     name: config.name,
      //     region: config.region || 'us-east-1',
      //     db_pass: generateSecurePassword()
      //   })
      // });
      
      logger.warn('Supabase database provisioning API call not yet implemented - returning mock data');
      
      // Mock para desenvolvimento - REMOVER quando implementar API real
      return {
        provider: 'supabase' as DatabaseProvider,
        host: `db.${Math.random().toString(36).substring(7)}.supabase.co`,
        port: 5432,
        databaseName: 'postgres',
        username: 'postgres',
        password: 'mock_password_' + Math.random().toString(36).substring(7),
        connectionString: `postgresql://postgres:mock_password@mock-supabase-host.supabase.co:5432/postgres`,
      };
    } catch (error) {
      logger.error('Error provisioning Supabase database:', error);
      throw new Error(`Failed to provision Supabase database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Provisiona database no Neon
   */
  async provisionNeonDatabase(config: DatabaseProvisionConfig): Promise<ProvisionedDatabase> {
    logger.info('Provisioning Neon database:', config);

    const apiKey = process.env.NEON_API_KEY;
    const projectId = process.env.NEON_PROJECT_ID;

    if (!apiKey) {
      throw new Error('NEON_API_KEY environment variable is required');
    }

    try {
      // TODO: Implementar chamada real à Neon API
      // Estrutura básica:
      // 1. Criar branch do projeto (se projectId fornecido) ou criar novo projeto
      // 2. Obter connection string do endpoint
      // 3. Retornar ProvisionedDatabase
      
      // Exemplo de estrutura:
      // const response = await fetch('https://console.neon.tech/api/v2/projects', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     project: {
      //       name: config.name
      //     }
      //   })
      // });
      
      logger.warn('Neon database provisioning API call not yet implemented - returning mock data');
      
      // Mock para desenvolvimento - REMOVER quando implementar API real
      return {
        provider: 'neon' as DatabaseProvider,
        host: `ep-${Math.random().toString(36).substring(7)}.us-east-2.aws.neon.tech`,
        port: 5432,
        databaseName: 'main',
        username: 'neondb',
        password: 'mock_password_' + Math.random().toString(36).substring(7),
        connectionString: `postgresql://neondb:mock_password@ep-mock.neon.tech:5432/main?sslmode=require`,
      };
    } catch (error) {
      logger.error('Error provisioning Neon database:', error);
      throw new Error(`Failed to provision Neon database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Provisiona database no Oracle Cloud (via SSH/VPS)
   */
  async provisionOracleCloudDatabase(config: DatabaseProvisionConfig): Promise<ProvisionedDatabase> {
    logger.info('Provisioning Oracle Cloud database:', config);

    // Oracle Cloud geralmente é um VPS PostgreSQL acessível via SSH
    // Não há API de provisionamento automático
    // Requer configuração manual e criação de database no servidor

    throw new Error('Oracle Cloud database provisioning requires manual setup');
  }

  /**
   * Provisiona database no AWS RDS
   */
  async provisionAWSRDSDatabase(config: DatabaseProvisionConfig): Promise<ProvisionedDatabase> {
    logger.info('Provisioning AWS RDS database:', config);

    const accessKeyId = process.env.AWS_RDS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_RDS_SECRET_ACCESS_KEY;
    const region = config.region || process.env.AWS_RDS_REGION || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS_RDS_ACCESS_KEY_ID and AWS_RDS_SECRET_ACCESS_KEY environment variables are required');
    }

    try {
      // TODO: Implementar usando AWS SDK @aws-sdk/client-rds
      // Estrutura básica:
      // 1. Criar DB Subnet Group (se necessário)
      // 2. Criar Security Group (se necessário)
      // 3. Criar DB Instance via RDS API
      // 4. Aguardar criação completa
      // 5. Obter endpoint e connection details
      // 6. Retornar ProvisionedDatabase
      
      // Exemplo de estrutura:
      // import { RDSClient, CreateDBInstanceCommand } from '@aws-sdk/client-rds';
      // const client = new RDSClient({ region, credentials: { accessKeyId, secretAccessKey } });
      // const command = new CreateDBInstanceCommand({
      //   DBInstanceIdentifier: config.name,
      //   DBInstanceClass: 'db.t3.micro',
      //   Engine: 'postgres',
      //   MasterUsername: 'postgres',
      //   MasterUserPassword: generateSecurePassword(),
      //   AllocatedStorage: 20,
      //   // ... outras configurações
      // });
      // const response = await client.send(command);
      
      logger.warn('AWS RDS database provisioning API call not yet implemented - returning mock data');
      logger.warn('Install @aws-sdk/client-rds package to enable AWS RDS provisioning');
      
      // Mock para desenvolvimento - REMOVER quando implementar API real
      return {
        provider: 'aws_rds' as DatabaseProvider,
        host: `${config.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.${region}.rds.amazonaws.com`,
        port: 5432,
        databaseName: 'postgres',
        username: 'postgres',
        password: 'mock_password_' + Math.random().toString(36).substring(7),
        connectionString: `postgresql://postgres:mock_password@mock-rds-host.${region}.rds.amazonaws.com:5432/postgres`,
      };
    } catch (error) {
      logger.error('Error provisioning AWS RDS database:', error);
      throw new Error(`Failed to provision AWS RDS database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deleta database provisionado
   */
  async deleteProvisionedDatabase(
    provider: DatabaseProvider,
    databaseId: string
  ): Promise<void> {
    logger.info(`Deleting ${provider} database: ${databaseId}`);

    switch (provider) {
      case 'railway':
        // TODO: Implementar deleção via Railway API
        // DELETE /v1/services/:serviceId
        logger.warn('Railway database deletion not yet implemented - requires manual deletion');
        throw new Error('Railway database deletion not yet implemented');
      case 'supabase':
        // TODO: Implementar deleção via Supabase Management API
        // DELETE /v1/projects/:projectId
        logger.warn('Supabase database deletion not yet implemented - requires manual deletion');
        throw new Error('Supabase database deletion not yet implemented');
      case 'neon':
        // TODO: Implementar deleção via Neon API
        // DELETE /api/v2/projects/:projectId
        logger.warn('Neon database deletion not yet implemented - requires manual deletion');
        throw new Error('Neon database deletion not yet implemented');
      case 'aws_rds':
        // TODO: Implementar deleção via AWS SDK
        // DeleteDBInstanceCommand do @aws-sdk/client-rds
        logger.warn('AWS RDS database deletion not yet implemented - requires manual deletion');
        throw new Error('AWS RDS database deletion not yet implemented');
      case 'oracle_cloud':
        throw new Error('Oracle Cloud database deletion requires manual action');
      case 'custom':
        throw new Error('Custom database deletion requires manual action');
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Testa conexão com provider
   */
  async testProviderConnection(provider: DatabaseProvider): Promise<boolean> {
    logger.info(`Testing connection to ${provider}`);

    switch (provider) {
      case 'railway':
        // Verificar RAILWAY_API_TOKEN
        return !!process.env.RAILWAY_API_TOKEN;
      case 'supabase':
        // Verificar SUPABASE_API_KEY e SUPABASE_ORG_ID
        return !!(process.env.SUPABASE_API_KEY && process.env.SUPABASE_ORG_ID);
      case 'neon':
        // Verificar NEON_API_KEY
        return !!process.env.NEON_API_KEY;
      case 'aws_rds':
        // Verificar credenciais AWS
        return !!(
          process.env.AWS_RDS_ACCESS_KEY_ID && process.env.AWS_RDS_SECRET_ACCESS_KEY
        );
      case 'oracle_cloud':
        // Verificar configurações SSH
        return !!(
          process.env.ORACLE_CLOUD_SSH_HOST &&
          process.env.ORACLE_CLOUD_SSH_USERNAME &&
          process.env.ORACLE_CLOUD_SSH_KEY_PATH
        );
      default:
        return false;
    }
  }

  /**
   * Executa um comando SSH arbitrário em um servidor
   * @param host - Host do servidor
   * @param port - Porta SSH (padrão: 22)
   * @param username - Usuário SSH
   * @param privateKey - Chave privada SSH
   * @param command - Comando a ser executado
   * @returns Resultado do comando
   */
  async executeSSHCommand(
    host: string,
    port: number,
    username: string,
    privateKey: string,
    command: string
  ): Promise<{ output?: string; error?: string }> {
    logger.info('Executing SSH command', { host, port, username, command: command.substring(0, 50) });

    return new Promise((resolve) => {
      const ssh = new SSHClient();

      let output = '';
      let errorOutput = '';

      ssh.on('ready', () => {
        ssh.exec(command, (err, stream) => {
          if (err) {
            ssh.end();
            resolve({ error: err.message });
            return;
          }

          stream.on('close', (code: number, signal: string) => {
            ssh.end();
            if (code === 0) {
              resolve({ output });
            } else {
              resolve({ error: errorOutput || `Command exited with code ${code}` });
            }
          });

          stream.on('data', (data: Buffer) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data: Buffer) => {
            errorOutput += data.toString();
          });
        });
      });

      ssh.on('error', (err) => {
        logger.error('SSH connection error:', err);
        resolve({ error: err.message });
      });

      ssh.connect({
        host,
        port,
        username,
        privateKey,
        readyTimeout: 30000,
      } as ConnectConfig);
    });
  }
}

