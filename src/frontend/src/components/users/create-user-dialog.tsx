'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Eye, EyeOff, Plus } from 'lucide-react';
import { UserFormData, UserRole } from '../../../../shared/types';

const userFormSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  role: z.enum(['MEMBER', 'TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN'] as const),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface CreateUserDialogProps {
  onCreateUser: (data: UserFormData) => Promise<void>;
  loading?: boolean;
  userRole?: UserRole;
}

export function CreateUserDialog({ 
  onCreateUser, 
  loading = false,
  userRole = 'MEMBER'
}: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    setValue,
    watch,
    reset
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: userRole,
      password: ''
    }
  });

  const watchedRole = watch('role');

  const handleFormSubmit = async (data: UserFormValues) => {
    try {
      setErrors([]);
      await onCreateUser(data as UserFormData);
      reset();
      setOpen(false);
    } catch (error: any) {
      setErrors([error.message || 'Erro ao criar usuário']);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
      setErrors([]);
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    const roleNames: Record<UserRole, string> = {
      OWNER: 'Proprietário',
      ADMIN: 'Administrador',
      TRAINER: 'Personal Trainer',
      MEMBER: 'Membro',
      SUPER_ADMIN: 'Super Admin'
    };
    return roleNames[role] || role;
  };

  // Filtrar roles baseado no usuário atual
  const getAvailableRoles = () => {
    const allRoles: { value: UserRole; label: string }[] = [
      { value: 'MEMBER', label: 'Membro' },
      { value: 'TRAINER', label: 'Personal Trainer' },
      { value: 'ADMIN', label: 'Administrador' },
      { value: 'OWNER', label: 'Proprietário' },
    ];

    // SUPER_ADMIN pode criar qualquer role
    if (userRole === 'SUPER_ADMIN') {
      allRoles.push({ value: 'SUPER_ADMIN', label: 'Super Admin' });
    }

    // ADMIN só pode criar MEMBER e TRAINER
    if (userRole === 'ADMIN') {
      return allRoles.filter(role => ['MEMBER', 'TRAINER'].includes(role.value));
    }

    return allRoles;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo usuário
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-destructive">
                    Erro ao criar usuário
                  </h3>
                  <div className="mt-2 text-sm text-destructive/80">
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="João"
                disabled={loading}
              />
              {formErrors.firstName && (
                <p className="text-sm text-destructive">{formErrors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Silva"
                disabled={loading}
              />
              {formErrors.lastName && (
                <p className="text-sm text-destructive">{formErrors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="joao.silva@email.com"
              disabled={loading}
            />
            {formErrors.email && (
              <p className="text-sm text-destructive">{formErrors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="(11) 99999-9999"
              disabled={loading}
            />
            {formErrors.phone && (
              <p className="text-sm text-destructive">{formErrors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={watchedRole}
              onValueChange={(value) => setValue('role', value as UserRole)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o role" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableRoles().map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.role && (
              <p className="text-sm text-destructive">{formErrors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Mínimo 8 caracteres"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {formErrors.password && (
              <p className="text-sm text-destructive">{formErrors.password.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
