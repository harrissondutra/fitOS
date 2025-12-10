'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const empresaSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  billingEmail: z.string().email('Email inválido'),
  subdomain: z.string().optional().refine(
    (val) => !val || /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(val),
    'Subdomain inválido. Use apenas letras minúsculas, números e hífens'
  ),
  customDomain: z.string().optional(),
  tenantType: z.enum(['individual', 'business']),
  plan: z.string(),
  planType: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

interface EmpresaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa?: {
    id: string;
    name: string;
    billingEmail: string;
    subdomain?: string;
    customDomain?: string;
    tenantType: 'individual' | 'business';
    plan: string;
    planType?: string;
    status: 'active' | 'inactive' | 'suspended';
  };
  onSuccess?: () => void;
}

export function EmpresaForm({ open, onOpenChange, empresa, onSuccess }: EmpresaFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      name: '',
      billingEmail: '',
      subdomain: '',
      customDomain: '',
      tenantType: 'business',
      plan: 'starter',
      planType: 'base',
      status: 'active',
    },
  });

  const tenantType = watch('tenantType');
  const plan = watch('plan');

  useEffect(() => {
    if (empresa) {
      reset({
        name: empresa.name,
        billingEmail: empresa.billingEmail,
        subdomain: empresa.subdomain || '',
        customDomain: empresa.customDomain || '',
        tenantType: empresa.tenantType,
        plan: empresa.plan as any,
        planType: empresa.planType as any,
        status: empresa.status,
      });
    } else {
      reset({
        name: '',
        billingEmail: '',
        subdomain: '',
        customDomain: '',
        tenantType: 'business',
        plan: 'starter',
        planType: 'base',
        status: 'active',
      });
    }
    setError(null);
  }, [empresa, open, reset]);

  const onSubmit = async (data: EmpresaFormData) => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('Token de acesso não encontrado. Faça login novamente.');
        toast.error('Token de acesso não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }

      const url = empresa
        ? `/api/super-admin/tenants/${empresa.id}`
        : '/api/super-admin/tenants';
      const method = empresa ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...data,
          subdomain: data.subdomain || null,
          customDomain: data.customDomain || null,
          // back compat: 'base' não é enum válido; só envie 'custom' ou um dos enum suportados
          planType: data.planType === 'custom' ? 'custom' : undefined,
        }),
      });

      // Tentar ler JSON com segurança
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await response.json()
        : null;

      if (!response.ok) {
        const errorMessage =
          (result && (result.error?.message || result.error)) ||
          (response.status === 503 || response.status === 502
            ? 'Serviço indisponível. Tente novamente em instantes.'
            : `Erro ao ${empresa ? 'atualizar' : 'criar'} empresa (${response.status})`);
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(`Empresa ${empresa ? 'atualizada' : 'criada'} com sucesso`);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Erro ao ${empresa ? 'atualizar' : 'criar'} empresa`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {empresa ? 'Editar Empresa' : 'Criar Nova Empresa'}
          </DialogTitle>
          <DialogDescription>
            {empresa
              ? 'Atualize as informações da empresa'
              : 'Preencha os dados para criar uma nova empresa'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome da Empresa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Nome da empresa"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingEmail">
                Email de Cobrança <span className="text-red-500">*</span>
              </Label>
              <Input
                id="billingEmail"
                type="email"
                {...register('billingEmail')}
                placeholder="email@exemplo.com"
              />
              {errors.billingEmail && (
                <p className="text-sm text-red-500">
                  {errors.billingEmail.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input
                id="subdomain"
                {...register('subdomain')}
                placeholder="empresa"
                className="lowercase"
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setValue('subdomain', value);
                }}
              />
              {errors.subdomain && (
                <p className="text-sm text-red-500">
                  {errors.subdomain.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {watch('subdomain')
                  ? `${watch('subdomain')}.fitos.com`
                  : 'Subdomain opcional para acesso personalizado'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customDomain">Domínio Customizado</Label>
              <Input
                id="customDomain"
                {...register('customDomain')}
                placeholder="exemplo.com"
              />
              {errors.customDomain && (
                <p className="text-sm text-red-500">
                  {errors.customDomain.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenantType">Tipo</Label>
              <Select
                value={tenantType}
                onValueChange={(value) =>
                  setValue('tenantType', value as 'individual' | 'business')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Pessoa Física</SelectItem>
                  <SelectItem value="business">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plano</Label>
              <Select
                value={plan}
                onValueChange={(value) =>
                  setValue('plan', value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planType">Tipo de Plano</Label>
              <Select
                value={watch('planType') || 'base'}
                onValueChange={(value) => setValue('planType', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Plano Base</SelectItem>
                  <SelectItem value="custom">Plano Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) =>
                  setValue('status', value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {empresa ? 'Atualizar' : 'Criar'} Empresa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

