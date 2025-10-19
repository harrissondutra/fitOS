'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Eye, EyeOff, Key } from 'lucide-react';
import { UserFormData, UserRole, UserStatus, User } from '../../../../shared/types';
import { toastUtils } from '@/lib/toast-utils';

const userFormSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  role: z.enum(['MEMBER', 'TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN'] as const),
  password: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'] as const).optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: UserFormData) => Promise<void>;
  onResetPassword?: (userId: string, newPassword: string) => Promise<void>;
  loading?: boolean;
}

export function EditUserDialog({ 
  isOpen, 
  onClose, 
  user, 
  onSave, 
  onResetPassword,
  loading = false 
}: EditUserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

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
      role: 'MEMBER',
      status: 'ACTIVE',
      password: ''
    }
  });

  const watchedRole = watch('role');

  // Reset form when user changes
  useEffect(() => {
    if (user && isOpen) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'MEMBER',
        status: user.status || 'ACTIVE',
        password: ''
      });
      setErrors([]);
      setShowPasswordReset(false);
      setNewPassword('');
    }
  }, [user, isOpen, reset]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setErrors([]);
      setShowPasswordReset(false);
      setNewPassword('');
    }
  }, [isOpen]);

  const handleFormSubmit = async (data: UserFormValues) => {
    try {
      setErrors([]);
      
      // Remover campos vazios antes de enviar
      const cleanData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role
      };
      
      // Adicionar campos opcionais apenas se não estiverem vazios
      if (data.phone && data.phone.trim()) {
        cleanData.phone = data.phone;
      }
      
      if (data.password && data.password.trim()) {
        cleanData.password = data.password;
      }
      
      if (data.status) {
        cleanData.status = data.status;
      }
      
      await onSave(cleanData as UserFormData);
      onClose();
    } catch (error: any) {
      setErrors([error.message || 'Erro ao salvar usuário']);
    }
  };

  const handleResetPassword = async () => {
    if (!user || !onResetPassword || !newPassword.trim()) return;

    if (newPassword.length < 8) {
      toastUtils.validation.passwordLength();
      return;
    }

    try {
      setPasswordLoading(true);
      await onResetPassword(user.id, newPassword);
      setNewPassword('');
      setShowPasswordReset(false);
      toastUtils.user.passwordReset(`${user.firstName} ${user.lastName}`);
    } catch (error: any) {
      toastUtils.user.passwordError(error.message);
    } finally {
      setPasswordLoading(false);
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

  const getStatusDisplayName = (status: UserStatus) => {
    const statusNames: Record<UserStatus, string> = {
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      SUSPENDED: 'Suspenso',
      DELETED: 'Excluído'
    };
    return statusNames[status] || status;
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-destructive">
                    Erro ao salvar
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="MEMBER">Membro</SelectItem>
                  <SelectItem value="TRAINER">Personal Trainer</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="OWNER">Proprietário</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-destructive">{formErrors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as UserStatus)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                  <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.status && (
                <p className="text-sm text-destructive">{formErrors.status.message}</p>
              )}
            </div>
          </div>

          {/* Password Reset Section */}
          {onResetPassword && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    Redefinir Senha
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Defina uma nova senha para este usuário
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordReset(!showPasswordReset)}
                >
                  {showPasswordReset ? 'Cancelar' : 'Redefinir Senha'}
                </Button>
              </div>

              {showPasswordReset && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        disabled={passwordLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={passwordLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={passwordLoading || !newPassword.trim()}
                    className="w-full"
                  >
                    {passwordLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Atualizar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
