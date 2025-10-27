/**
 * Owner Information Step
 * 
 * Step 2 do onboarding:
 * - Informações do proprietário
 * - CPF/CNPJ
 * - Telefone
 * - Endereço
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, MapPin, FileText, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OwnerInfoStepProps {
  data: {
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    ownerDocument: string;
    ownerAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  onDataChange: (data: Partial<any>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
}

interface ValidationState {
  name: boolean;
  email: boolean;
  phone: boolean;
  document: boolean;
  address: boolean;
}

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function OwnerInfoStep({ data, onDataChange, onPrevious, onNext, isLoading }: OwnerInfoStepProps) {
  const [validation, setValidation] = useState<ValidationState>({
    name: false,
    email: false,
    phone: false,
    document: false,
    address: false
  });

  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cpf');

  // Validação em tempo real
  useEffect(() => {
    validateForm();
  }, [data]);

  const validateForm = () => {
    const newValidation: ValidationState = {
      name: data.ownerName.trim().length >= 2,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.ownerEmail),
      phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(data.ownerPhone),
      document: validateDocument(data.ownerDocument),
      address: validateAddress()
    };

    setValidation(newValidation);
  };

  const validateDocument = (document: string): boolean => {
    if (documentType === 'cpf') {
      return validateCPF(document);
    } else {
      return validateCNPJ(document);
    }
  };

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    // Validar dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  };

  const validateCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

    // Validar primeiro dígito verificador
    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;
    if (firstDigit !== parseInt(cleanCNPJ.charAt(12))) return false;

    // Validar segundo dígito verificador
    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;
    if (secondDigit !== parseInt(cleanCNPJ.charAt(13))) return false;

    return true;
  };

  const validateAddress = (): boolean => {
    return !!(
      data.ownerAddress.street.trim() &&
      data.ownerAddress.city.trim() &&
      data.ownerAddress.state &&
      data.ownerAddress.zipCode.trim()
    );
  };

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatDocument = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (documentType === 'cpf') {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    } else {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
      if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    }
  };

  const formatZipCode = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleInputChange = (field: string, value: string) => {
    onDataChange({ [field]: value });
  };

  const handleAddressChange = (field: string, value: string) => {
    onDataChange({
      ownerAddress: {
        ...data.ownerAddress,
        [field]: value
      }
    });
  };

  const handleNext = () => {
    if (!validation.name) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    if (!validation.email) {
      toast.error('Email válido é obrigatório');
      return;
    }

    if (!validation.phone) {
      toast.error('Telefone válido é obrigatório');
      return;
    }

    if (!validation.document) {
      toast.error(`${documentType.toUpperCase()} válido é obrigatório`);
      return;
    }

    if (!validation.address) {
      toast.error('Endereço completo é obrigatório');
      return;
    }

    onNext();
  };

  const isFormValid = Object.values(validation).every(Boolean);

  return (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Dados do proprietário da academia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome Completo */}
          <div className="space-y-2">
            <Label htmlFor="owner-name" className="flex items-center gap-2">
              Nome Completo *
              {validation.name ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : data.ownerName ? (
                <XCircle className="h-3 w-3 text-red-600" />
              ) : null}
            </Label>
            <Input
              id="owner-name"
              type="text"
              placeholder="João Silva Santos"
              value={data.ownerName}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
              disabled={isLoading}
            />
            {data.ownerName && !validation.name && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  Nome deve ter pelo menos 2 caracteres
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="owner-email" className="flex items-center gap-2">
              Email *
              {validation.email ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : data.ownerEmail ? (
                <XCircle className="h-3 w-3 text-red-600" />
              ) : null}
            </Label>
            <Input
              id="owner-email"
              type="email"
              placeholder="joao@academiafitlife.com"
              value={data.ownerEmail}
              onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
              disabled={isLoading}
            />
            {data.ownerEmail && !validation.email && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  Email inválido
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="owner-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone *
              {validation.phone ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : data.ownerPhone ? (
                <XCircle className="h-3 w-3 text-red-600" />
              ) : null}
            </Label>
            <Input
              id="owner-phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={data.ownerPhone}
              onChange={(e) => handleInputChange('ownerPhone', formatPhone(e.target.value))}
              disabled={isLoading}
            />
            {data.ownerPhone && !validation.phone && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  Telefone deve estar no formato (11) 99999-9999
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* CPF/CNPJ */}
          <div className="space-y-2">
            <Label htmlFor="owner-document" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {documentType.toUpperCase()} *
              {validation.document ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : data.ownerDocument ? (
                <XCircle className="h-3 w-3 text-red-600" />
              ) : null}
            </Label>
            <div className="flex gap-2">
              <Input
                id="owner-document"
                type="text"
                placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                value={data.ownerDocument}
                onChange={(e) => handleInputChange('ownerDocument', formatDocument(e.target.value))}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDocumentType(documentType === 'cpf' ? 'cnpj' : 'cpf');
                  handleInputChange('ownerDocument', '');
                }}
                disabled={isLoading}
              >
                {documentType === 'cpf' ? 'CNPJ' : 'CPF'}
              </Button>
            </div>
            {data.ownerDocument && !validation.document && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {documentType.toUpperCase()} inválido
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
          </CardTitle>
          <CardDescription>
            Endereço da academia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rua */}
          <div className="space-y-2">
            <Label htmlFor="street">Rua/Avenida *</Label>
            <Input
              id="street"
              type="text"
              placeholder="Rua das Flores, 123"
              value={data.ownerAddress.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                type="text"
                placeholder="São Paulo"
                value={data.ownerAddress.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <select
                id="state"
                value={data.ownerAddress.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CEP */}
          <div className="space-y-2">
            <Label htmlFor="zip-code">CEP *</Label>
            <Input
              id="zip-code"
              type="text"
              placeholder="00000-000"
              value={data.ownerAddress.zipCode}
              onChange={(e) => handleAddressChange('zipCode', formatZipCode(e.target.value))}
              disabled={isLoading}
              maxLength={9}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {isFormValid && (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Informações completas!</span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Todos os campos obrigatórios foram preenchidos corretamente.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isLoading}
        >
          Voltar
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading || !isFormValid}
          className="flex items-center gap-2"
        >
          Continuar
          <User className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

