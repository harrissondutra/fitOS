import { PrismaClient } from '@prisma/client';
type SpotifyConnection = any;
type UserPreferences = any;
import { CacheService } from '../config/redis.cache';
import { SpotifyIntegration } from '../integrations/spotify.integration';
import { UserPlaylist, SpotifyTrack } from '../../../shared/types/sprint6';
import { logger } from '../utils/logger';

export class MusicService {
  private prisma: PrismaClient;
  private cache: CacheService;
  private spotifyIntegration: SpotifyIntegration;

  constructor() {
    this.prisma = new PrismaClient();
    this.cache = new CacheService();
    this.spotifyIntegration = new SpotifyIntegration();
  }

  /**
   * Obter URL de autenticação OAuth
   */
  getAuthUrl(userId: string): string {
    const state = `${userId}_${Date.now()}`;
    return this.spotifyIntegration.getAuthUrl(state);
  }

  /**
   * Conectar conta Spotify
   */
  async connectSpotifyAccount(
    userId: string,
    tenantId: string,
    code: string
  ): Promise<SpotifyConnection> {
    try {
      // Trocar code por tokens
      const tokens = await this.spotifyIntegration.exchangeCodeForToken(code);

      // Obter info do usuário
      const userInfo = await this.spotifyIntegration.getUserInfo(tokens.accessToken);

      // Buscar conexão existente
      // TODO: Implementar quando modelo SpotifyConnection for criado
      const existing = null as any;

      // Calcular expiresAt
      const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

      let connection: SpotifyConnection;

      // TODO: Implementar quando modelos forem criados
      connection = {
        userId,
        spotifyUserId: userInfo.id,
        accessToken: tokens.accessToken
      } as any;

      // Invalidar cache
      await this.cache.del('spotify', `${userId}:*`);

      logger.info('Spotify account connected', { userId, spotifyUserId: userInfo.id });

      return connection;
    } catch (error) {
      logger.error('Error connecting Spotify account:', error);
      throw error;
    }
  }

  /**
   * Desconectar conta Spotify
   */
  async disconnectSpotifyAccount(userId: string, tenantId: string): Promise<void> {
    try {
      // TODO: Implementar quando modelos forem criados
      // await this.prisma.spotifyConnection.delete({ where: { userId } });
      // await this.prisma.userPreferences.update({ where: { userId }, data: { spotifyConnected: false } });

      // Invalidar cache
      await this.cache.del('spotify', `${userId}:*`);

      logger.info('Spotify account disconnected', { userId });
    } catch (error) {
      logger.error('Error disconnecting Spotify account:', error);
      throw error;
    }
  }

  /**
   * Obter playlists do usuário
   */
  async getUserPlaylists(userId: string, tenantId: string): Promise<UserPlaylist[]> {
    try {
      // Cache
      const cacheKey = `${userId}:${tenantId}`;
      const cached = await this.cache.get<UserPlaylist[]>('spotify_playlists', cacheKey);
      if (cached) {
        return cached;
      }

      // Buscar conexão Spotify
      // TODO: Implementar quando modelo for criado
      const connection = null as any;

      if (!connection) {
        throw new Error('Spotify account not connected');
      }

      // TODO: Verificar se token expirou quando modelo for criado
      // Verificar se token expirou
      let accessToken = 'token-placeholder'; // TODO: Obter de connection.accessToken
      if (connection.expiresAt && connection.expiresAt < new Date()) {
        // TODO: Refresh token quando modelo for criado
      }

      // Buscar playlists
      const playlists = await this.spotifyIntegration.getUserPlaylists(accessToken);

      // Cache por 10 minutos
      await this.cache.set('spotify_playlists', cacheKey, playlists, 600);

      return playlists;
    } catch (error) {
      logger.error('Error fetching user playlists:', error);
      throw error;
    }
  }

  /**
   * Buscar playlists
   */
  async searchPlaylists(
    userId: string,
    tenantId: string,
    query: string,
    limit: number = 20
  ): Promise<UserPlaylist[]> {
    try {
      // Buscar conexão Spotify
      // TODO: Implementar quando modelo for criado
      const connection = null as any;

      if (!connection) {
        throw new Error('Spotify account not connected');
      }

      // Verificar se token expirou
      let accessToken = connection.accessToken;
      if (connection.expiresAt < new Date()) {
        const tokens = await this.spotifyIntegration.refreshAccessToken(connection.refreshToken);
        accessToken = tokens.accessToken;
      }

      // Buscar playlists
      const playlists = await this.spotifyIntegration.searchPlaylists(query, limit, accessToken);

      return playlists;
    } catch (error) {
      logger.error('Error searching playlists:', error);
      throw error;
    }
  }

  /**
   * Obter estado da conexão Spotify
   */
  async getConnectionStatus(userId: string, tenantId: string): Promise<{
    connected: boolean;
    spotifyUserId?: string;
    expiresAt?: Date;
  }> {
    try {
      // TODO: Implementar quando modelo spotifyConnection for criado
      // const connection = await this.prisma.spotifyConnection.findUnique({
      //   where: { userId }
      // });

      // if (!connection) {
      //   return { connected: false };
      // }

      // return {
      //   connected: true,
      //   spotifyUserId: connection.spotifyUserId,
      //   expiresAt: connection.expiresAt
      // };
      
      return { connected: false };
    } catch (error) {
      logger.error('Error checking Spotify connection status:', error);
      return { connected: false };
    }
  }
}

