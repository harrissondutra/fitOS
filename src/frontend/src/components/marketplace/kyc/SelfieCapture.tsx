"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, RotateCcw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import * as faceapi from 'face-api.js';

interface SelfieCaptureProps {
  onCapture: (imageData: string) => void;
  onError: (error: string) => void;
  className?: string;
}

export default function SelfieCapture({ onCapture, onError, className }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const loadModels = useCallback(async () => {
    try {
      setError(null);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error('Erro ao carregar modelos face-api.js:', err);
      setError('Erro ao carregar modelos de detecção facial');
      onError('Erro ao carregar modelos de detecção facial');
    }
  }, [onError]);

  useEffect(() => {
    loadModels();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [loadModels, stream]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsStreaming(true);
        startFaceDetection();
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Erro ao acessar câmera. Verifique as permissões.');
      onError('Erro ao acessar câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsStreaming(false);
    setFaceDetected(false);
  };

  const startFaceDetection = () => {
    const detectFaces = async () => {
      if (!videoRef.current || !modelsLoaded) return;

      try {
        const detections = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );

        setFaceDetected(!!detections);
      } catch (err) {
        console.error('Erro na detecção facial:', err);
      }

      if (isStreaming) {
        requestAnimationFrame(detectFaces);
      }
    };

    detectFaces();
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !faceDetected) return;

    try {
      setIsCapturing(true);
      setError(null);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Erro ao obter contexto do canvas');
      }

      // Definir dimensões do canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Desenhar frame do vídeo no canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Verificar se há face na imagem capturada
      const detections = await faceapi.detectSingleFace(
        canvas,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (!detections) {
        throw new Error('Nenhuma face detectada na foto. Tente novamente.');
      }

      // Verificar qualidade da face
      const faceBox = detections.box;
      const faceArea = faceBox.width * faceBox.height;
      const imageArea = canvas.width * canvas.height;
      const faceRatio = faceArea / imageArea;

      if (faceRatio < 0.1) {
        throw new Error('Face muito pequena na foto. Aproxime-se da câmera.');
      }

      // Converter para base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Parar a câmera
      stopCamera();
      
      // Chamar callback com a imagem
      onCapture(imageData);
      
    } catch (err) {
      console.error('Erro ao capturar foto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao capturar foto';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsCapturing(false);
    }
  };

  const retakePhoto = () => {
    setError(null);
    startCamera();
  };

  if (!modelsLoaded) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando modelos de detecção facial...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Captura de Selfie
        </CardTitle>
        <CardDescription>
          Posicione seu rosto na câmera e aguarde a detecção automática
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área da Câmera */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className={`w-full h-64 object-cover ${!isStreaming ? 'hidden' : ''}`}
            playsInline
            muted
          />
          
          {!isStreaming && (
            <div className="w-full h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto mb-2" />
                <p>Câmera não iniciada</p>
              </div>
            </div>
          )}

          {/* Indicador de Face Detectada */}
          {isStreaming && (
            <div className="absolute top-4 right-4">
              {faceDetected ? (
                <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Face Detectada
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
                  <XCircle className="h-4 w-4" />
                  Posicione o Rosto
                </div>
              )}
            </div>
          )}
        </div>

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Alertas */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Instruções */}
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Mantenha o rosto centralizado na câmera</p>
          <p>• Certifique-se de que há boa iluminação</p>
          <p>• Remova óculos escuros ou máscaras</p>
          <p>• Aguarde a detecção automática da face</p>
        </div>

        {/* Botões de Controle */}
        <div className="flex gap-2">
          {!isStreaming ? (
            <Button onClick={startCamera} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Iniciar Câmera
            </Button>
          ) : (
            <>
              <Button 
                onClick={capturePhoto} 
                disabled={!faceDetected || isCapturing}
                className="flex-1"
              >
                {isCapturing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {isCapturing ? 'Capturando...' : 'Capturar Foto'}
              </Button>
              
              <Button onClick={stopCamera} variant="outline">
                <CameraOff className="h-4 w-4 mr-2" />
                Parar
              </Button>
            </>
          )}
        </div>

        {/* Botão de Nova Tentativa */}
        {error && (
          <Button onClick={retakePhoto} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
