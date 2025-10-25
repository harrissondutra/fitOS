'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientCard } from '@/components/clients/client-card';
import { useClients } from '@/hooks/use-clients';
import { usePermissions } from '@/hooks/use-permissions';
import { Client, ClientFormData } from '@/shared/types';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  User,
  Users,
  UserCheck,
  UserX
} from 'lucide-react';

// Configurações para evitar problemas de SSR com useAuth
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

export default function ClientesPage() {
  // Auth removed - using default values
  const user = { role: 'ADMIN' as const };
  const permissions = usePermissions(user?.role);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    clientshipType: '',
    trainerId: ''
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignTrainerDialogOpen, setIsAssignTrainerDialogOpen] = useState(false);

  const { clients, loading, error, pagination, createClient, updateClient, deleteClient, assignTrainer, unassignTrainer } = useClients({ filters });

  const handleCreateClient = async (data: ClientFormData) => {
    try {
      await createClient(data);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleEditClient = async (data: Partial<ClientFormData>) => {
    if (!selectedClient) return;
    
    try {
      await updateClient(selectedClient.id, data);
      setIsEditDialogOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (confirm(`Are you sure you want to delete "${client.name}"?`)) {
      try {
        await deleteClient(client.id);
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleAssignTrainer = async (client: Client) => {
    setSelectedClient(client);
    setIsAssignTrainerDialogOpen(true);
  };

  const handleUnassignTrainer = async (client: Client) => {
    if (client.trainers && client.trainers.length > 0) {
      try {
        await unassignTrainer(client.id, client.trainers[0].id);
      } catch (error) {
        console.error('Error unassigning trainer:', error);
      }
    }
  };

  if (!permissions.canManageClients) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to manage clients.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Manage your clients with {clients.length} total clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Clientes</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filters.status ?? 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.clientshipType ?? 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, clientshipType: value === 'all' ? '' : value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-5/6"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive">Error loading clients: {error}</p>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No clients found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filters.search || filters.status || filters.clientshipType
                      ? 'Try adjusting your filters to see more results.'
                      : 'Get started by adding your first client.'}
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
                  : "space-y-4"
                }>
                  {clients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onEdit={(client) => {
                        setSelectedClient(client);
                        setIsEditDialogOpen(true);
                      }}
                      onDelete={handleDeleteClient}
                      onAssignTrainer={handleAssignTrainer}
                      onUnassignTrainer={handleUnassignTrainer}
                      showActions={permissions.canManageClients}
                    />
                  ))}
                </div>
              )}
              
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clients
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => {/* Handle previous page */}}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => {/* Handle next page */}}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Active Clientes
              </CardTitle>
              <CardDescription>Clientes with active status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Active clients will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-primary" />
                Inactive Clientes
              </CardTitle>
              <CardDescription>Clientes with inactive status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Inactive clients will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="premium" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Premium Clientes
              </CardTitle>
              <CardDescription>Clientes with premium clientship</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Premium clients will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Member Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Add a new client to your organization.
            </DialogDescription>
          </DialogHeader>
          {/* Member Form Component would go here */}
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Member form component will be implemented here</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update the client details.
            </DialogDescription>
          </DialogHeader>
          {/* Member Form Component would go here */}
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Member form component will be implemented here</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Trainer Dialog */}
      <Dialog open={isAssignTrainerDialogOpen} onOpenChange={setIsAssignTrainerDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Trainer</DialogTitle>
            <DialogDescription>
              Assign a trainer to {selectedClient?.name}.
            </DialogDescription>
          </DialogHeader>
          {/* Trainer Assignment Component would go here */}
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Trainer assignment component will be implemented here</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
