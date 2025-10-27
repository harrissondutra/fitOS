import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Integração com Google Calendar API (para criar reuniões do Meet)
 * Documentação: https://developers.google.com/calendar
 */
export class GoogleMeetIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private accessToken?: string;
  private refreshToken?: string;

  constructor() {
    this.clientId = process.env.GOOGLE_MEET_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_MEET_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_MEET_REDIRECT_URI || 'https://api.fitos.com/api/auth/google-meet/callback';
  }

  /**
   * Obter access token (usar refresh token se disponível)
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    // Se não tem access token, retornar erro
    throw new Error('Google Meet access token not available. User needs to authenticate.');
  }

  /**
   * Criar reunião Google Meet
   * Google Meet é criado automaticamente quando você cria um evento no Calendar com meet URL
   */
  async createMeeting(data: {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
  }): Promise<{
    meetingId: string;
    meetingPassword: string;
    joinUrl: string;
    startUrl: string;
  }> {
    try {
      const token = await this.getAccessToken();

      const event = {
        summary: data.summary,
        description: data.description || '',
        start: {
          dateTime: data.startTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: data.endTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        attendees: data.attendees?.map(email => ({ email })) || [],
        conferenceData: {
          createRequest: {
            requestId: Math.random().toString(36).substring(7),
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      };

      const response = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        event,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const meeting = response.data;
      const meetUrl = meeting.conferenceData?.entryPoints?.[0]?.uri || meeting.hangoutLink;

      logger.info('Google Meet meeting created', {
        eventId: meeting.id,
        summary: meeting.summary
      });

      return {
        meetingId: meeting.id,
        meetingPassword: '', // Google Meet não usa senha
        joinUrl: meetUrl,
        startUrl: meetUrl
      };
    } catch (error: any) {
      logger.error('Error creating Google Meet meeting:', {
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to create Google Meet meeting: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Deletar reunião Google Meet
   */
  async deleteMeeting(eventId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();

      await axios.delete(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      logger.info('Google Meet meeting deleted', { eventId });
    } catch (error: any) {
      logger.error('Error deleting Google Meet meeting:', {
        eventId,
        error: error.response?.data || error.message
      });
      throw new Error(`Failed to delete Google Meet meeting: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * URL para autenticação OAuth do Google
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}

