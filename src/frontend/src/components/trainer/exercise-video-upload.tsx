'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface ExerciseVideoUploadProps {
  exerciseId: string;
  currentVideoUrl?: string;
  onUploadComplete?: (videoUrl: string) => void;
}

export function ExerciseVideoUpload({ 
  exerciseId, 
  currentVideoUrl,
  onUploadComplete 
}: ExerciseVideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentVideoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato de vídeo não suportado. Use MP4, MOV ou WebM');
      return;
    }

    // Validar tamanho (100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Vídeo muito grande. Máximo de 100MB');
      return;
    }

    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await api.post(
        `/api/upload/exercise/${exerciseId}/video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (response.data.success) {
        toast.success('Vídeo enviado com sucesso!');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (onUploadComplete) {
          onUploadComplete(response.data.data.url);
        }
        setPreview(response.data.data.url);
      }
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast.error('Erro ao enviar vídeo');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(currentVideoUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Video className="h-5 w-5" />
          <h3 className="font-semibold">Vídeo Demonstrativo</h3>
        </div>

        {/* Preview do vídeo atual */}
        {preview && (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video 
              src={preview} 
              controls 
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Upload */}
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload"
            disabled={uploading}
          />
          
          <label htmlFor="video-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              {selectedFile ? 'Trocar Vídeo' : 'Adicionar Vídeo'}
            </Button>
          </label>

          {selectedFile && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveFile}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Enviando...' : 'Enviar Vídeo'}
              </Button>
            </>
          )}
        </div>

        {selectedFile && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>
            {uploading && <Progress value={progress} />}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Formatos aceitos: MP4, MOV, WebM. Tamanho máximo: 100MB
        </p>
      </CardContent>
    </Card>
  );
}

