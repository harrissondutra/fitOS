'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  UserPlus, 
  Plus,
  Upload,
  Download,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UpgradeModal } from '@/components/plan/upgrade-modal';
import { UserTable } from '@/components/users/user-table';
import { UserFilters } from '@/components/users/user-filters';
import { BulkActionsBar } from '@/components/users/bulk-actions-bar';
import { CSVImportModal } from '@/components/users/csv-import-modal';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { EditUserDialog } from '@/components/users/edit-user-dialog';
import { User, UserFilters as UserFiltersType, UserBulkAction, CSVImportResult, UserFormData } from '../../../../../shared/types';
import { toastUtils } from '@/lib/toast-utils';

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UsageData {
  current: number;
  limit: number;
  canCreate: boolean;
}

export default function SuperAdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [filters, setFilters] = useState<UserFiltersType>({
    search: '',
    role: undefined,
    status: undefined,
    createdFrom: '',
    createdTo: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
      if (filters.createdTo) params.append('createdTo', filters.createdTo);
      params.append('page', (filters.page || 1).toString());
      params.append('limit', (filters.limit || 10).toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      console.log('🔍 [SUPER-ADMIN] Fazendo requisição para:', `/api/users?${params}`);
      
      const response = await fetch(`/api/users?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 [SUPER-ADMIN] Status da resposta:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 [SUPER-ADMIN] Dados recebidos:', data);
        setUsers(data.data.users || []);
        setPagination(data.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        });
        console.log('👥 [SUPER-ADMIN] Usuários definidos:', data.data.users?.length || 0);
      } else {
        console.error('❌ [SUPER-ADMIN] Erro ao buscar usuários:', response.status);
        setUsers([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getUsageData = async (): Promise<UsageData> => {
    // Para super admin, sempre pode criar usuários
    return {
      current: users.length,
      limit: 999999,
      canCreate: true
    };
  };

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
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchUsers();
        toastUtils.user.deleted(`${user.firstName} ${user.lastName}`);
      } else {
        toastUtils.user.deleteError();
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
        toastUtils.user.statusError();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
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
        console.log('Export data:', data);
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
      createdFrom: '',
      createdTo: '',
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
    } catch (error: any) {
      throw error;
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
    } catch (error: any) {
      throw error;
    } finally {
      setEditLoading(false);
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro ao redefinir senha');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleResetPasswordFromTable = async (user: User) => {
    const newPassword = prompt('Digite a nova senha (mínimo 8 caracteres):');
    if (!newPassword || newPassword.length < 8) {
      toastUtils.validation.passwordLength();
      return;
    }

    try {
      await handleResetPassword(user.id, newPassword);
      toastUtils.user.passwordReset(`${user.firstName} ${user.lastName}`);
    } catch (error: any) {
      toastUtils.user.passwordError(error.message);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie todos os usuários do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCSVImport(true)}
            disabled={loading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <CreateUserDialog
            onCreateUser={handleCreateUser}
            loading={createUserLoading}
            userRole="SUPER_ADMIN"
          />
        </div>
      </div>

      {/* Usage Info */}
      {usageData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Uso do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Usuários</p>
                <p className="text-2xl font-bold">{usageData.current}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {usageData.canCreate ? 'Pode criar usuários' : 'Limite atingido'}
                </p>
                {!usageData.canCreate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUpgradeModal(true)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        loading={loading}
      />

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedUsers.length}
          onBulkAction={handleBulkAction}
          onExport={handleExport}
          onClearSelection={() => setSelectedUsers([])}
        />
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({pagination?.total || 0})</CardTitle>
          <CardDescription>
            Lista de todos os usuários do sistema
          </CardDescription>
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
      {pagination?.totalPages && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} usuários
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onImport={handleCSVImport}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan="free"
        tenantType="business"
        onUpgrade={() => {
          setShowUpgradeModal(false);
          // TODO: Implementar lógica de upgrade
        }}
      />

      {/* Edit User Dialog */}
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
