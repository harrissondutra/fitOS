'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkoutCard } from '@/components/workouts/workout-card';
import { useWorkouts } from '@/hooks/use-workouts';
import { usePermissions } from '@/hooks/use-permissions';
import { Treino, TreinoFormData } from '@/shared/types';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Target,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react';

// Configurações para evitar problemas de SSR com useAuth
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

export default function TreinosPage() {
  // Auth removed - using default values
  const user = { role: 'ADMIN' as const };
  const permissions = usePermissions(user?.role);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    memberId: '',
    dateRange: ''
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTreino, setSelectedTreino] = useState<Treino | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { treinos, loading, error, pagination, createTreino, updateTreino, deleteTreino, completeTreino, cloneTreino } = useWorkouts({ filters });

  const handleCreateTreino = async (data: TreinoFormData) => {
    try {
      await createTreino(data);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating treino:', error);
    }
  };

  const handleEditTreino = async (data: Partial<TreinoFormData>) => {
    if (!selectedTreino) return;
    
    try {
      await updateTreino(selectedTreino.id, data);
      setIsEditDialogOpen(false);
      setSelectedTreino(null);
    } catch (error) {
      console.error('Error updating treino:', error);
    }
  };

  const handleDeleteTreino = async (treino: Treino) => {
    if (confirm(`Are you sure you want to delete "${treino.name}"?`)) {
      try {
        await deleteTreino(treino.id);
      } catch (error) {
        console.error('Error deleting treino:', error);
      }
    }
  };

  const handleCompleteTreino = async (treino: Treino) => {
    try {
      await completeTreino(treino.id);
    } catch (error) {
      console.error('Error completing treino:', error);
    }
  };

  const handleCloneTreino = async (treino: Treino) => {
    const clonedData: TreinoFormData = {
      name: `${treino.name} (Copy)`,
      description: treino.description || '',
      exercises: treino.exercises as any[],
      clientId: treino.clientId,
      aiGenerated: false
    };
    
    try {
      await createTreino(clonedData);
    } catch (error) {
      console.error('Error cloning treino:', error);
    }
  };

  if (!permissions.canManageWorkouts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to manage treinos.
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
          <h1 className="text-3xl font-bold tracking-tight">Treinos</h1>
          <p className="text-muted-foreground">
            Gerencie planos de treino com {treinos?.length || 0} treinos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Treino
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Treinos</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="ai-generated">AI Generated</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search treinos..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filters.status || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
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
                  <p className="text-destructive">Error loading treinos: {error}</p>
                </div>
              ) : treinos?.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No treinos found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filters.search || filters.status
                      ? 'Try adjusting your filters to see more results.'
                      : 'Get started by creating your first treino.'}
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Treino
                  </Button>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
                  : "space-y-4"
                }>
                  {treinos?.map((treino) => (
                    <WorkoutCard
                      key={treino.id}
                      treino={treino}
                      onEdit={(treino) => {
                        setSelectedTreino(treino);
                        setIsEditDialogOpen(true);
                      }}
                      onDelete={handleDeleteTreino}
                      onClone={handleCloneTreino}
                      onComplete={handleCompleteTreino}
                      showActions={permissions.canManageWorkouts}
                    />
                  ))}
                </div>
              )}
              
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} treinos
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
                <Calendar className="h-5 w-5 text-primary" />
                Active Treinos
              </CardTitle>
              <CardDescription>Treinos currently in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Active treinos will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Completed Treinos
              </CardTitle>
              <CardDescription>Treinos that have been completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Completed treinos will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-generated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                AI Generated Treinos
              </CardTitle>
              <CardDescription>Treinos created by AI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">AI generated treinos will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Treino Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Treino</DialogTitle>
            <DialogDescription>
              Create a new treino plan.
            </DialogDescription>
          </DialogHeader>
          {/* Treino Form Component would go here */}
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Treino form component will be implemented here</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Treino Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Treino</DialogTitle>
            <DialogDescription>
              Update the treino details.
            </DialogDescription>
          </DialogHeader>
          {/* Treino Form Component would go here */}
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Treino form component will be implemented here</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
