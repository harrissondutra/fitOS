import { useState, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UseExportReturn {
  loading: boolean;
  error: string | null;
  exportData: (type: 'members' | 'workouts' | 'exercises' | 'analytics', format: 'csv' | 'xlsx' | 'pdf') => Promise<void>;
  downloadFile: (url: string, filename: string) => void;
}

export function useExport(): UseExportReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadFile = useCallback((url: string, filename: string): void => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportData = useCallback(async (type: 'members' | 'workouts' | 'exercises' | 'analytics', format: 'csv' | 'xlsx' | 'pdf'): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/export/${type}?format=${format}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      
      downloadFile(url, filename);
      
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [downloadFile]);

  return {
    loading,
    error,
    exportData,
    downloadFile,
  };
}