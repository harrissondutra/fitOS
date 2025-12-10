import { useState, useEffect } from 'react';
import { SystemSettings } from '@/shared/types/settings';
import { toast } from 'sonner';
import { authenticatedApiRequest, API_ENDPOINTS } from '@/lib/api';

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      const response = await authenticatedApiRequest(API_ENDPOINTS.SETTINGS.SYSTEM);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar configurações do sistema');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      } else {
        throw new Error(data.error?.message || 'Erro ao buscar configurações');
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast.error('Erro ao carregar configurações do sistema');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (data: Partial<SystemSettings>) => {
    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado');
      }

      const response = await authenticatedApiRequest(API_ENDPOINTS.SETTINGS.SYSTEM, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar configurações do sistema');
      }

      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
        toast.success('Configurações do sistema atualizadas com sucesso');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Erro ao atualizar configurações');
      }
    } catch (error) {
      console.error('Error updating system settings:', error);
      toast.error('Erro ao atualizar configurações do sistema');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []); // Run only once on mount

  return { 
    settings, 
    loading, 
    saving, 
    updateSettings, 
    refetch: fetchSettings 
  };
}
