/**
 * Gym Information Step
 * 
 * Step 1 do onboarding:
 * - Nome da academia
 * - Subdomínio (validação em tempo real)
 * - Email de cobrança
 * - Tipo de estabelecimento
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle, XCircle, Loader2, Mail, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface GymInfoStepProps {
  data: {
    gymName: string;
    subdomain: string;
    billingEmail: string;
    gymType: 'academia' | 'personal_trainer' | 'crossfit' | 'pilates' | 'outro';
  };
  onDataChange: (data: Partial<any>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
}

interface SubdomainValidation {
  isValid: boolean;
  isAvailable: boolean;
  isChecking: boolean;
  message?: string;
}

const gymTypes = [
  { value: 'academia', label: 'Academia', description: 'Academia tradicional' },
  { value: 'personal_trainer', label: 'Personal Trainer', description: 'Personal trainer independente' },
  { value: 'crossfit', label: 'CrossFit', description: 'Box de CrossFit' },
  { value: 'pilates', label: 'Pilates', description: 'Estúdio de Pilates' },
  { value: 'outro', label: 'Outro', description: 'Outro tipo de estabelecimento' }
];

export function GymInfoStep({ data, onDataChange, onNext, onPrevious, isLoading }: GymInfoStepProps) {
  const [subdomainValidation, setSubdomainValidation] = useState<SubdomainValidation>({
    isValid: false,
    isAvailable: false,
    isChecking: false
  });

  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    message?: string;
  }>({ isValid: false });

  // Validar subdomain em tempo real
  useEffect(() => {
    if (data.subdomain && data.subdomain.length >= 3) {
      validateSubdomain(data.subdomain);
    } else {
      setSubdomainValidation({
        isValid: false,
        isAvailable: false,
        isChecking: false
      });
    }
  }, [data.subdomain]);

  // Validar email em tempo real
  useEffect(() => {
    if (data.billingEmail) {
      validateEmail(data.billingEmail);
    } else {
      setEmailValidation({ isValid: false });
    }
  }, [data.billingEmail]);

  const validateSubdomain = async (subdomain: string) => {
    setSubdomainValidation(prev => ({ ...prev, isChecking: true }));

    try {
      const response = await fetch('/api/onboarding/validate-subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain })
      });

      const result = await response.json();
      
      setSubdomainValidation({
        isValid: result.success && result.available,
        isAvailable: result.available,
        isChecking: false,
        message: result.message
      });
    } catch (error) {
      setSubdomainValidation({
        isValid: false,
        isAvailable: false,
        isChecking: false,
        message: 'Erro ao validar subdomain'
      });
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    setEmailValidation({
      isValid,
      message: isValid ? undefined : 'Email inválido'
    });
  };

  const handleInputChange = (field: string, value: string) => {
    onDataChange({ [field]: value });
  };

  const handleNext = () => {
    if (!data.gymName.trim()) {
      toast.error('Nome da academia é obrigatório');
      return;
    }

    if (!data.subdomain.trim()) {
      toast.error('Subdomain é obrigatório');
      return;
    }

    if (!subdomainValidation.isValid || !subdomainValidation.isAvailable) {
      toast.error('Subdomain não está disponível');
      return;
    }

    if (!data.billingEmail.trim()) {
      toast.error('Email de cobrança é obrigatório');
      return;
    }

    if (!emailValidation.isValid) {
      toast.error('Email inválido');
      return;
    }

    if (!data.gymType) {
      toast.error('Tipo de estabelecimento é obrigatório');
      return;
    }

    onNext();
  };

  const getSubdomainStatus = () => {
    if (subdomainValidation.isChecking) {
      return (
        <div className="flex items-center gap-1 text-blue-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Verificando...</span>
        </div>
      );
    }

    if (subdomainValidation.isValid && subdomainValidation.isAvailable) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs">Disponível</span>
        </div>
      );
    }

    if (data.subdomain && !subdomainValidation.isAvailable) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <XCircle className="h-3 w-3" />
          <span className="text-xs">Indisponível</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Nome da Academia */}
      <div className="space-y-2">
        <Label htmlFor="gym-name" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Nome da Academia *
        </Label>
        <Input
          id="gym-name"
          type="text"
          placeholder="Ex: Academia FitLife"
          value={data.gymName}
          onChange={(e) => handleInputChange('gymName', e.target.value)}
          disabled={isLoading}
          className="text-lg"
        />
        <p className="text-xs text-muted-foreground">
          Este será o nome exibido na sua plataforma
        </p>
      </div>

      {/* Subdomain */}
      <div className="space-y-2">
        <Label htmlFor="subdomain" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Subdomain *
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="subdomain"
            type="text"
            placeholder="fitlife"
            value={data.subdomain}
            onChange={(e) => handleInputChange('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            disabled={isLoading}
            className="flex-1"
          />
          <div className="text-sm text-muted-foreground">
            .{process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'fitos.com'}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            URL da sua academia: <strong>https://{data.subdomain || 'seu-subdomain'}.{process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'fitos.com'}</strong>
          </p>
          {getSubdomainStatus()}
        </div>
        {subdomainValidation.message && (
          <Alert className={subdomainValidation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription className={subdomainValidation.isValid ? 'text-green-700' : 'text-red-700'}>
              {subdomainValidation.message}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Email de Cobrança */}
      <div className="space-y-2">
        <Label htmlFor="billing-email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email de Cobrança *
        </Label>
        <Input
          id="billing-email"
          type="email"
          placeholder="cobranca@academiafitlife.com"
          value={data.billingEmail}
          onChange={(e) => handleInputChange('billingEmail', e.target.value)}
          disabled={isLoading}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Email para receber faturas e notificações de cobrança
          </p>
          {emailValidation.isValid && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span className="text-xs">Válido</span>
            </div>
          )}
        </div>
        {emailValidation.message && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {emailValidation.message}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Tipo de Estabelecimento */}
      <div className="space-y-2">
        <Label htmlFor="gym-type">Tipo de Estabelecimento *</Label>
        <Select
          value={data.gymType}
          onValueChange={(value) => handleInputChange('gymType', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {gymTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{type.label}</span>
                  <span className="text-xs text-muted-foreground">{type.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Isso nos ajuda a personalizar a experiência para o seu tipo de negócio
        </p>
      </div>

      {/* Preview */}
      {data.gymName && data.subdomain && (
        <div className="p-4 bg-muted/50 rounded-lg border">
          <h4 className="font-medium mb-2">Preview da sua conta:</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Nome:</strong> {data.gymName}</p>
            <p><strong>URL:</strong> https://{data.subdomain}.{process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'fitos.com'}</p>
            <p><strong>Tipo:</strong> {gymTypes.find(t => t.value === data.gymType)?.label}</p>
            <p><strong>Email:</strong> {data.billingEmail}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={isLoading || !subdomainValidation.isValid || !emailValidation.isValid}
          className="flex items-center gap-2"
        >
          Continuar
          <Building2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

