import { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function useStripe() {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initializeStripe() {
      try {
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
          throw new Error('Stripe publishable key not found');
        }

        // Inicializar Stripe apenas uma vez
        if (!stripePromise) {
          stripePromise = loadStripe(publishableKey);
        }

        const stripeInstance = await stripePromise;
        setStripe(stripeInstance);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize Stripe'));
      } finally {
        setIsLoading(false);
      }
    }

    initializeStripe();
  }, []);

  return {
    stripe,
    isLoading,
    error
  };
}

