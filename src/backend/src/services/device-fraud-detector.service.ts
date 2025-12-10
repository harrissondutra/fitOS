/**
 * Device Fraud Detector Service
 * 
 * Detecta padrões suspeitos de uso fraudulento de dispositivos
 * Previne compartilhamento de senhas e uso simultâneo excessivo
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';

const prisma = getPrismaClient();

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  platform: string;
  screenResolution: string;
  touchSupport: boolean;
  userAgent: string;
}

export interface FraudDetectionResult {
  isFraud: boolean;
  confidence: number; // 0-100
  reasons: string[];
  recommendedAction: 'ALLOW' | 'WARN' | 'BLOCK';
}

export class DeviceFraudDetectorService {
  /**
   * Detectar padrões suspeitos no uso de dispositivos
   */
  async detectFraud(
    userId: string,
    newDevice: DeviceInfo
  ): Promise<FraudDetectionResult> {
    const reasons: string[] = [];
    let confidence = 0;

    // 1. Buscar histórico de dispositivos do usuário
    const deviceHistory = await this.getDeviceHistory(userId);
    
    // 2. Verificar padrões suspeitos
    const checks = [
      this.checkMultipleDesktops(deviceHistory, newDevice),
      await this.checkRapidDeviceChanges(deviceHistory),
      this.checkInconsistentPlatforms(deviceHistory, newDevice),
      this.checkExcessiveDeviceCount(deviceHistory),
    ];

    for (const check of checks) {
      if (check.isFraud) {
        reasons.push(check.reason);
        confidence += check.confidence;
      }
    }

    // 3. Determinar ação recomendada
    const recommendedAction = this.getRecommendedAction(confidence, reasons);

    return {
      isFraud: confidence >= 50,
      confidence: Math.min(100, confidence),
      reasons,
      recommendedAction
    };
  }

  /**
   * Verificar se múltiplos desktops estão sendo usados (sinal de compartilhamento)
   */
  private checkMultipleDesktops(
    history: any[],
    newDevice: DeviceInfo
  ): { isFraud: boolean; confidence: number; reason: string } {
    // Se novo device é desktop
    if (newDevice.deviceType !== 'desktop') {
      return { isFraud: false, confidence: 0, reason: '' };
    }

    // Contar quantos desktops já estão ativos
    const activeDesktops = history.filter(s => s.deviceInfo?.deviceType === 'desktop');
    
    if (activeDesktops.length >= 2) {
      return {
        isFraud: true,
        confidence: 30,
        reason: `${activeDesktops.length + 1} computadores desktop simultâneos detectados (limite sugerido: 2)`
      };
    }

    return { isFraud: false, confidence: 0, reason: '' };
  }

  /**
   * Verificar mudanças rápidas de dispositivo (troca constante = suspeito)
   */
  private async checkRapidDeviceChanges(history: any[]): Promise<{
    isFraud: boolean;
    confidence: number;
    reason: string;
  }> {
    if (history.length < 3) {
      return { isFraud: false, confidence: 0, reason: '' };
    }

    // Ordenar por criação
    const sorted = history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Verificar se múltiplos logins em < 1 hora
    const recentLogins = sorted.filter(s => {
      const diff = Date.now() - new Date(s.createdAt).getTime();
      return diff < 60 * 60 * 1000; // 1 hora
    });

    if (recentLogins.length >= 4) {
      return {
        isFraud: true,
        confidence: 25,
        reason: `${recentLogins.length} logins em dispositivos diferentes em menos de 1 hora`
      };
    }

    return { isFraud: false, confidence: 0, reason: '' };
  }

  /**
   * Verificar plataformas inconsistentes
   */
  private checkInconsistentPlatforms(
    history: any[],
    newDevice: DeviceInfo
  ): { isFraud: boolean; confidence: number; reason: string } {
    if (history.length === 0) {
      return { isFraud: false, confidence: 0, reason: '' };
    }

    // Buscar platform mais usada
    const platforms = history.map(h => h.deviceInfo?.platform).filter(Boolean);
    const mostCommonPlatform = platforms.reduce((acc, platform) => {
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const platformsList = Object.entries(mostCommonPlatform) as Array<[string, number]> ;
    platformsList.sort((a, b) => (b[1] as number) - (a[1] as number));
    const dominantPlatform = platformsList[0]?.[0];

    // Se novo device é de platform diferente e é desktop
    if (newDevice.platform !== dominantPlatform && newDevice.deviceType === 'desktop') {
      // Múltiplos desktops com OSs diferentes = compartilhamento
      const differentOSDesktops = history.filter(
        h => h.deviceInfo?.deviceType === 'desktop' && 
             h.deviceInfo?.platform !== dominantPlatform
      );

      if (differentOSDesktops.length > 0) {
        return {
          isFraud: true,
          confidence: 20,
          reason: `Uso de desktops com sistemas operacionais diferentes (${dominantPlatform} vs ${newDevice.platform})`
        };
      }
    }

    return { isFraud: false, confidence: 0, reason: '' };
  }

  /**
   * Verificar quantidade excessiva de dispositivos
   */
  private checkExcessiveDeviceCount(history: any[]): {
    isFraud: boolean;
    confidence: number;
    reason: string;
  } {
    // Agrupar por tipo de dispositivo
    const deviceGroups = {
      desktop: history.filter(h => h.deviceInfo?.deviceType === 'desktop').length,
      mobile: history.filter(h => h.deviceInfo?.deviceType === 'mobile').length,
      tablet: history.filter(h => h.deviceInfo?.deviceType === 'tablet').length,
    };

    const total = history.length;

    // Se mais de 4 desktops ativos
    if (deviceGroups.desktop > 4) {
      return {
        isFraud: true,
        confidence: 40,
        reason: `${deviceGroups.desktop} computadores desktop simultâneos (suspeito de compartilhamento em massa)`
      };
    }

    // Se muito mais dispositivos do que esperado
    if (total > 6) {
      return {
        isFraud: true,
        confidence: 30,
        reason: `${total} dispositivos diferentes simultâneos (extremamente suspeito)`
      };
    }

    return { isFraud: false, confidence: 0, reason: '' };
  }

  /**
   * Obter histórico de dispositivos do usuário
   */
  private async getDeviceHistory(userId: string) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await prisma.session.findMany({
      where: {
        userId,
        createdAt: { gte: oneDayAgo },
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  /**
   * Determinar ação recomendada baseado na confiança
   */
  private getRecommendedAction(
    confidence: number,
    reasons: string[]
  ): 'ALLOW' | 'WARN' | 'BLOCK' {
    if (confidence >= 70) {
      return 'BLOCK';
    }
    
    if (confidence >= 50) {
      return 'WARN';
    }
    
    return 'ALLOW';
  }

  /**
   * Verificar se é padrão legítimo de uso
   * 
   * Padrões legítimos:
   * - Mobile + Desktop (usuário alternando dispositivos)
   * - Mesmo desktop repetidamente (trabalho de casa)
   * - Tablet ocasional (trabalho remoto)
   */
  isLegitimateUse(history: any[], newDevice: DeviceInfo): boolean {
    // Se é o primeiro login
    if (history.length === 0) {
      return true;
    }

    // Contar tipos de dispositivos
    const deviceCount = {
      mobile: history.filter(h => h.deviceInfo?.deviceType === 'mobile').length,
      desktop: history.filter(h => h.deviceInfo?.deviceType === 'desktop').length,
      tablet: history.filter(h => h.deviceInfo?.deviceType === 'tablet').length,
    };

    // Mobile + Desktop = padrão legítimo
    if (newDevice.deviceType === 'mobile' && deviceCount.desktop === 1) {
      return true;
    }

    if (newDevice.deviceType === 'desktop' && deviceCount.mobile === 1) {
      return true;
    }

    // Mesmo desktop repetido = legítimo
    if (newDevice.deviceType === 'desktop') {
      const sameDesktop = history.find(h =>
        h.deviceInfo?.platform === newDevice.platform &&
        h.deviceInfo?.screenResolution === newDevice.screenResolution
      );
      
      if (sameDesktop) {
        return true;
      }
    }

    // Se já tem muitos dispositivos do mesmo tipo
    if (deviceCount[newDevice.deviceType as keyof typeof deviceCount] >= 2) {
      return false;
    }

    return true;
  }
}

export const deviceFraudDetector = new DeviceFraudDetectorService();




