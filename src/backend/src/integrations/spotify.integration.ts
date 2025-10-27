import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Integração com Spotify Web API
 * Documentação: https://developer.spotify.com/documentation/web-api
 */
export class SpotifyIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'https://api.fitos.com/api/auth/spotify/callback';
    this.scopes = (process.env.SPOTIFY_SCOPES || 'user-read-private,user-read-email,playlist-read-private,playlist-read-collaborative,user-top-read').split(',');
  }

  /**
   * URL para autenticação OAuth do Spotify
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state: state,
      show_dialog: 'false'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * Trocar code por access token e refresh token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    scope: string;
  }> {
    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
        scope: response.data.scope
      };
    } catch (error: any) {
      logger.error('Error exchanging Spotify code for token:', {
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to authenticate with Spotify: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
    tokenType: string;
  }> {
    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type
      };
    } catch (error: any) {
      logger.error('Error refreshing Spotify access token:', {
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to refresh Spotify token: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Obter playlists do usuário
   */
  async getUserPlaylists(accessToken: string, userId?: string): Promise<any[]> {
    try {
      const targetUrl = userId
        ? `https://api.spotify.com/v1/users/${userId}/playlists`
        : 'https://api.spotify.com/v1/me/playlists';

      const response = await axios.get(targetUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.items.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        public: playlist.public,
        collaborative: playlist.collaborative,
        owner: playlist.owner.display_name,
        trackCount: playlist.tracks.total,
        imageUrl: playlist.images?.[0]?.url,
        spotifyUri: playlist.uri,
        externalUrl: playlist.external_urls.spotify,
        createdAt: playlist.created_at
      }));
    } catch (error: any) {
      logger.error('Error fetching Spotify playlists:', {
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to fetch playlists: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Buscar playlists
   */
  async searchPlaylists(query: string, limit: number = 20, accessToken?: string): Promise<any[]> {
    try {
      // Se não tem access token, retornar busca pública
      if (!accessToken) {
        return [];
      }

      const response = await axios.get(
        'https://api.spotify.com/v1/search',
        {
          params: {
            q: query,
            type: 'playlist',
            limit: limit
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.playlists.items.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        public: playlist.public,
        owner: playlist.owner.display_name,
        trackCount: playlist.tracks.total,
        imageUrl: playlist.images?.[0]?.url,
        spotifyUri: playlist.uri,
        externalUrl: playlist.external_urls.spotify
      }));
    } catch (error: any) {
      logger.error('Error searching Spotify playlists:', {
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to search playlists: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Obter informações do usuário
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string;
    displayName: string;
    email: string;
    country: string;
    followers: number;
    imageUrl?: string;
  }> {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        id: response.data.id,
        displayName: response.data.display_name,
        email: response.data.email,
        country: response.data.country,
        followers: response.data.followers?.total || 0,
        imageUrl: response.data.images?.[0]?.url
      };
    } catch (error: any) {
      logger.error('Error fetching Spotify user info:', {
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to fetch user info: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

