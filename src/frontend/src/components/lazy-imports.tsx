/**
 * Lazy Imports - Sprint 7 Otimizações
 * Code splitting e lazy loading para melhor performance
 */

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

// Loading fallback padrão
const DefaultLoading = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// ============================================================================
// NUTRITION COMPONENTS (Heavy components - lazy load)
// ============================================================================

// Photo Body Analysis Form
export const LazyPhotoBodyAnalysisForm = dynamic(
  () => import('@/components/nutrition/photo-body-analysis-form').then(mod => ({ default: mod.PhotoBodyAnalysisForm })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    ),
    ssr: false // Client-side only
  }
);

// Barcode Scanner
export const LazyBarcodeScanner = dynamic(
  () => import('@/components/nutrition/barcode-scanner').then(mod => ({ default: mod.BarcodeScanner })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
    ssr: false
  }
);

// ============================================================================
// CHART COMPONENTS (Heavy libraries - lazy load)
// ============================================================================

// Dashboard Charts
export const LazyDashboardCharts = dynamic(
  () => import('@/components/dashboard/charts'),
  {
    loading: () => <div className="h-[400px] bg-muted animate-pulse rounded-lg" />,
    ssr: false
  }
);

// Progress Charts
export const LazyProgressCharts = dynamic(
  () => import('@/components/client/progress-charts'),
  {
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded-lg" />,
    ssr: false
  }
);

// ============================================================================
// WORKOUT COMPONENTS (Feature heavy - lazy load)
// ============================================================================

// Workout Builder
export const LazyWorkoutBuilder = dynamic(
  () => import('@/components/workouts/workout-builder'),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
    ssr: false
  }
);

// Exercise Library
export const LazyExerciseLibrary = dynamic(
  () => import('@/components/workouts/exercise-library'),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    ),
    ssr: false
  }
);

// ============================================================================
// BIOMETRIC COMPONENTS (Heavy data processing - lazy load)
// ============================================================================

// Bioimpedance Chart
export const LazyBioimpedanceChart = dynamic(
  () => import('@/components/biometrics/bioimpedance-chart'),
  {
    loading: () => <div className="h-[400px] bg-muted animate-pulse rounded-lg" />,
    ssr: false
  }
);

// ============================================================================
// CRM COMPONENTS (Heavy data - lazy load)
// ============================================================================

// CRM Kanban
export const LazyCrmKanban = dynamic(
  () => import('@/components/crm/kanban-board'),
  {
    loading: () => (
      <div className="flex gap-4">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-96 w-80" />
        ))}
      </div>
    ),
    ssr: false
  }
);

// ============================================================================
// SETTINGS COMPONENTS (Heavy forms - lazy load)
// ============================================================================

// AI Settings
export const LazyAISettings = dynamic(
  () => import('@/components/settings/ai-settings'),
  {
    loading: () => <DefaultLoading />,
    ssr: false
  }
);

// Billing Settings
export const LazyBillingSettings = dynamic(
  () => import('@/components/settings/billing-settings'),
  {
    loading: () => <DefaultLoading />,
    ssr: false
  }
);

// ============================================================================
// MEDIA COMPONENTS (Heavy libraries - lazy load)
// ============================================================================

// Image Uploader
export const LazyImageUploader = dynamic(
  () => import('@/components/media/image-uploader'),
  {
    loading: () => <Skeleton className="h-48 w-full" />,
    ssr: false
  }
);

// Video Player
export const LazyVideoPlayer = dynamic(
  () => import('@/components/media/video-player'),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false
  }
);

// ============================================================================
// UTILITY: Suspense Wrapper
// ============================================================================

export interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazySuspense({ 
  children, 
  fallback = <DefaultLoading /> 
}: LazyComponentProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

