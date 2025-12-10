import { Client, ConnectConfig } from 'ssh2';
import { createServer, Server } from 'net';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/logger';
import { EncryptionService } from './encryption.service';

export interface SSHTunnelConfig {
  sshHost: string;
  sshPort: number;
  sshUsername: string;
  sshKey: string; // Chave privada descriptografada ou path
  localPort?: number;
  remoteHost: string;
  remotePort: number;
}

export interface Tunnel {
  id: string;
  config: SSHTunnelConfig;
  server: Server;
  sshClient: Client;
  localPort: number;
  isActive: boolean;
  lastUsed: Date;
  reconnectAttempts: number;
}

/**
 * Serviço para gerenciar túneis SSH persistentes
 * Usado para conexões Oracle Cloud e outros providers que exigem SSH tunneling
 */
export class SSHTunnelService {
  private tunnels: Map<string, Tunnel> = new Map();
  private encryptionService: EncryptionService;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000; // 5 segundos (base)
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.encryptionService = new EncryptionService();
    this.startHealthCheck();
    logger.info('SSHTunnelService initialized');
  }

  /**
   * Cria ou reutiliza um túnel SSH
   */
  async getTunnel(tunnelId: string, config: SSHTunnelConfig): Promise<Tunnel> {
    // Verificar se túnel já existe e está ativo
    const existingTunnel = this.tunnels.get(tunnelId);
    if (existingTunnel && existingTunnel.isActive) {
      existingTunnel.lastUsed = new Date();
      return existingTunnel;
    }

    // Se existe mas está inativo, fechar e recriar
    if (existingTunnel) {
      await this.closeTunnel(tunnelId);
    }

    // Criar novo túnel
    return await this.createTunnel(tunnelId, config);
  }

  /**
   * Cria um novo túnel SSH
   */
  private async createTunnel(tunnelId: string, config: SSHTunnelConfig): Promise<Tunnel> {
    return new Promise(async (resolve, reject) => {
      const sshClient = new Client();
      const server = createServer((localConnection) => {
        sshClient.forwardOut(
          localConnection.remoteAddress!,
          localConnection.remotePort!,
          config.remoteHost,
          config.remotePort,
          (err, sshConnection) => {
            if (err) {
              localConnection.end();
              logger.error('SSH forward error:', err);
              return;
            }

            localConnection.pipe(sshConnection);
            sshConnection.pipe(localConnection);
          }
        );
      });

      // Preparar e validar chave SSH antes de iniciar o servidor
      let keyContent: string;
      try {
        // Se sshKey é um path (começa com / ou ./ ou ../), ler arquivo
        if (config.sshKey.startsWith('/') || config.sshKey.startsWith('./') || config.sshKey.startsWith('../')) {
          // Validação básica de extensão e permissões
          const keyPath = path.resolve(config.sshKey);
          keyContent = await fs.readFile(keyPath, 'utf8');
          // Em *nix, sugerir permissão 600 (não forçar no Windows)
          try {
            const stat = await fs.stat(keyPath);
            if ((stat as any).mode && ((stat as any).mode & 0o077)) {
              logger.warn(`SSH key permissions are too open for ${keyPath}. Recommended: 600`);
            }
          } catch (permErr) {
            // Apenas loga
            logger.debug('Could not stat SSH key file for permission check:', permErr);
          }
        } else {
          // Caso contrário, assume que é o conteúdo da chave já descriptografado
          keyContent = config.sshKey;
        }
      } catch (error) {
        logger.error(`Failed to read SSH key for tunnel ${tunnelId}:`, error);
        reject(error);
        return;
      }

      const sshConfig: ConnectConfig = {
        host: config.sshHost,
        port: config.sshPort,
        username: config.sshUsername,
        privateKey: keyContent,
        readyTimeout: 20000,
      };

      // Encontrar porta local disponível
      server.listen(config.localPort || 0, () => {
        const localPort = (server.address() as any).port;
        
        // keepalive e reconexão cooperativa
        (sshClient as any).config = (sshClient as any).config || {};
        sshClient.connect({
          ...sshConfig,
          keepaliveInterval: 10000,
          keepaliveCountMax: 3,
        } as any);

            sshClient.on('ready', () => {
              logger.info(`SSH tunnel ready: ${tunnelId} (local:${localPort} -> ${config.sshHost}:${config.remoteHost}:${config.remotePort})`);
              
              const tunnel: Tunnel = {
                id: tunnelId,
                config,
                server,
                sshClient,
                localPort,
                isActive: true,
                lastUsed: new Date(),
                reconnectAttempts: 0,
              };

              this.tunnels.set(tunnelId, tunnel);
              resolve(tunnel);
            });

            sshClient.on('error', (err) => {
              logger.error(`SSH connection error for tunnel ${tunnelId}:`, err);
              // Se erro ocorrer antes de ready, rejeita criação
              const tunnel = this.tunnels.get(tunnelId);
              if (!tunnel) {
                reject(err);
              }
            });

            sshClient.on('close', () => {
              logger.warn(`SSH tunnel closed: ${tunnelId}`);
              const tunnel = this.tunnels.get(tunnelId);
              if (tunnel) {
                tunnel.isActive = false;
                this.attemptReconnect(tunnel);
              }
            });
      });

      server.on('error', (err) => {
        logger.error('SSH tunnel server error:', err);
        reject(err);
      });
    });
  }

  /**
   * Fecha um túnel SSH
   */
  async closeTunnel(tunnelId: string): Promise<void> {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel) {
      return;
    }

    try {
      if (tunnel.sshClient) {
        tunnel.sshClient.end();
      }
      if (tunnel.server) {
        tunnel.server.close();
      }
      this.tunnels.delete(tunnelId);
      logger.info(`SSH tunnel closed: ${tunnelId}`);
    } catch (error) {
      logger.error(`Error closing tunnel ${tunnelId}:`, error);
    }
  }


  /**
   * Tenta reconectar um túnel que foi desconectado
   */
  private async attemptReconnect(tunnel: Tunnel): Promise<void> {
    if (tunnel.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`Max reconnect attempts reached for tunnel ${tunnel.id}`);
      this.tunnels.delete(tunnel.id);
      return;
    }

    tunnel.reconnectAttempts++;
    const delay = this.reconnectDelay * tunnel.reconnectAttempts; // Backoff exponencial

    logger.info(`Attempting to reconnect tunnel ${tunnel.id} (attempt ${tunnel.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.createTunnel(tunnel.id, tunnel.config);
      } catch (error) {
        logger.error(`Reconnection failed for tunnel ${tunnel.id}:`, error);
        // Tentar novamente
        if (tunnel.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(tunnel);
        }
      }
    }, delay);
  }

  /**
   * Health check periódico para túneis
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.tunnels.forEach(async (tunnel, tunnelId) => {
        // Verificar se túnel está inativo há muito tempo (30 minutos)
        const inactiveTime = Date.now() - tunnel.lastUsed.getTime();
        const maxInactiveTime = 30 * 60 * 1000; // 30 minutos

        if (inactiveTime > maxInactiveTime && tunnel.isActive) {
          logger.info(`Closing inactive tunnel: ${tunnelId}`);
          await this.closeTunnel(tunnelId);
        }

        // Verificar se conexão SSH ainda está ativa
        if (tunnel.isActive && tunnel.sshClient) {
          // Se o socket estiver encerrado, marcar como inativo
          const anyClient = tunnel.sshClient as any;
          if (anyClient._sock && anyClient._sock.destroyed) {
            tunnel.isActive = false;
            this.attemptReconnect(tunnel);
          }
        }
      });
    }, 5 * 60 * 1000); // A cada 5 minutos
  }

  /**
   * Fecha todos os túneis e limpa recursos
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    const closePromises = Array.from(this.tunnels.keys()).map(tunnelId =>
      this.closeTunnel(tunnelId)
    );

    await Promise.all(closePromises);
    logger.info('SSHTunnelService shutdown complete');
  }

  /**
   * Lista todos os túneis ativos
   */
  getActiveTunnels(): Array<{ id: string; localPort: number; isActive: boolean }> {
    return Array.from(this.tunnels.values()).map(tunnel => ({
      id: tunnel.id,
      localPort: tunnel.localPort,
      isActive: tunnel.isActive,
    }));
  }
}

