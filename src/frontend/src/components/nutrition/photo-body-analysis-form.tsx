'use client';

/**
 * Photo Body Analysis Form - Sprint 7
 * Formulário para upload e análise corporal por fotos
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Upload, Loader2, CheckCircle } from 'lucide-react';

interface PhotoAnalysisResult {
  measurement: {
    id: string;
    weight: number;
    height: number;
    bmi: number;
    bodyFatPercentage: number;
    muscleMass: number;
    fatMass: number;
    basalMetabolicRate: number;
  };
  fullAnalysis: {
    bodyComposition: any;
    recommendations: string[];
    confidence: number;
  };
}

export function PhotoBodyAnalysisForm({ clientId }: { clientId: string }) {
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [sidePhoto, setSidePhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async () => {
    if (!frontPhoto || !sidePhoto) {
      setError('Por favor, faça upload de ambas as fotos (frente e lateral)');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // 1. Upload para Cloudinary via backend
      const formData = new FormData();
      formData.append('frontPhoto', frontPhoto);
      formData.append('sidePhoto', sidePhoto);
      formData.append('clientId', clientId);

      const uploadRes = await fetch('/api/upload/bioimpedance-photos', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error('Erro ao fazer upload das fotos');
      }

      const { frontPhotoUrl, sidePhotoUrl } = await uploadRes.json();

      // 2. Analisar com IA
      setAnalyzing(true);
      
      const analysisRes = await fetch('/api/bioimpedance/analyze-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          frontPhotoUrl,
          sidePhotoUrl
        })
      });

      if (!analysisRes.ok) {
        const data = await analysisRes.json();
        
        // Erro 402 = precisa upgrade
        if (analysisRes.status === 402) {
          setError('Upgrade necessário para usar análise por fotos');
          // TODO: Redirect para /nutritionist/upgrade
          return;
        }

        throw new Error(data.error || 'Erro ao analisar fotos');
      }

      const data = await analysisRes.json();
      setResult(data.data);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao processar análise');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Análise Corporal por Fotos (BodyScan AI)
        </CardTitle>
        <CardDescription>
          Faça upload de fotos de frente e lateral para análise automática de composição corporal via IA
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Foto Frente */}
          <div className="space-y-2">
            <Label htmlFor="front-photo">Foto de Frente</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {frontPhoto ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <p className="text-sm text-muted-foreground">{frontPhoto.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Arraste a foto aqui ou clique para selecionar</p>
                </div>
              )}
              <Input
                id="front-photo"
                type="file"
                accept="image/*"
                onChange={(e) => setFrontPhoto(e.target.files?.[0] || null)}
                className="mt-2"
              />
            </div>
          </div>

          {/* Foto Lateral */}
          <div className="space-y-2">
            <Label htmlFor="side-photo">Foto Lateral</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {sidePhoto ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <p className="text-sm text-muted-foreground">{sidePhoto.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Arraste a foto aqui ou clique para selecionar</p>
                </div>
              )}
              <Input
                id="side-photo"
                type="file"
                accept="image/*"
                onChange={(e) => setSidePhoto(e.target.files?.[0] || null)}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Analyze Button */}
        <Button
          onClick={handlePhotoUpload}
          disabled={!frontPhoto || !sidePhoto || uploading || analyzing}
          className="w-full"
          size="lg"
        >
          {(uploading || analyzing) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploading ? 'Fazendo upload...' : 'Analisando com IA...'}
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Analisar Composição Corporal
            </>
          )}
        </Button>

        {/* Results */}
        {result && (
          <div className="mt-6 p-4 border rounded-lg bg-muted">
            <h3 className="font-semibold mb-4">Resultados da Análise</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Peso Estimado</p>
                <p className="text-2xl font-bold">{result.measurement.weight.toFixed(1)} kg</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Altura Estimada</p>
                <p className="text-2xl font-bold">{result.measurement.height.toFixed(0)} cm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IMC</p>
                <p className="text-2xl font-bold">{result.measurement.bmi.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gordura Corporal</p>
                <p className="text-2xl font-bold">{result.measurement.bodyFatPercentage.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Massa Muscular</p>
                <p className="text-2xl font-bold">{result.measurement.muscleMass.toFixed(1)} kg</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TMB</p>
                <p className="text-2xl font-bold">{result.measurement.basalMetabolicRate.toFixed(0)} kcal</p>
              </div>
            </div>

            {/* Recommendations */}
            {result.fullAnalysis.recommendations && result.fullAnalysis.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold mb-2">Recomendações</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.fullAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              Confiança: {result.fullAnalysis.confidence * 100}% - Análise estimada por IA
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




