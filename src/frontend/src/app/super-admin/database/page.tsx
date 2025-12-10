'use client';

import { useState } from 'react';
import { DatabaseList } from '@/components/super-admin/database/database-list';
import { CreateDatabaseForm } from '@/components/super-admin/database/create-database-form';

export default function SuperAdminDatabasePage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Bancos de Dados</h1>
          <p className="text-muted-foreground">
            Monitore e gerencie bancos de dados Docker, VPS e serviços externos
          </p>
        </div>
      </div>

      <DatabaseList 
        onCreateClick={() => setCreateDialogOpen(true)} 
        refreshTrigger={refreshTrigger}
      />
      
      <CreateDatabaseForm
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

