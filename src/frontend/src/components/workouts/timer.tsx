'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TimerProps {
  seconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function Timer({ seconds: initialSeconds, onComplete, autoStart = false }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning || seconds <= 0) {
      if (seconds === 0 && onComplete) {
        onComplete();
      }
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          if (onComplete) {
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, seconds, onComplete]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggle = () => {
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setSeconds(initialSeconds);
    setIsRunning(autoStart);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <div className="text-6xl font-bold mb-4">{formatTime(seconds)}</div>
          <div className="flex justify-center gap-2">
            <Button onClick={toggle} size="sm" variant="outline">
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button onClick={reset} size="sm" variant="ghost">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

