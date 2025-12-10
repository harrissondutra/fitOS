import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';

const prisma = getPrismaClient();

export interface GoogleCalendarEvent {
  id?: string;
  title: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export class GoogleCalendarService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_ID,
      process.env.GOOGLE_OAUTH_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Gerar URL de autorização
  getAuthUrl(userId: string, tenantId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: JSON.stringify({ userId, tenantId })
    });
  }

  // Processar callback de autorização
  async handleCallback(code: string, state: string): Promise<{ success: boolean; message: string }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      const stateData = JSON.parse(state);
      
      await prisma.googleCalendarToken.upsert({
        where: {
          userId_tenantId: {
            userId: stateData.userId,
            tenantId: stateData.tenantId
          }
        },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(tokens.expiry_date),
          scope: tokens.scope
        },
        create: {
          userId: stateData.userId,
          tenantId: stateData.tenantId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(tokens.expiry_date),
          scope: tokens.scope
        }
      });

      return { success: true, message: 'Google Calendar conectado com sucesso!' };
    } catch (error) {
      console.error('Erro ao processar callback do Google Calendar:', error);
      return { success: false, message: 'Erro ao conectar Google Calendar' };
    }
  }

  // Obter token válido
  private async getValidToken(userId: string, tenantId: string): Promise<string | null> {
    const tokenData = await prisma.googleCalendarToken.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      }
    });

    if (!tokenData) {
      return null;
    }

    // Verificar se o token expirou
    if (tokenData.expiresAt && tokenData.expiresAt <= new Date()) {
      if (tokenData.refreshToken) {
        // Tentar renovar o token
        this.oauth2Client.setCredentials({
          refresh_token: tokenData.refreshToken
        });

        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          const refreshedToken = await prisma.googleCalendarToken.findUnique({
            where: { id: tokenData.id }
          });

          if (refreshedToken) {
            await prisma.googleCalendarToken.update({
              where: { id: tokenData.id },
              data: {
                accessToken: credentials.access_token,
                expiresAt: new Date(credentials.expiry_date)
              }
            });
            return credentials.access_token;
          }
        } catch (error) {
          console.error('Erro ao renovar token:', error);
          return null;
        }
      }
      return null;
    }

    return tokenData.accessToken;
  }

  // Criar evento no Google Calendar
  async createEvent(
    userId: string,
    tenantId: string,
    event: GoogleCalendarEvent
  ): Promise<{ success: boolean; eventId?: string; message: string }> {
    try {
      const accessToken = await this.getValidToken(userId, tenantId);
      if (!accessToken) {
        return { success: false, message: 'Token do Google Calendar não encontrado ou expirado' };
      }

      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });

      return {
        success: true,
        eventId: response.data.id || undefined,
        message: 'Evento criado com sucesso no Google Calendar'
      };
    } catch (error) {
      console.error('Erro ao criar evento no Google Calendar:', error);
      return { success: false, message: 'Erro ao criar evento no Google Calendar' };
    }
  }

  // Atualizar evento no Google Calendar
  async updateEvent(
    userId: string,
    tenantId: string,
    eventId: string,
    event: GoogleCalendarEvent
  ): Promise<{ success: boolean; message: string }> {
    try {
      const accessToken = await this.getValidToken(userId, tenantId);
      if (!accessToken) {
        return { success: false, message: 'Token do Google Calendar não encontrado ou expirado' };
      }

      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event
      });

      return { success: true, message: 'Evento atualizado com sucesso no Google Calendar' };
    } catch (error) {
      console.error('Erro ao atualizar evento no Google Calendar:', error);
      return { success: false, message: 'Erro ao atualizar evento no Google Calendar' };
    }
  }

  // Deletar evento do Google Calendar
  async deleteEvent(
    userId: string,
    tenantId: string,
    eventId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const accessToken = await this.getValidToken(userId, tenantId);
      if (!accessToken) {
        return { success: false, message: 'Token do Google Calendar não encontrado ou expirado' };
      }

      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      return { success: true, message: 'Evento deletado com sucesso do Google Calendar' };
    } catch (error) {
      console.error('Erro ao deletar evento do Google Calendar:', error);
      return { success: false, message: 'Erro ao deletar evento do Google Calendar' };
    }
  }

  // Sincronizar agendamentos com Google Calendar
  async syncAppointments(userId: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    try {
      const accessToken = await this.getValidToken(userId, tenantId);
      if (!accessToken) {
        return { success: false, message: 'Token do Google Calendar não encontrado ou expirado' };
      }

      // Buscar agendamentos que precisam ser sincronizados
      const appointments = await prisma.appointment.findMany({
        where: {
          tenantId,
          professionalId: userId,
          googleCalendarSynced: false
        },
        include: {
          client: true
        }
      });

      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      for (const appointment of appointments) {
        try {
          const event: GoogleCalendarEvent = {
            title: appointment.title,
            description: appointment.description || '',
            start: {
              dateTime: appointment.scheduledAt.toISOString(),
              timeZone: 'America/Sao_Paulo'
            },
            end: {
              dateTime: new Date(appointment.scheduledAt.getTime() + appointment.duration * 60000).toISOString(),
              timeZone: 'America/Sao_Paulo'
            },
            location: appointment.location || undefined,
            attendees: [
              {
                email: appointment.client.email || 'cliente@exemplo.com',
                displayName: appointment.client.name
              }
            ]
          };

          const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event
          });

          // Atualizar agendamento com ID do evento do Google
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              googleEventId: response.data.id,
              googleCalendarSynced: true
            }
          });
        } catch (error) {
          console.error(`Erro ao sincronizar agendamento ${appointment.id}:`, error);
        }
      }

      return { success: true, message: `${appointments.length} agendamentos sincronizados` };
    } catch (error) {
      console.error('Erro ao sincronizar agendamentos:', error);
      return { success: false, message: 'Erro ao sincronizar agendamentos' };
    }
  }

  // Obter eventos do Google Calendar
  async getCalendarEvents(
    userId: string,
    tenantId: string,
    timeMin?: Date,
    timeMax?: Date
  ): Promise<{ success: boolean; events?: any[]; message: string }> {
    try {
      const accessToken = await this.getValidToken(userId, tenantId);
      if (!accessToken) {
        return { success: false, message: 'Token do Google Calendar não encontrado ou expirado' };
      }

      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return {
        success: true,
        events: response.data.items || [],
        message: 'Eventos obtidos com sucesso'
      };
    } catch (error) {
      console.error('Erro ao obter eventos do Google Calendar:', error);
      return { success: false, message: 'Erro ao obter eventos do Google Calendar' };
    }
  }
}