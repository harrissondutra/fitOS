import React from 'react';
import { useImageUpload } from './use-image-upload';
import { toast } from 'sonner';
import { authenticatedApiRequest, API_ENDPOINTS } from '@/lib/api';

export function useLogoUpload() {
  const {
    uploading,
    uploadProgress,
    previewUrls,
    files,
    handleFileSelect,
    upload,
    clearFiles,
  } = useImageUpload({
    uploadType: 'logo',
    entityId: 'temp', // Será substituído pelo tenantId real
    onSuccess: () => {
      toast.success('Logo atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error);
    },
    maxFiles: 1,
    maxSizeMB: 2,
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      handleFileSelect(selectedFiles);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (files.length === 0) {
      throw new Error('Nenhum arquivo selecionado');
    }

    try {
      const formData = new FormData();
      formData.append('logo', files[0]);

      const uploadResponse = await authenticatedApiRequest(API_ENDPOINTS.SETTINGS.UPLOAD_LOGO, {
        method: 'POST',
        headers: {
          // Remove Content-Type para permitir que o browser defina automaticamente para FormData
        },
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        if (uploadResult.success) {
          return uploadResult.data.url;
        }
      }

      throw new Error('Falha no upload do logo');
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  };

  const removeLogo = () => {
    clearFiles();
  };

  const reset = () => {
    clearFiles();
  };

  return {
    logoPreview: previewUrls[0] || null,
    logoFile: files[0] || null,
    uploading,
    uploadProgress,
    handleLogoUpload,
    removeLogo,
    uploadLogo,
    reset,
  };
}
