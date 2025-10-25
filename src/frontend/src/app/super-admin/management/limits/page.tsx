"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Shield, 
  Users, 
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Lock,
  Unlock,
  Building2,
  UserCog,
  Target,
  Calendar,
  MessageCircle,
  Stethoscope,
  PieChart,
  BarChart,
  Activity,
  TrendingUp,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  HardDrive,
  Cloud,
  Server,
  Monitor,
  Smartphone,
  Watch,
  Globe,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Wallet,
  Receipt,
  Calculator,
  BarChart3,
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Upload
} from "lucide-react"

interface Limit {
  id: string;
  name: string;
  description: string;
  category: 'rate' | 'cost' | 'usage' | 'concurrent' | 'storage' | 'api' | 'user' | 'system';
  type: 'global' | 'per_user' | 'per_provider' | 'per_service' | 'per_plan';
  value: number;
  unit: 'requests' | 'tokens' | 'dollars' | 'minutes' | 'hours' | 'days' | 'mb' | 'gb' | 'tb' | 'calls';
  period: 'minute' | 'hour' | 'day' | 'month' | 'year' | 'instant';
  isActive: boolean;
  isEnforced: boolean;
  currentUsage: number;
  lastReset: Date;
  createdAt: Date;
  updatedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  warningThreshold: number;
  criticalThreshold: number;
}

const mockLimits: Limit[] = [
  {
    id: '1',
    name: 'Rate Limit Global',
    description: 'Limite global de requisições por minuto',
    category: 'rate',
    type: 'global',
    value: 1000,
    unit: 'requests',
    period: 'minute',
    isActive: true,
    isEnforced: true,
    currentUsage: 450,
    lastReset: new Date('2024-01-15T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
    priority: 'high',
    warningThreshold: 70,
    criticalThreshold: 90
  },
  {
    id: '2',
    name: 'Custo Mensal',
    description: 'Limite de custo total por mês',
    category: 'cost',
    type: 'global',
    value: 500,
    unit: 'dollars',
    period: 'month',
    isActive: true,
    isEnforced: true,
    currentUsage: 125.50,
    lastReset: new Date('2024-01-01T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
    priority: 'critical',
    warningThreshold: 60,
    criticalThreshold: 80
  },
  {
    id: '3',
    name: 'Tokens por Usuário',
    description: 'Limite de tokens por usuário por dia',
    category: 'usage',
    type: 'per_user',
    value: 10000,
    unit: 'tokens',
    period: 'day',
    isActive: true,
    isEnforced: true,
    currentUsage: 0,
    lastReset: new Date('2024-01-15T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
    priority: 'medium',
    warningThreshold: 75,
    criticalThreshold: 90
  },
  {
    id: '4',
    name: 'Requisições Concorrentes',
    description: 'Número máximo de requisições simultâneas',
    category: 'concurrent',
    type: 'global',
    value: 50,
    unit: 'requests',
    period: 'minute',
    isActive: true,
    isEnforced: true,
    currentUsage: 12,
    lastReset: new Date('2024-01-15T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
    priority: 'high',
    warningThreshold: 60,
    criticalThreshold: 80
  },
  {
    id: '5',
    name: 'Storage por Usuário',
    description: 'Limite de armazenamento por usuário',
    category: 'storage',
    type: 'per_user',
    value: 5,
    unit: 'gb',
    period: 'month',
    isActive: true,
    isEnforced: true,
    currentUsage: 1.2,
    lastReset: new Date('2024-01-01T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
    priority: 'medium',
    warningThreshold: 70,
    criticalThreshold: 85
  },
  {
    id: '6',
    name: 'API Calls por Dia',
    description: 'Limite de chamadas de API por dia',
    category: 'api',
    type: 'per_user',
    value: 1000,
    unit: 'calls',
    period: 'day',
    isActive: false,
    isEnforced: false,
    currentUsage: 0,
    lastReset: new Date('2024-01-15T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
    priority: 'low',
    warningThreshold: 80,
    criticalThreshold: 95
  }
];

const categoryIcons: { [key: string]: any } = {
  rate: Zap,
  cost: DollarSign,
  usage: Activity,
  concurrent: Users,
  storage: HardDrive,
  api: Server,
  user: UserCog,
  system: Settings,
};

const categoryColors: { [key: string]: string } = {
  rate: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  cost: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  usage: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  concurrent: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  storage: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  api: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  user: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  system: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const typeLabels: { [key: string]: string } = {
  global: "Global",
  per_user: "Por Usuário",
  per_provider: "Por Provedor",
  per_service: "Por Serviço",
  per_plan: "Por Plano",
};

const priorityColors: { [key: string]: string } = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function LimitsPage() {
  const [limits, setLimits] = useState<Limit[]>(mockLimits);
  const [filteredLimits, setFilteredLimits] = useState<Limit[]>(mockLimits);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [editingLimit, setEditingLimit] = useState<Limit | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
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

    if (priorityFilter !== "all") {
      filtered = filtered.filter(limit => limit.priority === priorityFilter);
    }

    setFilteredLimits(filtered);
  }, [limits, searchTerm, categoryFilter, statusFilter, priorityFilter]);

  const handleToggleActive = async (limitId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setLimits(prev => prev.map(limit =>
        limit.id === limitId
          ? { ...limit, isActive: !limit.isActive }
          : limit
      ));
    } catch (error) {
      console.error('Error toggling limit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnforced = async (limitId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setLimits(prev => prev.map(limit =>
        limit.id === limitId
          ? { ...limit, isEnforced: !limit.isEnforced }
          : limit
      ));
    } catch (error) {
      console.error('Error toggling enforcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLimit = async (limitId: string) => {
    if (confirm('Tem certeza que deseja deletar este limite?')) {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setLimits(prev => prev.filter(limit => limit.id !== limitId));
      } catch (error) {
        console.error('Error deleting limit:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getUsagePercentage = (limit: Limit) => {
    return Math.round((limit.currentUsage / limit.value) * 100);
  };

  const getUsageColor = (limit: Limit) => {
    const percentage = getUsagePercentage(limit);
    if (percentage >= limit.criticalThreshold) return "text-red-600 dark:text-red-400";
    if (percentage >= limit.warningThreshold) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getUsageStatus = (limit: Limit) => {
    const percentage = getUsagePercentage(limit);
    if (percentage >= limit.criticalThreshold) return "Crítico";
    if (percentage >= limit.warningThreshold) return "Atenção";
    return "Normal";
  };

  const getProgressColor = (limit: Limit) => {
    const percentage = getUsagePercentage(limit);
    if (percentage >= limit.criticalThreshold) return "bg-red-500";
    if (percentage >= limit.warningThreshold) return "bg-yellow-500";
    return "bg-green-500";
  };

  const criticalLimits = limits.filter(l => getUsagePercentage(l) >= l.criticalThreshold);
  const warningLimits = limits.filter(l => {
    const percentage = getUsagePercentage(l);
    return percentage >= l.warningThreshold && percentage < l.criticalThreshold;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Limites do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie limites e controles do sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setLoading(true)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Limite
          </Button>
        </div>
      </div>

      {/* Alert Cards */}
      {criticalLimits.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800 dark:text-red-200">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Limites Críticos
            </CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              {criticalLimits.length} limite(s) atingiram o nível crítico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalLimits.map(limit => (
                <div key={limit.id} className="flex items-center justify-between p-2 bg-red-100 dark:bg-red-900 rounded">
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">{limit.name}</span>
                  <Badge variant="destructive">
                    {getUsagePercentage(limit)}% utilizado
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {warningLimits.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800 dark:text-yellow-200">
              <Clock className="h-5 w-5 mr-2" />
              Limites em Atenção
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              {warningLimits.length} limite(s) precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warningLimits.map(limit => (
                <div key={limit.id} className="flex items-center justify-between p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{limit.name}</span>
                  <Badge variant="secondary" className="bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                    {getUsagePercentage(limit)}% utilizado
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar limites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="rate">Rate Limit</SelectItem>
                  <SelectItem value="cost">Custo</SelectItem>
                  <SelectItem value="usage">Uso</SelectItem>
                  <SelectItem value="concurrent">Concorrência</SelectItem>
                  <SelectItem value="storage">Armazenamento</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="enforced">Aplicado</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              {criticalLimits.length}
            </div>
            <p className="text-xs text-muted-foreground">precisam atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLimits.map((limit) => {
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
                        <Badge className={priorityColors[limit.priority]}>
                          {limit.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className={`text-sm ${usageColor}`}>
                          {usagePercentage}% utilizado
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span className={usageColor}>{usagePercentage}%</span>
                      </div>
                      <Progress 
                        value={usagePercentage} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span className={usageColor}>{usageStatus}</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
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
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={limit.isEnforced}
                          onCheckedChange={() => handleToggleEnforced(limit.id)}
                          disabled={loading}
                        />
                        <span className="text-sm text-muted-foreground">
                          {limit.isEnforced ? 'Aplicado' : 'Não aplicado'}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Último reset: {limit.lastReset.toLocaleDateString('pt-BR')}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingLimit(limit)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deletar Limite</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja deletar o limite "{limit.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteLimit(limit.id)}>
                              Deletar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Limites em Tabela</CardTitle>
              <CardDescription>
                Visualização detalhada de todos os limites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLimits.map((limit) => {
                    const Icon = categoryIcons[limit.category] || Settings;
                    const usagePercentage = getUsagePercentage(limit);
                    
                    return (
                      <TableRow key={limit.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{limit.name}</div>
                              <div className="text-sm text-muted-foreground">{limit.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={categoryColors[limit.category]}>
                            {limit.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{typeLabels[limit.type]}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {limit.value.toLocaleString()} {limit.unit}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            por {limit.period}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {limit.currentUsage.toLocaleString()} {limit.unit}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {usagePercentage}% utilizado
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              limit.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <span className="text-sm">
                              {limit.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[limit.priority]}>
                            {limit.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingLimit(limit)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLimit(limit.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
                <CardDescription>
                  Limites agrupados por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    limits.reduce((acc, limit) => {
                      acc[limit.category] = (acc[limit.category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, count]) => {
                    const Icon = categoryIcons[category] || Settings;
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">{category}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status de Uso</CardTitle>
                <CardDescription>
                  Distribuição por nível de uso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm">Crítico</span>
                    </div>
                    <Badge variant="destructive">{criticalLimits.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm">Atenção</span>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      {warningLimits.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Normal</span>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {limits.length - criticalLimits.length - warningLimits.length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {filteredLimits.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum limite encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou criar um novo limite
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Limite
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}