'use client';

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useSearchParams } from 'next/navigation';

export default function OnboardingStartPage() {
  const searchParams = useSearchParams();
  const initialPlanId = searchParams.get('planId');

  return <OnboardingWizard initialPlanId={initialPlanId || undefined} />;
}

