import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Integração com Microsoft Teams Graph API
 * Documentação: https://learn.microsoft.com/en-us/graph/api/resources/online-meeting
 */
export class TeamsIntegration {
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private accessToken?: string;
  private tokenExpiresAt?: Date;

  constructor() {
    this.clientId = process.env.TEAMS_CLIENT_ID || '';
    this.clientSecret = process.env.TEAMS_CLIENT_SECRET || '';
    this.tenantId = process.env.TEAMS_TENANT_ID || 'common';
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
      const response = await axios.post(
        `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in;
      this.tokenExpiresAt = new Date(Date.now() + (expiresIn - 60) * 1000); // -60 segundos de margem

      return this.accessToken;
    } catch (error: any) {
      logger.error('Error getting Teams access token:', {
        error: error.response?.data || error.message
      });
      throw new Error('Failed to authenticate with Microsoft Teams');
    }
  }

  /**
   * Criar reunião Teams
   */
  async createMeeting(data: {
    subject: string;
    startDateTime: Date;
    endDateTime: Date;
    isOnlineMeeting: boolean;
    joinMeetingIdSettings?: {
      isPublic: boolean;
    };
  }): Promise<{
    meetingId: string;
    meetingPassword: string;
    joinUrl: string;
    startUrl: string;
  }> {
    try {
      const token = await this.getAccessToken();

      const event = {
        subject: data.subject,
        start: {
          dateTime: data.startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: data.endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        isOnlineMeeting: data.isOnlineMeeting || true,
        onlineMeetingProvider: 'teamsForBusiness',
        joinMeetingIdSettings: data.joinMeetingIdSettings || {
          isPublic: true
        }
      };

      const response = await axios.post(
        'https://graph.microsoft.com/v1.0/me/onlineMeetings',
        event,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const meeting = response.data;

      logger.info('Teams meeting created', {
        meetingId: meeting.id,
        subject: meeting.subject
      });

      return {
        meetingId: meeting.id,
        meetingPassword: meeting.participantPassword || '',
        joinUrl: meeting.joinWebUrl,
        startUrl: meeting.joinUrl
      };
    } catch (error: any) {
      logger.error('Error creating Teams meeting:', {
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to create Teams meeting: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Deletar reunião Teams
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();

      await axios.delete(
        `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      logger.info('Teams meeting deleted', { meetingId });
    } catch (error: any) {
      logger.error('Error deleting Teams meeting:', {
        meetingId,
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to delete Teams meeting: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * URL para autenticação OAuth do Microsoft
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: process.env.TEAMS_REDIRECT_URI || 'https://api.fitos.com/api/auth/teams/callback',
      response_mode: 'query',
      scope: 'https://graph.microsoft.com/onlineMeetings.ReadWrite offline_access',
      state: Math.random().toString(36).substring(7)
    });

    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }
}

