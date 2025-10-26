import { useState, useEffect } from 'react';
import { UserProfileSettings } from '@/shared/types/settings';
import { toast } from 'sonner';
import { useAuth } from './use-auth';

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

      const response = await fetch('http://localhost:3001/api/settings/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar configurações do perfil');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      } else {
        throw new Error(data.error?.message || 'Erro ao buscar configurações');
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

  const updateSettings = async (data: Partial<UserProfileSettings>) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        // Se não há token, apenas atualizar localmente sem fazer requisição
        setSettings(prev => prev ? { ...prev, ...data } : null);
        toast.success('Configurações atualizadas localmente');
        return data;
      }

      const response = await fetch('http://localhost:3001/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Se a resposta não é OK, verificar se é erro de autenticação
        if (response.status === 401) {
          // Token expirado ou inválido - atualizar localmente
          setSettings(prev => prev ? { ...prev, ...data } : null);
          toast.success('Configurações atualizadas localmente (token expirado)');
          return data;
        }
        throw new Error('Erro ao atualizar configurações do perfil');
      }

      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
        toast.success('Perfil atualizado com sucesso');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Erro ao atualizar configurações');
      }
    } catch (error) {
      console.error('Error updating profile settings:', error);
      
      // Se é erro de rede ou token expirado, atualizar localmente
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('token') ||
        error.message.includes('401')
      )) {
        setSettings(prev => prev ? { ...prev, ...data } : null);
        toast.success('Configurações atualizadas localmente');
        return data;
      }
      
      toast.error('Erro ao atualizar perfil');
      throw error;
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

      const response = await fetch('/api/settings/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload do avatar');
      }

      const result = await response.json();
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
      
      const response = await fetch('/api/settings/profile/avatar/social', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao sincronizar avatar do ${provider}`);
      }

      const result = await response.json();
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
