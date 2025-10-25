'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  onUploadComplete: (url: string) => void;
  onCancel: () => void;
  uploading?: boolean;
  uploadProgress?: number;
}

export function AvatarUpload({
  onUploadComplete,
  onCancel,
  uploading = false,
  uploadProgress = 0,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    // Verificar se há arquivos rejeitados
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('Arquivo muito grande. Máximo 2MB.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Formato não suportado. Use JPG, PNG ou WEBP.');
      } else {
        setError('Arquivo inválido.');
      }
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    multiple: false,
  });

  const handleUpload = () => {
    if (file) {
      // Simular upload - em produção, isso seria feito pelo hook
      onUploadComplete(preview || '');
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    onCancel();
  };

  return (
    <div className="space-y-6">
      {/* Área de drop */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive && "border-primary bg-primary/5",
          error && "border-destructive bg-destructive/5",
          !isDragActive && !error && "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          
          <div>
            <p className="text-lg font-medium">
              {isDragActive ? 'Solte o arquivo aqui' : 'Arraste uma imagem ou clique para selecionar'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG ou WEBP (máximo 2MB)
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <h4 className="font-medium">Preview:</h4>
          <div className="flex justify-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={preview} alt="Preview" />
              <AvatarFallback>Preview</AvatarFallback>
            </Avatar>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Fazendo upload...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleCancel} disabled={uploading}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        
        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="min-w-[120px]"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Enviar Avatar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
