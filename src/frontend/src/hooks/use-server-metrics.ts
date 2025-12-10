import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiUrl } from '@/lib/api-url';

export interface ServerHealth {
  cpu?: {
    cores: number;
    model: string;
  };
  loadAvg?: number[];
  memory?: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    availableBytes: number;
  };
  disks?: Array<{
    mountPath: string;
    sizeBytes: number;
    usedBytes: number;
    availableBytes: number;
  }>;
  uptimeSeconds?: number;
  os?: string;
  docker?: {
    serverVersion?: string;
    containers?: {
      running: number;
      paused: number;
      stopped: number;
      total: number;
    };
    images?: number;
  };
}

export interface ServerMetricsUpdate {
  serverId: string;
  health: ServerHealth;
  timestamp: number;
}

export interface ServerMetricsError {
  serverId: string;
  error: string;
}

export function useServerMetrics(serverId: string) {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    // Get WebSocket URL from API URL
    const baseUrl = apiUrl('').replace('/api', '').replace(/\/$/, '');
    
    const socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      setError(null);
      
      // Subscribe to server metrics
      socket.emit('subscribe:server:metrics', { serverId });
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[WebSocket] Connection error:', err);
      setError('Falha ao conectar ao servidor');
      setIsConnected(false);
    });

    socket.on('server:metrics:update', (data: ServerMetricsUpdate) => {
      if (data.serverId === serverId) {
        setHealth(data.health);
        setLastUpdate(data.timestamp);
        setError(null);
      }
    });

    socket.on('server:metrics:error', (data: ServerMetricsError) => {
      if (data.serverId === serverId) {
        setError(data.error);
      }
    });

    socket.on('server:container:action', () => {
      // Container action occurred, could trigger a refresh
      console.log('[WebSocket] Container action detected');
    });

    socket.on('server:image:action', () => {
      // Image action occurred, could trigger a refresh
      console.log('[WebSocket] Image action detected');
    });

    // Keep connection alive
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 25000); // Ping every 25 seconds

    socket.on('pong', () => {
      // Server is alive
    });

    socketRef.current = socket;

    return () => {
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe:server:metrics', { serverId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [serverId]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe:server:metrics', { serverId });
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [serverId]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 100);
  }, [connect, disconnect]);

  return {
    health,
    isConnected,
    error,
    lastUpdate,
    disconnect,
    reconnect,
  };
}







