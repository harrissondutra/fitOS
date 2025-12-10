"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Activity, 
  Settings, 
  Shield, 
  Zap, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Save,
  Edit,
  Trash2,
  Plus
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Limit {
  id: string;
  name: string;
  description: string;
  category: 'rate' | 'cost' | 'usage' | 'concurrent';
  type: 'global' | 'per_user' | 'per_provider' | 'per_service';
  value: number;
  unit: 'requests' | 'tokens' | 'dollars' | 'minutes' | 'hours' | 'days';
  period: 'minute' | 'hour' | 'day' | 'month';
  isActive: boolean;
  isEnforced: boolean;
  currentUsage: number;
  lastReset: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  plan?: string;
  provider?: string;
}

const categoryIcons: { [key: string]: any } = {
  rate: Zap,
  cost: DollarSign,
  usage: Activity,
  concurrent: Users,
};

const categoryColors: { [key: string]: string } = {
  rate: "bg-blue-100 text-blue-800",
  cost: "bg-green-100 text-green-800",
  usage: "bg-purple-100 text-purple-800",
  concurrent: "bg-orange-100 text-orange-800",
};

const typeLabels: { [key: string]: string } = {
  global: "Global",
  per_user: "Por Usuário",
  per_provider: "Por Provedor",
  per_service: "Por Serviço",
};

export default function AILimitsPage() {
  const [limits, setLimits] = useState<Limit[]>([]);
  const [filteredLimits, setFilteredLimits] = useState<Limit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingLimit, setEditingLimit] = useState<Limit | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/ai/limits', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar limites');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Converter strings de data para Date objects
        const formattedLimits = result.data.map((limit: any) => ({
          ...limit,
          lastReset: limit.lastReset ? new Date(limit.lastReset) : new Date(),
          createdAt: limit.createdAt ? new Date(limit.createdAt) : new Date(),
          updatedAt: limit.updatedAt ? new Date(limit.updatedAt) : new Date()
        }));
        setLimits(formattedLimits);
        setFilteredLimits(formattedLimits);
      }
    } catch (error: any) {
      console.error('Erro ao carregar limites:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os limites',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    
    let filtered = limits;

    if (searchTerm) {
      filtered = filtered.filter(limit =>
        limit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        limit.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(limit => limit.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(limit => limit.isActive);
      } else if (statusFilter === "enforced") {
        filtered = filtered.filter(limit => limit.isEnforced);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(limit => !limit.isActive);
      }
    }

    setFilteredLimits(filtered);
  }, [limits, searchTerm, categoryFilter, statusFilter]);

  const handleToggleActive = async (limitId: string) => {
    try {
      const limit = limits.find(l => l.id === limitId);
      if (!limit) return;

      // Atualizar localmente primeiro
      setLimits(prev => prev.map(l =>
        l.id === limitId ? { ...l, isActive: !l.isActive } : l
      ));

      // Atualizar na API
      const response = await fetch(`/api/super-admin/ai/limits/${limitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          value: limit.value,
          isActive: !limit.isActive,
          isEnforced: limit.isEnforced
        })
      });

      if (!response.ok) {
        // Reverter mudança local
        setLimits(prev => prev.map(l =>
          l.id === limitId ? { ...l, isActive: limit.isActive } : l
        ));
        throw new Error('Erro ao atualizar limite');
      }

      toast({
        title: 'Sucesso',
        description: 'Limite atualizado com sucesso'
      });
    } catch (error: any) {
      console.error('Error toggling limit:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o limite',
        variant: 'destructive'
      });
    }
  };

  const handleToggleEnforced = async (limitId: string) => {
    try {
      const limit = limits.find(l => l.id === limitId);
      if (!limit) return;

      // Atualizar localmente primeiro
      setLimits(prev => prev.map(l =>
        l.id === limitId ? { ...l, isEnforced: !l.isEnforced } : l
      ));

      // Atualizar na API
      const response = await fetch(`/api/super-admin/ai/limits/${limitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          value: limit.value,
          isActive: limit.isActive,
          isEnforced: !limit.isEnforced
        })
      });

      if (!response.ok) {
        // Reverter mudança local
        setLimits(prev => prev.map(l =>
          l.id === limitId ? { ...l, isEnforced: limit.isEnforced } : l
        ));
        throw new Error('Erro ao atualizar limite');
      }

      toast({
        title: 'Sucesso',
        description: 'Limite atualizado com sucesso'
      });
    } catch (error: any) {
      console.error('Error toggling enforcement:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o limite',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteLimit = async (limitId: string) => {
    if (!confirm('Tem certeza que deseja deletar este limite?')) {
      return;
    }

    try {
      // Remover localmente (limites são derivados de planos, então não podem ser deletados diretamente)
      // Apenas mostrar mensagem
      toast({
        title: 'Info',
        description: 'Limites são configurados por plano. Para remover, edite o plano correspondente.'
      });
    } catch (error: any) {
      console.error('Error deleting limit:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível deletar o limite',
        variant: 'destructive'
      });
    }
  };

  const getUsagePercentage = (limit: Limit) => {
    return Math.round((limit.currentUsage / limit.value) * 100);
  };

  const getUsageColor = (limit: Limit) => {
    const percentage = getUsagePercentage(limit);
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const getUsageStatus = (limit: Limit) => {
    const percentage = getUsagePercentage(limit);
    if (percentage >= 90) return "Crítico";
    if (percentage >= 70) return "Atenção";
    return "Normal";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Limites IA</h1>
          <p className="text-muted-foreground">
            Gerencie limites e controles do sistema de IA
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadLimits} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Sistema Ativo
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar limites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="rate">Rate Limit</SelectItem>
            <SelectItem value="cost">Custo</SelectItem>
            <SelectItem value="usage">Uso</SelectItem>
            <SelectItem value="concurrent">Concorrência</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="enforced">Aplicado</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Limites</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{limits.length}</div>
            <p className="text-xs text-muted-foreground">configurados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {limits.filter(l => l.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">funcionando</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aplicados</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {limits.filter(l => l.isEnforced).length}
            </div>
            <p className="text-xs text-muted-foreground">em vigor</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {limits.filter(l => getUsagePercentage(l) >= 90).length}
            </div>
            <p className="text-xs text-muted-foreground">precisam atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && limits.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Limits List */}
          <div className="space-y-4">
            {filteredLimits.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum limite encontrado</h3>
                  <p className="text-muted-foreground text-center">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                      ? 'Tente ajustar os filtros'
                      : 'Configure limites nos planos de assinatura'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredLimits.map((limit) => {
          const Icon = categoryIcons[limit.category] || Settings;
          const usagePercentage = getUsagePercentage(limit);
          const usageColor = getUsageColor(limit);
          const usageStatus = getUsageStatus(limit);
          
          return (
            <Card key={limit.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      categoryColors[limit.category].split(' ')[0]
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        categoryColors[limit.category].split(' ')[1]
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{limit.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {limit.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={categoryColors[limit.category]}>
                      {typeLabels[limit.type]}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={limit.isActive}
                        onCheckedChange={() => handleToggleActive(limit.id)}
                        disabled={loading}
                      />
                      <span className="text-sm text-muted-foreground">
                        {limit.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Valor</Label>
                    <div className="text-lg font-semibold">
                      {limit.value.toLocaleString()} {limit.unit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      por {limit.period}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Uso Atual</Label>
                    <div className="text-lg font-semibold">
                      {limit.currentUsage.toLocaleString()} {limit.unit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {usagePercentage}% utilizado
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className={`text-lg font-semibold ${usageColor}`}>
                      {usageStatus}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {limit.isEnforced ? 'Aplicado' : 'Não aplicado'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{usagePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        usagePercentage >= 90 ? 'bg-red-500' :
                        usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Último reset: {limit.lastReset.toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingLimit(limit)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleEnforced(limit.id)}
                      disabled={loading}
                    >
                      {limit.isEnforced ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLimit(limit.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
        </CardContent>
      </Card>
              );
            })
            )}
          </div>
        </>
      )}
    </div>
  )
}