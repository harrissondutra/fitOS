"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileImage, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Eye,
  Trash2
} from 'lucide-react';
import Image from 'next/image';

interface DocumentUploadProps {
  type: 'rg' | 'cnh' | 'cnpj' | 'selfie';
  onUpload: (file: File, imageData: string) => void;
  onError: (error: string) => void;
  className?: string;
  maxSize?: number; // em MB
  acceptedFormats?: string[];
}

export default function DocumentUpload({ 
  type, 
  onUpload, 
  onError, 
  className,
  maxSize = 5,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}: DocumentUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDocumentInfo = () => {
    switch (type) {
      case 'rg':
        return {
          title: 'Documento de Identidade (RG)',
          description: 'Frente e verso do RG ou CNH',
          instructions: [
            'Tire uma foto nítida do documento',
            'Certifique-se de que todos os dados estão legíveis',
            'Evite reflexos e sombras',
            'Mantenha o documento reto e centralizado'
          ]
        };
      case 'cnh':
        return {
          title: 'Carteira Nacional de Habilitação (CNH)',
          description: 'Frente e verso da CNH',
          instructions: [
            'Tire uma foto nítida da CNH',
            'Certifique-se de que todos os dados estão legíveis',
            'Evite reflexos e sombras',
            'Mantenha o documento reto e centralizado'
          ]
        };
      case 'cnpj':
        return {
          title: 'Documento da Empresa (CNPJ)',
          description: 'Contrato social ou cartão CNPJ',
          instructions: [
            'Tire uma foto nítida do documento',
            'Certifique-se de que todos os dados estão legíveis',
            'Evite reflexos e sombras',
            'Mantenha o documento reto e centralizado'
          ]
        };
      case 'selfie':
        return {
          title: 'Foto de Rosto (Selfie)',
          description: 'Selfie com boa iluminação',
          instructions: [
            'Tire uma selfie com boa iluminação',
            'Mantenha o rosto centralizado',
            'Remova óculos escuros ou máscaras',
            'Olhe diretamente para a câmera'
          ]
        };
      default:
        return {
          title: 'Upload de Documento',
          description: 'Faça upload do documento',
          instructions: []
        };
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!acceptedFormats.includes(file.type)) {
      const errorMsg = `Formato não suportado. Use: ${acceptedFormats.join(', ')}`;
      setError(errorMsg);
      onError(errorMsg);
      return;
    }

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      const errorMsg = `Arquivo muito grande. Máximo: ${maxSize}MB`;
      setError(errorMsg);
      onError(errorMsg);
      return;
    }

    setError(null);
    processFile(file);
  };

  const processFile = (file: File) => {
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setUploadedFile(file);
      onUpload(file, result);
      setIsUploading(false);
    };
    
    reader.onerror = () => {
      const errorMsg = 'Erro ao processar arquivo';
      setError(errorMsg);
      onError(errorMsg);
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect({ target: { files: [file] } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const clearFile = () => {
    setUploadedFile(null);
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const retryUpload = () => {
    clearFile();
    fileInputRef.current?.click();
  };

  const documentInfo = getDocumentInfo();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          {documentInfo.title}
        </CardTitle>
        <CardDescription>
          {documentInfo.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Upload */}
        {!uploadedFile ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Clique para fazer upload ou arraste o arquivo aqui
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Formatos aceitos: {acceptedFormats.join(', ')} • Máximo: {maxSize}MB
            </p>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview da Imagem */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={imagePreview!}
                alt="Preview do documento"
                width={400}
                height={300}
                className="w-full h-64 object-contain"
              />
              
              {/* Overlay com ações */}
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => window.open(imagePreview!, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={clearFile}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Informações do Arquivo */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Arquivo carregado com sucesso</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {uploadedFile.name} • {(uploadedFile.size / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
          </div>
        )}

        {/* Input de Arquivo Oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Alertas */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Instruções */}
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium">Instruções:</p>
          {documentInfo.instructions.map((instruction, index) => (
            <p key={index}>• {instruction}</p>
          ))}
        </div>

        {/* Botões de Ação */}
        {error && (
          <div className="flex gap-2">
            <Button onClick={retryUpload} variant="outline" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button onClick={clearFile} variant="outline" className="flex-1">
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}

        {/* Loading */}
        {isUploading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Processando arquivo...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
