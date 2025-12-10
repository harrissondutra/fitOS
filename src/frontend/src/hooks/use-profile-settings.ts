import { useState, useEffect, useRef } from 'react';
import { UserProfileSettings } from '@/shared/types/settings';
import { toast } from 'sonner';
import { useAuth } from './use-auth';
import api from '@/lib/api';

// Circuit breaker para evitar requisições repetidas quando backend está offline
let backendOfflineFlag = false;
let backendOfflineUntil = 0;
const BACKEND_OFFLINE_COOLDOWN = 30000; // 30 segundos

export function useProfileSettings() {
  const [settings, setSettings] = useState<UserProfileSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        // Se não há token, não é um erro - apenas não carrega as configurações
        setLoading(false);
        return;
      }

      const res = await api.get('/api/settings/profile', {
        headers: {
          'X-Tenant-Id': (localStorage.getItem('tenantId') as string) || 'sistema'
        }
      });

      if (res.data?.success) {
        setSettings(res.data.data as UserProfileSettings);
      } else {
        throw new Error(res.data?.error?.message || 'Erro ao buscar configurações');
      }
    } catch (error) {
      console.log('Backend não disponível, usando configurações padrão:', error);
      // Não mostrar erro quando o backend não estiver disponível
      // Apenas usar configurações padrão
      setSettings({
        personalData: {
          firstName: 'Usuário',
          lastName: 'Sistema',
          email: 'usuario@sistema.com',
          phone: ''
        },
        avatar: {
          type: 'initials',
          bgColor: '#3b82f6'
        },
        socialAccounts: [],
        theme: {
          mode: 'light',
          customColors: {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#f59e0b'
          }
        },
        preferences: {
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          notifications: true
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettingsRef = useRef<{ [key: string]: number }>({}); // Debounce por tipo de update
  
  const updateSettings = async (data: Partial<UserProfileSettings>) => {
    // Circuit breaker: evitar requisições se backend está offline
    const now = Date.now();
    if (backendOfflineFlag && now < backendOfflineUntil) {
      // Backend ainda está offline - apenas atualizar localmente silenciosamente
      setSettings(prev => prev ? { ...prev, ...data } : null);
      return data;
    }
    
    // Debounce: evitar múltiplas requisições simultâneas do mesmo tipo
    const dataKey = JSON.stringify(Object.keys(data).sort());
    const lastUpdate = updateSettingsRef.current[dataKey] || 0;
    const DEBOUNCE_MS = 1000; // 1 segundo
    
    if (now - lastUpdate < DEBOUNCE_MS) {
      // Última atualização foi muito recente - atualizar localmente
      setSettings(prev => prev ? { ...prev, ...data } : null);
      return data;
    }
    updateSettingsRef.current[dataKey] = now;
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        // Se não há token, apenas atualizar localmente sem fazer requisição
        setSettings(prev => prev ? { ...prev, ...data } : null);
        return data; // Sem toast para não ser intrusivo
      }

      // Usar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const res = await api.put('/api/settings/profile', data, {
        signal: controller.signal as any,
        headers: {
          'X-Tenant-Id': (localStorage.getItem('tenantId') as string) || 'sistema'
        }
      });

      clearTimeout(timeoutId);
      
      // Reset circuit breaker se requisição foi bem-sucedida
      backendOfflineFlag = false;
      backendOfflineUntil = 0;

      const result = res.data;
      if (result?.success) {
        setSettings(result.data);
        return result.data;
      } else {
        throw new Error(result?.error?.message || 'Erro ao atualizar configurações');
      }
    } catch (error) {
      // Verificar se é erro de rede/offline
      const isNetworkError = error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('NetworkError') ||
        error.name === 'AbortError'
      );
      
      if (isNetworkError) {
        // Ativar circuit breaker
        backendOfflineFlag = true;
        backendOfflineUntil = Date.now() + BACKEND_OFFLINE_COOLDOWN;
        
        // Atualizar localmente silenciosamente (sem toast, sem console.error)
        setSettings(prev => prev ? { ...prev, ...data } : null);
        return data;
      }
      
      // Para outros erros, apenas logar uma vez e atualizar localmente
      if (!(error instanceof Error && error.message.includes('token'))) {
        // Não logar erros de token para evitar spam
        console.debug('Error updating profile settings (non-critical):', error);
      }
      
      // Atualizar localmente
      setSettings(prev => prev ? { ...prev, ...data } : prev);
      return data;
    }
  };

  const uploadAvatar = async (file: File) => {
    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. Máximo 2MB.');
    }
    
    // Validar formato
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Formato não suportado. Use JPG, PNG ou WEBP.');
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/api/settings/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Tenant-Id': (localStorage.getItem('tenantId') as string) || 'sistema'
        }
      });

      const result = response.data;
      if (result.success) {
        // Atualizar settings com nova URL do avatar
        setSettings(prev => prev ? {
          ...prev,
          avatar: {
            ...prev.avatar,
            type: 'upload',
            imageUrl: result.data.avatarUrl,
          }
        } : null);
        
        toast.success('Avatar atualizado com sucesso');
        return result.data.avatarUrl;
      } else {
        throw new Error(result.error?.message || 'Erro ao fazer upload');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload do avatar');
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const setSocialAvatar = async (provider: 'google' | 'apple' | 'microsoft') => {
    try {
      setUploading(true);
      
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }
      
      const response = await api.put('/api/settings/profile/avatar/social', { provider }, {
        headers: {
          'X-Tenant-Id': (localStorage.getItem('tenantId') as string) || 'sistema'
        }
      });

      const result = response.data;
      if (result.success) {
        // Atualizar settings com nova URL do avatar
        setSettings(prev => prev ? {
          ...prev,
          avatar: {
            ...prev.avatar,
            type: provider,
            imageUrl: result.data.avatarUrl,
          }
        } : null);
        
        toast.success(`Avatar do ${provider} sincronizado com sucesso`);
        return result.data.avatarUrl;
      } else {
        throw new Error(result.error?.message || 'Erro ao sincronizar avatar');
      }
    } catch (error) {
      console.error('Error syncing social avatar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao sincronizar avatar');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    // Só buscar configurações se estiver autenticado e não estiver carregando
    if (isAuthenticated && !authLoading) {
      fetchSettings();
    } else if (!isAuthenticated && !authLoading) {
      // Se não estiver autenticado, limpar configurações
      setSettings(null);
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]); // Dependências: isAuthenticated e authLoading

  return { 
    settings, 
    loading, 
    uploading, 
    uploadProgress,
    updateSettings, 
    uploadAvatar, 
    setSocialAvatar,
    refetch: fetchSettings
  };
}
