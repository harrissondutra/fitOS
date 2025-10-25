import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { SystemSettings, UserProfileSettings, SocialAccount } from '../../../shared/types/settings';
import { CloudinaryService } from './cloudinary.service';
import { logger } from '../utils/logger';

export class SettingsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Buscar configurações do sistema
   */
  async getSystemSettings(tenantId: string): Promise<SystemSettings> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true }
      });

      if (!tenant) {
        throw new Error('Tenant não encontrado');
      }

      const defaultSettings: SystemSettings = {
        general: {
          companyName: 'FitOS',
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          currency: 'BRL',
        },
        business: {
          defaultMembershipType: 'basic',
          workingHours: { start: '06:00', end: '22:00' },
          autoApproveMembers: false,
        },
        integrations: {
          googleCalendar: false,
          whatsapp: false,
          smtp: false,
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
        },
      };

      const settings = (tenant.settings as any) || {};
      
      return {
        general: { ...defaultSettings.general, ...settings.general },
        business: { ...defaultSettings.business, ...settings.business },
        integrations: { ...defaultSettings.integrations, ...settings.integrations },
        notifications: { ...defaultSettings.notifications, ...settings.notifications },
      };
    } catch (error) {
      logger.error('Error fetching system settings:', error);
      throw error;
    }
  }

  /**
   * Atualizar configurações do sistema
   */
  async updateSystemSettings(tenantId: string, settings: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      const currentSettings = await this.getSystemSettings(tenantId);
      const updatedSettings = { ...currentSettings, ...settings };

      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { settings: updatedSettings }
      });

      logger.info(`System settings updated for tenant ${tenantId}`);
      return updatedSettings;
    } catch (error) {
      logger.error('Error updating system settings:', error);
      throw error;
    }
  }

  /**
   * Buscar configurações de perfil do usuário
   */
  async getUserProfileSettings(userId: string): Promise<UserProfileSettings> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          image: true, // Foto de login social
          profile: true,
        }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const defaultSettings: UserProfileSettings = {
        personalData: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          email: user.email,
        },
        avatar: {
          type: 'initials',
          bgColor: '#3b82f6',
        },
        socialAccounts: [],
        theme: {
          mode: 'light',
          customColors: {
            primary: '#3b82f6',
            secondary: '#10b981',
            accent: '#f59e0b',
          },
        },
        preferences: {
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          notifications: true,
        },
      };

      const profile = user.profile as any || {};
      
      // Se tem foto social, adicionar às contas sociais
      const socialAccounts: SocialAccount[] = [];
      if (user.image) {
        // Determinar provider baseado no email ou outros campos
        const provider = this.detectSocialProvider(user.email, user.image);
        socialAccounts.push({
          provider,
          connected: true,
          email: user.email,
          photoUrl: user.image,
          name: `${user.firstName} ${user.lastName}`.trim(),
        });
      }

      return {
        personalData: { ...defaultSettings.personalData, ...profile.personalData },
        avatar: { ...defaultSettings.avatar, ...profile.avatar },
        socialAccounts: profile.socialAccounts || socialAccounts,
        theme: { ...defaultSettings.theme, ...profile.theme },
        preferences: { ...defaultSettings.preferences, ...profile.preferences },
      };
    } catch (error) {
      logger.error('Error fetching user profile settings:', error);
      throw error;
    }
  }

  /**
   * Atualizar configurações de perfil do usuário
   */
  async updateUserProfileSettings(userId: string, settings: Partial<UserProfileSettings>): Promise<UserProfileSettings> {
    try {
      const currentSettings = await this.getUserProfileSettings(userId);
      const updatedSettings = { ...currentSettings, ...settings };

      // Atualizar dados pessoais no User se necessário
      if (settings.personalData) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            firstName: settings.personalData.firstName,
            lastName: settings.personalData.lastName,
            phone: settings.personalData.phone,
          }
        });
      }

      // Atualizar profile JSON
      await this.prisma.user.update({
        where: { id: userId },
        data: { profile: updatedSettings as any }
      });

      logger.info(`User profile settings updated for user ${userId}`);
      return updatedSettings;
    } catch (error) {
      logger.error('Error updating user profile settings:', error);
      throw error;
    }
  }

  /**
   * Upload de avatar para Cloudinary
   */
  async uploadAvatarToCloudinary(file: any, userId: string): Promise<string> {
    try {
      const result = await CloudinaryService.uploadAvatar(file.buffer, userId);
      
      // Atualizar perfil com nova URL do avatar
      await this.updateUserProfileSettings(userId, {
        avatar: {
          type: 'upload',
          imageUrl: result.url,
        }
      });

      return result.url;
    } catch (error) {
      logger.error('Error uploading avatar to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Sincronizar avatar de login social para Cloudinary
   */
  async syncSocialAvatar(userId: string, provider: 'google' | 'apple' | 'microsoft'): Promise<string> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { image: true, email: true }
      });

      if (!user || !user.image) {
        throw new Error('Foto social não encontrada');
      }

      const result = await CloudinaryService.uploadSocialAvatar(user.image, userId, provider);
      
      // Atualizar perfil com nova URL do avatar
      await this.updateUserProfileSettings(userId, {
        avatar: {
          type: provider,
          imageUrl: result.url,
        }
      });

      return result.url;
    } catch (error) {
      logger.error('Error syncing social avatar:', error);
      throw error;
    }
  }

  /**
   * Upload de logo da empresa para Cloudinary
   */
  async uploadLogoToCloudinary(file: any, tenantId: string): Promise<string> {
    try {
      const result = await CloudinaryService.uploadLogo(file.buffer, tenantId);
      
      // Atualizar configurações do sistema com nova URL do logo
      const currentSettings = await this.getSystemSettings(tenantId);
      await this.updateSystemSettings(tenantId, {
        general: {
          ...currentSettings.general,
          logo: result.url,
        }
      });

      return result.url;
    } catch (error) {
      logger.error('Error uploading logo to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Detectar provider social baseado no email ou URL da imagem
   */
  private detectSocialProvider(email: string, imageUrl: string): 'google' | 'apple' | 'microsoft' {
    if (imageUrl.includes('googleusercontent.com') || imageUrl.includes('googleapis.com')) {
      return 'google';
    }
    
    if (imageUrl.includes('appleid.apple.com') || imageUrl.includes('apple.com')) {
      return 'apple';
    }
    
    if (imageUrl.includes('graph.microsoft.com') || imageUrl.includes('microsoft.com')) {
      return 'microsoft';
    }

    // Fallback para Google se não conseguir detectar
    return 'google';
  }
}
