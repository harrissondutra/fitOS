'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Upload,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanTypeBadge } from '@/components/plan/plan-badge';
import { UsageSummary } from '@/components/plan/usage-indicator';
import { UpgradeModal } from '@/components/plan/upgrade-modal';
import { UserTable } from '@/components/users/user-table';
import { UserFilters } from '@/components/users/user-filters';
import { BulkActionsBar } from '@/components/users/bulk-actions-bar';
import { CSVImportModal } from '@/components/users/csv-import-modal';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { EditUserDialog } from '@/components/users/edit-user-dialog';
import { User, UserFilters as UserFiltersType, UserBulkAction, CSVImportResult, UserFormData } from '../../../../../shared/types';
import { toastUtils } from '@/lib/toast-utils';

// Configurações para evitar problemas de SSR com useAuth
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function UsersPage() {
  // Auth removed - using default values
  const tenantType = 'business';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState<UserFiltersType>({
    search: '',
    role: undefined,
    status: undefined,
    createdFrom: undefined,
    createdTo: undefined,
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/users?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      
      if (response.ok) {
        const data = await response.json();
        const result: UsersResponse = data.data;
        setUsers(result.users);
        setPagination(result.pagination);
      } else {
        const errorText = await response.text();
        setUsers([]);
      }
    } catch (error) { console.error('Error fetching users:', error); }/* empty */ 
     finally {
      setLoading(false);
    }
  
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSelectUser = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${user.firstName} ${user.lastName}?`)) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchUsers();
        toastUtils.user.deleted(`${user.firstName} ${user.lastName}`);
      } else {
        const error = await response.json();
        toastUtils.user.deleteError(error.error?.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toastUtils.user.deleteError();
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchUsers();
        toastUtils.user.statusChanged(`${user.firstName} ${user.lastName}`, newStatus === 'ACTIVE' ? 'ativado' : 'desativado');
      } else {
        const error = await response.json();
        toastUtils.user.statusError(error.error?.message);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toastUtils.user.statusError();
    }
  };


  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'export') => {
    if (selectedUsers.length === 0) return;

    if (action === 'export') {
      await handleExport();
      return;
    }

    const bulkAction: UserBulkAction = {
      action,
      userIds: selectedUsers
    };

    try {
      const response = await fetch('/api/users/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkAction)
      });

      if (response.ok) {
        fetchUsers();
        setSelectedUsers([]);
        toastUtils.bulk.success(action, selectedUsers.length);
      } else {
        const error = await response.json();
        toastUtils.bulk.error(action, error.error?.message);
      }
    } catch (error) {
      console.error('Error executing bulk action:', error);
      toastUtils.bulk.error(action);
    }
  };

  const handleExport = async () => {
    try {
      const userIds = selectedUsers.length > 0 ? selectedUsers.join(',') : '';
      const params = new URLSearchParams();
      if (userIds) params.append('userIds', userIds);

      const response = await fetch(`/api/users/export/csv?${params}`);
      if (response.ok) {
        const data = await response.json();
        // TODO: Implementar download do CSV
        toastUtils.export.started();
      } else {
        toastUtils.export.error();
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      toastUtils.export.error();
    }
  };

  const handleCSVImport = async (file: File): Promise<CSVImportResult> => {
    // TODO: Implementar upload e processamento do CSV
    return {
      success: false,
      totalRows: 0,
      successCount: 0,
      errorCount: 0,
      errors: [{ row: 0, field: 'file', message: 'Funcionalidade em desenvolvimento' }],
      importedUsers: []
    };
  };

  const handleFiltersChange = (newFilters: UserFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      role: undefined,
      status: undefined,
      createdFrom: undefined,
      createdTo: undefined,
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const handleCreateUser = async (userData: UserFormData) => {
    try {
      setCreateUserLoading(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        fetchUsers();
        toastUtils.user.created(`${userData.firstName} ${userData.lastName}`);
      } else {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro ao criar usuário');
      }
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleEditUser = async (userData: UserFormData) => {
    if (!editingUser) return;

    try {
      setEditLoading(true);
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        fetchUsers();
        setShowEditDialog(false);
        setEditingUser(null);
        toastUtils.user.updated(`${userData.firstName} ${userData.lastName}`);
      } else {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro ao atualizar usuário');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    const response = await fetch(`/api/users/${userId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao redefinir senha');
    }
  };

  const handleResetPasswordFromTable = async (user: User) => {
    const newPassword = prompt(`Digite a nova senha para ${user.firstName} ${user.lastName}:`);
    if (!newPassword) return;

    try {
      await handleResetPassword(user.id, newPassword);
      toastUtils.user.passwordReset(`${user.firstName} ${user.lastName}`);
    } catch (error: any) {
      toastUtils.user.passwordError(error.message);
    }
  };

  const getUsageData = () => {
    // TODO: Implementar dados de uso baseado no plano
    return {
      client: { current: 0, limit: 100, isUnlimited: false },
      trainer: { current: 0, limit: 10, isUnlimited: false },
      admin: { current: 0, limit: 5, isUnlimited: false },
      owner: { current: 0, limit: 1, isUnlimited: false }
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="mt-2 text-gray-600">
            Gerencie colaboradores e membros do seu tenant
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <PlanTypeBadge tenantType={tenantType} />
          <Button
            variant="outline"
            onClick={() => setShowCSVModal(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <CreateUserDialog
            onCreateUser={handleCreateUser}
            loading={createUserLoading}
            userRole="ADMIN"
          />
        </div>
      </div>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Uso por Role</CardTitle>
          <CardDescription>
            Acompanhe o uso de usuários por tipo de role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsageSummary usage={getUsageData()} />
        </CardContent>
      </Card>

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        loading={loading}
      />

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={selectedUsers.length}
        onBulkAction={handleBulkAction}
        onExport={handleExport}
        onClearSelection={() => setSelectedUsers([])}
      />

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>
                {pagination.total} usuário(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UserTable
            users={users}
            loading={loading}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            onSelectAll={handleSelectAll}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPasswordFromTable}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} resultados
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFiltersChange({ ...filters, page: pagination.page - 1 })}
              disabled={pagination.page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFiltersChange({ ...filters, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.pages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan="starter"
        tenantType={tenantType}
        onUpgrade={(upgradeType, data) => {
          setShowUpgradeModal(false);
        }}
      />

      <CSVImportModal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        onImport={handleCSVImport}
      />

      <EditUserDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleEditUser}
        onResetPassword={handleResetPassword}
        loading={editLoading}
      />
    </div>
  );
}
