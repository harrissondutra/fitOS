import { useState, useEffect } from 'react';
import { initMercadoPago } from '@mercadopago/sdk-react';

/**
 * Hook para inicializar e usar Mercado Pago SDK
 */
export function useMercadoPago() {
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    
    if (!publicKey) {
      console.warn('MERCADOPAGO_PUBLIC_KEY não configurado');
      return;
    }

    try {
      const mp = initMercadoPago(publicKey);
      setMpInstance(mp);
      setIsInitialized(true);
    } catch (error) {
      console.error('Erro ao inicializar Mercado Pago:', error);
    }
  }, []);

  return {
    mp: mpInstance,
    isInitialized
  };
}

