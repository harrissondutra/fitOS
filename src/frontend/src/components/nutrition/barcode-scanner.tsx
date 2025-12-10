'use client';

/**
 * Barcode Scanner Component - Sprint 7
 * Scanner de código de barras usando Open Food Facts API (GRATUITA)
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Scan, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeResult {
  product: {
    name: string;
    brand?: string;
    barcode: string;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
    };
  };
}

export function BarcodeScanner({ onScanComplete }: { onScanComplete: (product: any) => void }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BarcodeResult | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setScanning(true);
      setError(null);

      const scanner = new Html5Qrcode('barcode-scanner');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          await stopScanning();
          await lookupBarcode(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (normal during scanning)
        }
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar scanner');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    scannerRef.current = null;
    setScanning(false);
  };

  const lookupBarcode = async (barcode: string) => {
    try {
      setError(null);

      // Chamar backend para buscar no Open Food Facts
      const res = await fetch(`/api/nutrition/food/by-barcode?barcode=${barcode}`);
      
      if (!res.ok) {
        throw new Error('Produto não encontrado');
      }

      const data = await res.json();
      setResult(data);
      onScanComplete(data);

    } catch (err: any) {
      setError(err.message || 'Produto não encontrado na base de dados');
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Scanner Viewport */}
          <div
            id="barcode-scanner"
            className="w-full aspect-video bg-black rounded-lg overflow-hidden"
          />

          {/* Controls */}
          <div className="flex gap-2">
            {!scanning ? (
              <Button onClick={startScanning} className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                Iniciar Scanner
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex-1">
                <XCircle className="mr-2 h-4 w-4" />
                Parar Scanner
              </Button>
            )}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Result */}
          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold">{result.product.name}</div>
                <div className="text-sm">
                  {result.product.nutrition.calories}kcal | 
                  P: {result.product.nutrition.protein}g | 
                  C: {result.product.nutrition.carbs}g | 
                  G: {result.product.nutrition.fat}g
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

