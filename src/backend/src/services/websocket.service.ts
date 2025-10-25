import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  tenantId?: string;
  isAlive?: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();

  /**
   * Inicializa o servidor WebSocket
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      console.log('Nova conexão WebSocket estabelecida');

      // Configura ping/pong para manter conexão viva
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handler para mensagens recebidas
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      });

      // Handler para fechamento da conexão
      ws.on('close', () => {
        if (ws.userId) {
          this.clients.delete(ws.userId);
          console.log(`Cliente ${ws.userId} desconectado`);
        }
      });

      // Handler para erros
      ws.on('error', (error) => {
        console.error('Erro na conexão WebSocket:', error);
      });
    });

    // Ping periódico para manter conexões vivas
    setInterval(() => {
      this.wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 segundos
  }

  /**
   * Processa mensagens recebidas do cliente
   */
  private handleMessage(ws: AuthenticatedWebSocket, message: any): void {
    switch (message.type) {
      case 'authenticate':
        this.handleAuthentication(ws, message);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        console.log('Tipo de mensagem desconhecido:', message.type);
    }
  }

  /**
   * Processa autenticação do cliente
   */
  private handleAuthentication(ws: AuthenticatedWebSocket, message: any): void {
    const { userId, tenantId } = message.data || {};

    if (!userId || !tenantId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'userId e tenantId são obrigatórios'
      }));
      return;
    }

    ws.userId = userId;
    ws.tenantId = tenantId;
    this.clients.set(userId, ws);

    ws.send(JSON.stringify({
      type: 'authenticated',
      message: 'Conexão autenticada com sucesso'
    }));

    console.log(`Cliente ${userId} autenticado no tenant ${tenantId}`);
  }

  /**
   * Envia mensagem para um usuário específico
   */
  async sendToUser(userId: string, message: any): Promise<boolean> {
    const client = this.clients.get(userId);
    
    if (!client || client.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem para usuário:', error);
      return false;
    }
  }

  /**
   * Envia mensagem para todos os usuários de um tenant
   */
  async sendToTenant(tenantId: string, message: any): Promise<number> {
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.tenantId === tenantId && client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error('Erro ao enviar mensagem para tenant:', error);
        }
      }
    });

    return sentCount;
  }

  /**
   * Envia mensagem para todos os usuários conectados
   */
  async broadcast(message: any): Promise<number> {
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error('Erro ao fazer broadcast:', error);
        }
      }
    });

    return sentCount;
  }

  /**
   * Envia notificação em tempo real
   */
  async sendNotification(
    userId: string,
    notification: {
      id: string;
      type: string;
      title: string;
      message: string;
      data?: any;
    }
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      type: 'notification',
      data: notification
    });
  }

  /**
   * Envia atualização de agendamento
   */
  async sendAppointmentUpdate(
    userId: string,
    appointment: any,
    action: 'created' | 'updated' | 'cancelled'
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      type: 'appointment_update',
      data: {
        appointment,
        action
      }
    });
  }

  /**
   * Envia atualização de CRM
   */
  async sendCRMUpdate(
    userId: string,
    entity: any,
    entityType: 'client' | 'task' | 'interaction',
    action: 'created' | 'updated' | 'deleted'
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      type: 'crm_update',
      data: {
        entity,
        entityType,
        action
      }
    });
  }

  /**
   * Envia atualização de bioimpedância
   */
  async sendBioimpedanceUpdate(
    userId: string,
    measurement: any,
    action: 'created' | 'updated' | 'deleted'
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      type: 'bioimpedance_update',
      data: {
        measurement,
        action
      }
    });
  }

  /**
   * Envia atualização de estatísticas
   */
  async sendStatsUpdate(
    userId: string,
    stats: any
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      type: 'stats_update',
      data: stats
    });
  }

  /**
   * Obtém informações sobre clientes conectados
   */
  getConnectedClients(): {
    total: number;
    byTenant: Record<string, number>;
    users: string[];
  } {
    const byTenant: Record<string, number> = {};
    const users: string[] = [];

    this.clients.forEach((client) => {
      if (client.userId && client.tenantId) {
        users.push(client.userId);
        byTenant[client.tenantId] = (byTenant[client.tenantId] || 0) + 1;
      }
    });

    return {
      total: this.clients.size,
      byTenant,
      users
    };
  }

  /**
   * Verifica se um usuário está conectado
   */
  isUserConnected(userId: string): boolean {
    const client = this.clients.get(userId);
    return client ? client.readyState === WebSocket.OPEN : false;
  }

  /**
   * Desconecta um usuário específico
   */
  disconnectUser(userId: string): boolean {
    const client = this.clients.get(userId);
    
    if (client) {
      client.close();
      this.clients.delete(userId);
      return true;
    }

    return false;
  }

  /**
   * Fecha todas as conexões
   */
  close(): void {
    this.wss?.close();
    this.clients.clear();
  }
}

export default new WebSocketService();
