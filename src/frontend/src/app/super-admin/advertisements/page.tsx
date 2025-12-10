'use client';

/**
 * Admin - Gestão de Anúncios
 * Página completa para gerenciar anúncios com CRUD e analytics
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import useSWR from 'swr';
import { Advertisement, AdType, AdPosition, CreateAdvertisementDTO } from '@/shared/types/advertisements.types';
import { Plus, Edit, Trash2, Eye, TrendingUp, MousePointerClick, BarChart3, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvertisementsAdminPage() {
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Buscar todos os anúncios para admin via endpoint específico
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const { data: adsData, error, isLoading, mutate } = useSWR<{ success: boolean; data: Advertisement[] }>(
    `${API_URL}/advertisements`,
    async (url) => {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error('Erro ao buscar anúncios');
      return response.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const ads = adsData?.data || [];

  // Filtrar anúncios
  const filteredAds = ads?.filter(ad => {
    if (filterType !== 'all' && ad.type !== filterType) return false;
    if (filterPosition !== 'all' && ad.position !== filterPosition) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && !ad.isActive) return false;
      if (filterStatus === 'inactive' && ad.isActive) return false;
    }
    return true;
  }) || [];

  // Calcular estatísticas
  const stats = {
    total: ads?.length || 0,
    active: ads?.filter(ad => ad.isActive).length || 0,
    totalViews: ads?.reduce((sum, ad) => sum + ad.impressionCount, 0) || 0,
    totalClicks: ads?.reduce((sum, ad) => sum + ad.clickCount, 0) || 0,
    avgCTR: ads?.length 
      ? (ads.reduce((sum, ad) => sum + (ad.clickCount / Math.max(ad.impressionCount, 1)), 0) / ads.length) * 100
      : 0,
  };

  const handleCreateAd = async (data: CreateAdvertisementDTO) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/advertisements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar anúncio');
      }

      toast.success('Anúncio criado com sucesso!');
      setIsCreateModalOpen(false);
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar anúncio');
    }
  };

  const handleUpdateAd = async (id: string, data: Partial<CreateAdvertisementDTO>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/advertisements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar anúncio');
      }

      toast.success('Anúncio atualizado com sucesso!');
      setIsEditModalOpen(false);
      setSelectedAd(null);
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar anúncio');
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este anúncio?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/advertisements/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar anúncio');
      }

      toast.success('Anúncio deletado com sucesso!');
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar anúncio');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Anúncios</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie anúncios e monitore performance
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Anúncio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Anúncio</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo anúncio
              </DialogDescription>
            </DialogHeader>
            <CreateAdForm onSubmit={handleCreateAd} onCancel={() => setIsCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Cliques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              CTR Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCTR.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="native">Native</SelectItem>
                  <SelectItem value="contextual">Contextual</SelectItem>
                  <SelectItem value="sponsored_content">Conteúdo Patrocinado</SelectItem>
                  <SelectItem value="affiliate">Afiliado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Posição</Label>
              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="between-content">Entre Conteúdo</SelectItem>
                  <SelectItem value="interstitial">Intersticial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ads List */}
      <Card>
        <CardHeader>
          <CardTitle>Anúncios ({filteredAds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum anúncio encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAds.map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  onEdit={() => {
                    setSelectedAd(ad);
                    setIsEditModalOpen(true);
                  }}
                  onDelete={() => handleDeleteAd(ad.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {selectedAd && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Anúncio</DialogTitle>
              <DialogDescription>
                Atualize os dados do anúncio
              </DialogDescription>
            </DialogHeader>
            <EditAdForm
              ad={selectedAd}
              onSubmit={(data) => handleUpdateAd(selectedAd.id, data)}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedAd(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Componente de Card de Anúncio
function AdCard({
  ad,
  onEdit,
  onDelete,
}: {
  ad: Advertisement;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ctr = ad.impressionCount > 0 
    ? ((ad.clickCount / ad.impressionCount) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{ad.title || 'Sem título'}</h3>
            <Badge variant={ad.isActive ? 'default' : 'secondary'}>
              {ad.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
            <Badge variant="outline">{ad.type}</Badge>
            <Badge variant="outline">{ad.position}</Badge>
          </div>
          {ad.description && (
            <p className="text-sm text-muted-foreground mb-2">{ad.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {ad.impressionCount.toLocaleString()} views
            </span>
            <span className="flex items-center gap-1">
              <MousePointerClick className="h-3 w-3" />
              {ad.clickCount.toLocaleString()} cliques
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {ctr}% CTR
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Formulário de criação
function CreateAdForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: CreateAdvertisementDTO) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<CreateAdvertisementDTO>({
    type: 'banner',
    position: 'header',
    isActive: true,
    priority: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as AdType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="native">Native</SelectItem>
              <SelectItem value="contextual">Contextual</SelectItem>
              <SelectItem value="sponsored_content">Conteúdo Patrocinado</SelectItem>
              <SelectItem value="affiliate">Afiliado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Posição *</Label>
          <Select
            value={formData.position}
            onValueChange={(value) => setFormData({ ...formData, position: value as AdPosition })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
              <SelectItem value="footer">Footer</SelectItem>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="between-content">Entre Conteúdo</SelectItem>
              <SelectItem value="interstitial">Intersticial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Título</Label>
        <Input
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Título do anúncio"
        />
      </div>

      <div>
        <Label>Descrição</Label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição do anúncio"
          rows={3}
        />
      </div>

      <div>
        <Label>URL da Imagem</Label>
        <Input
          value={formData.imageUrl || ''}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://exemplo.com/imagem.jpg"
          type="url"
        />
      </div>

      <div>
        <Label>URL de Destino</Label>
        <Input
          value={formData.targetUrl || ''}
          onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
          placeholder="https://exemplo.com"
          type="url"
        />
      </div>

      <div>
        <Label>Código de Anúncio (Google AdSense ou customizado)</Label>
        <Input
          value={formData.adCode || ''}
          onChange={(e) => setFormData({ ...formData, adCode: e.target.value })}
          placeholder="ca-pub-XXXXXXXXX ou código customizado"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.isActive ?? true}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label>Ativo</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label>Prioridade</Label>
          <Input
            type="number"
            value={formData.priority || 0}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
            className="w-20"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Criar Anúncio</Button>
      </div>
    </form>
  );
}

// Formulário de edição
function EditAdForm({
  ad,
  onSubmit,
  onCancel,
}: {
  ad: Advertisement;
  onSubmit: (data: Partial<CreateAdvertisementDTO>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<CreateAdvertisementDTO>>({
    type: ad.type,
    position: ad.position,
    title: ad.title || undefined,
    description: ad.description || undefined,
    imageUrl: ad.imageUrl || undefined,
    targetUrl: ad.targetUrl || undefined,
    adCode: ad.adCode || undefined,
    isActive: ad.isActive,
    priority: ad.priority,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as AdType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="native">Native</SelectItem>
              <SelectItem value="contextual">Contextual</SelectItem>
              <SelectItem value="sponsored_content">Conteúdo Patrocinado</SelectItem>
              <SelectItem value="affiliate">Afiliado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Posição *</Label>
          <Select
            value={formData.position}
            onValueChange={(value) => setFormData({ ...formData, position: value as AdPosition })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
              <SelectItem value="footer">Footer</SelectItem>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="between-content">Entre Conteúdo</SelectItem>
              <SelectItem value="interstitial">Intersticial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Título</Label>
        <Input
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Título do anúncio"
        />
      </div>

      <div>
        <Label>Descrição</Label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição do anúncio"
          rows={3}
        />
      </div>

      <div>
        <Label>URL da Imagem</Label>
        <Input
          value={formData.imageUrl || ''}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://exemplo.com/imagem.jpg"
          type="url"
        />
      </div>

      <div>
        <Label>URL de Destino</Label>
        <Input
          value={formData.targetUrl || ''}
          onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
          placeholder="https://exemplo.com"
          type="url"
        />
      </div>

      <div>
        <Label>Código de Anúncio</Label>
        <Input
          value={formData.adCode || ''}
          onChange={(e) => setFormData({ ...formData, adCode: e.target.value })}
          placeholder="ca-pub-XXXXXXXXX ou código customizado"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.isActive ?? true}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label>Ativo</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label>Prioridade</Label>
          <Input
            type="number"
            value={formData.priority || 0}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
            className="w-20"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar Alterações</Button>
      </div>
    </form>
  );
}
