import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export type UploadType = 'avatar' | 'logo' | 'exercise' | 'workout' | 'gallery' | 'document';

interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

interface UseImageUploadOptions {
  uploadType: UploadType;
  entityId: string;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function useImageUpload({
  uploadType,
  entityId,
  onSuccess,
  onError,
  maxFiles = 1,
  maxSizeMB = 5,
}: UseImageUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  // Validar arquivo
  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Formato não suportado. Use JPG, PNG ou WEBP.';
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Arquivo muito grande. Máximo ${maxSizeMB}MB.`;
    }

    return null;
  }, [maxSizeMB]);

  // Gerar preview da imagem
  const generatePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Processar arquivos selecionados
  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    
    // Validar número de arquivos
    if (fileArray.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} arquivo(s) permitido(s).`);
      return;
    }

    // Validar cada arquivo
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
    }

    // Gerar previews
    try {
      const previews = await Promise.all(fileArray.map(generatePreview));
      setFiles(fileArray);
      setPreviewUrls(previews);
    } catch (error) {
      console.error('Error generating previews:', error);
      toast.error('Erro ao gerar preview das imagens');
    }
  }, [maxFiles, validateFile, generatePreview]);

  // Upload de arquivo único
  const uploadSingleFile = useCallback(async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`/api/upload/${uploadType}/${entityId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erro no upload');
    }

    const result = await response.json();
    return result.data;
  }, [uploadType, entityId]);

  // Upload de múltiplos arquivos
  const uploadMultipleFiles = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });

    const response = await fetch(`/api/upload/${uploadType}/multiple/${entityId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erro no upload múltiplo');
    }

    const result = await response.json();
    return result.data;
  }, [uploadType, entityId]);

  // Executar upload
  const upload = useCallback(async (): Promise<UploadResult | UploadResult[]> => {
    if (files.length === 0) {
      throw new Error('Nenhum arquivo selecionado');
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let result: UploadResult | UploadResult[];

      if (files.length === 1) {
        result = await uploadSingleFile(files[0]);
      } else {
        result = await uploadMultipleFiles(files);
      }

      setUploadProgress(100);
      
      if (onSuccess) {
        if (Array.isArray(result)) {
          result.forEach(r => onSuccess(r));
        } else {
          onSuccess(result);
        }
      }

      toast.success('Upload realizado com sucesso!');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
      console.error('Upload error:', error);
      
      if (onError) {
        onError(errorMessage);
      } else {
        toast.error(errorMessage);
      }
      
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [files, uploadSingleFile, uploadMultipleFiles, onSuccess, onError]);

  // Limpar arquivos
  const clearFiles = useCallback(() => {
    setFiles([]);
    setPreviewUrls([]);
    setUploadProgress(0);
  }, []);

  // Remover arquivo específico
  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    setFiles(newFiles);
    setPreviewUrls(newPreviews);
  }, [files, previewUrls]);

  return {
    // Estado
    uploading,
    uploadProgress,
    previewUrls,
    files,
    
    // Ações
    handleFileSelect,
    upload,
    clearFiles,
    removeFile,
    
    // Utilitários
    validateFile,
    generatePreview,
  };
}


