'use client';

import { useState } from 'react';
import { DatabaseList } from '@/components/super-admin/database/database-list';
import { CreateDatabaseForm } from '@/components/super-admin/database/create-database-form';

export default function SuperAdminDatabaseDashboardPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6">
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
