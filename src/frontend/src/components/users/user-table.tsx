'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Key,
  Crown,
  Users,
  User
} from 'lucide-react';
import { User as UserType, UserRole, UserRoles, UserStatus } from '@/shared/types/auth.types';

export interface UserTableProps {
  users: UserType[];
  loading: boolean;
  selectedUsers: string[];
  onSelectUser: (userId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (user: UserType) => void;
  onDelete: (user: UserType) => void;
  onToggleStatus: (user: UserType) => void;
  onResetPassword: (user: UserType) => void;
}

export function UserTable({
  users,
  loading,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword
}: UserTableProps) {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'TRAINER':
        return <User className="h-4 w-4 text-green-500" />;
      case 'CLIENT':
        return <User className="h-4 w-4 text-muted-foreground" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    const roleNames: Record<UserRole, string> = {
      [UserRoles.OWNER]: 'Proprietário',
      [UserRoles.ADMIN]: 'Administrador',
      [UserRoles.TRAINER]: 'Personal Trainer',
      [UserRoles.CLIENT]: 'Cliente',
      [UserRoles.SUPER_ADMIN]: 'Super Admin',
      [UserRoles.NUTRITIONIST]: 'Nutricionista',
      [UserRoles.EMPLOYEE]: 'Funcionário',
      [UserRoles.PROFESSIONAL]: 'Profissional'
    };
    return roleNames[role] || role;
  };

  const getStatusBadge = (status: UserStatus) => {
    const statusConfig = {
      ACTIVE: { variant: 'default' as const, label: 'Ativo' },
      INACTIVE: { variant: 'secondary' as const, label: 'Inativo' },
      SUSPENDED: { variant: 'destructive' as const, label: 'Suspenso' },
      PENDING: { variant: 'outline' as const, label: 'Pendente' },
      DELETED: { variant: 'outline' as const, label: 'Excluído' }
    };

    const config = statusConfig[status] || statusConfig.INACTIVE;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-sm font-medium text-foreground mb-2">
          Nenhum usuário encontrado
        </h3>
        <p className="text-sm text-muted-foreground">
          Não há usuários que correspondam aos filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(checked as boolean)}
              />
            </TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onEdit(user)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={(checked) => onSelectUser(user.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {user.firstName || 'Usuário'} {user.lastName || ''}
                    </div>
                    {user.phone && (
                      <div className="text-sm text-muted-foreground">{user.phone}</div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-foreground">{user.email}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getRoleIcon(user.role)}
                  <span className="text-sm">{getRoleDisplayName(user.role)}</span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(user.status)}
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {formatDate(user.createdAt)}
                </div>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(user);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(user);
                      }}
                    >
                      {user.status === 'ACTIVE' ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onResetPassword(user);
                      }}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Redefinir Senha
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(user);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
