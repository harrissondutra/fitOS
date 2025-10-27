import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Integração com Zoom API
 * Documentação: https://marketplace.zoom.us/docs/api-reference/zoom-api
 */
export class ZoomIntegration {
  private apiKey: string;
  private apiSecret: string;
  private accessToken?: string;
  private tokenExpiresAt?: Date;

  constructor() {
    this.apiKey = process.env.ZOOM_API_KEY || '';
    this.apiSecret = process.env.ZOOM_API_SECRET || '';
  }

  /**
   * Obter access token válido
   */
  private async getAccessToken(): Promise<string> {
    // Se token existe e não expirou, retornar
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://zoom.us/oauth/token', null, {
        params: {
          grant_type: 'account_credentials',
          account_id: this.apiKey
        },
        auth: {
          username: this.apiKey || '',
          password: this.apiSecret || ''
        }
      });

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in;
      this.tokenExpiresAt = new Date(Date.now() + (expiresIn - 60) * 1000); // -60 segundos de margem

      return this.accessToken;
    } catch (error) {
      logger.error('Error getting Zoom access token:', error);
      throw new Error('Failed to authenticate with Zoom');
    }
  }

  /**
   * Criar reunião Zoom
   */
  async createMeeting(data: {
    topic: string;
    type: number; // 1 - instant, 2 - scheduled, 3 - recurring, 8 - recurring no fixed time
    startTime?: string; // ISO 8601 format
    duration?: number; // minutes
    timezone?: string;
    password?: string;
    settings?: {
      joinBeforeHost?: boolean;
      waitingRoom?: boolean;
      muteUponEntry?: boolean;
      autoRecording?: string;
    };
  }): Promise<{
    meetingId: string;
    meetingPassword: string;
    joinUrl: string;
    startUrl: string;
  }> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        'https://api.zoom.us/v2/users/me/meetings',
        {
          topic: data.topic,
          type: data.type || 2,
          start_time: data.startTime,
          duration: data.duration || 60,
          timezone: data.timezone || 'America/Sao_Paulo',
          password: data.password || this.generatePassword(),
          settings: {
            join_before_host: data.settings?.joinBeforeHost || false,
            waiting_room: data.settings?.waitingRoom || false,
            mute_upon_entry: data.settings?.muteUponEntry || false,
            auto_recording: data.settings?.autoRecording || 'none',
            meeting_authentication: true,
            authentication_option: 'signInWithEmail'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const meeting = response.data;

      logger.info('Zoom meeting created', {
        meetingId: meeting.id,
        topic: meeting.topic
      });

      return {
        meetingId: meeting.id.toString(),
        meetingPassword: meeting.password,
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url
      };
    } catch (error: any) {
      logger.error('Error creating Zoom meeting:', {
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to create Zoom meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Deletar reunião Zoom
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();

      await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      logger.info('Zoom meeting deleted', { meetingId });
    } catch (error: any) {
      logger.error('Error deleting Zoom meeting:', {
        meetingId,
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to delete Zoom meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Gerar senha aleatória
   */
  private generatePassword(): string {
    return Math.random().toString(36).slice(-8);
  }
}

