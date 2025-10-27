'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface TenantData {
  tenantId: string;
  stage: string;
  daysInStage: number;
  healthScore: number;
  lastActivity: string;
  nextAction?: string;
  riskFactors: string[];
}

interface HealthData {
  tenantId: string;
  tenantName: string;
  healthScore: number;
  usageScore: number;
  adoptionScore: number;
  supportScore: number;
  paymentScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastCalculated: string;
  riskFactors: string[];
  recommendedActions: string[];
  trend: 'improving' | 'stable' | 'declining';
}

interface UpgradeOpportunity {
  tenantId: string;
  tenantName: string;
  currentPlan: string;
  suggestedPlan: string;
  reasons: string[];
  confidence: number;
}

interface ChurnPrediction {
  tenantId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendedActions: string[];
  daysToChurn?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TenantsDashboard() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [overview, setOverview] = useState<any>(null);
  const [lifecycleData, setLifecycleData] = useState<TenantData[]>([]);
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [upgradeOpportunities, setUpgradeOpportunities] = useState<UpgradeOpportunity[]>([]);
  const [churnPredictions, setChurnPredictions] = useState<ChurnPrediction[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tenants/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setOverview(data.data.overview);
        setLifecycleData(data.data.lifecycleData);
        setHealthData(data.data.healthData);
        setUpgradeOpportunities(data.data.upgradeOpportunities);
        setChurnPredictions(data.data.churnPredictions);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLifecycleData = lifecycleData.filter(tenant => {
    const matchesSearch = tenant.tenantId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = filterStage === 'all' || tenant.stage === filterStage;
    return matchesSearch && matchesStage;
  });

  const filteredHealthData = healthData.filter(tenant => {
    const matchesSearch = tenant.tenantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || tenant.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const stageDistribution = lifecycleData.reduce((acc, tenant) => {
    acc[tenant.stage] = (acc[tenant.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskDistribution = healthData.reduce((acc, tenant) => {
    acc[tenant.riskLevel] = (acc[tenant.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800';
      case 'churned': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants Dashboard</h1>
          <p className="text-muted-foreground">
            Gestão completa de tenants e análise de saúde do negócio
          </p>
        </div>
        <Button onClick={fetchDashboardData}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalTenants || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.activeTenants || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overview?.atRiskTenants || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.avgHealthScore || 0}</div>
            <p className="text-xs text-muted-foreground">
              Score de 0-100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{upgradeOpportunities.length}</div>
            <p className="text-xs text-muted-foreground">
              Upgrade disponível
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Estágio</CardTitle>
            <CardDescription>Tenants agrupados por estágio do ciclo de vida</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(stageDistribution).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(stageDistribution).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Risco</CardTitle>
            <CardDescription>Nível de risco dos tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(riskDistribution).map(([name, value]) => ({ name, value }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lifecycle" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lifecycle">Ciclo de Vida</TabsTrigger>
          <TabsTrigger value="health">Health Scores</TabsTrigger>
          <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
          <TabsTrigger value="churn">Churn Risk</TabsTrigger>
        </TabsList>

        {/* Lifecycle Tab */}
        <TabsContent value="lifecycle" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ciclo de Vida dos Tenants</CardTitle>
                  <CardDescription>Análise do estágio atual de cada tenant</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar tenant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrar por estágio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estágios</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="at_risk">Em Risco</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant ID</TableHead>
                    <TableHead>Estágio</TableHead>
                    <TableHead>Dias no Estágio</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead>Próxima Ação</TableHead>
                    <TableHead>Fatores de Risco</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLifecycleData.map((tenant) => (
                    <TableRow key={tenant.tenantId}>
                      <TableCell className="font-medium">{tenant.tenantId}</TableCell>
                      <TableCell>
                        <Badge className={getStageColor(tenant.stage)}>
                          {tenant.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>{tenant.daysInStage} dias</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${tenant.healthScore}%` }}
                            />
                          </div>
                          <span className="text-sm">{tenant.healthScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(tenant.lastActivity).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tenant.nextAction || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tenant.riskFactors.slice(0, 2).map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                          {tenant.riskFactors.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{tenant.riskFactors.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Health Scores dos Tenants</CardTitle>
                  <CardDescription>Análise detalhada da saúde de cada tenant</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar tenant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={filterRisk} onValueChange={setFilterRisk}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrar por risco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os níveis</SelectItem>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Adoção</TableHead>
                    <TableHead>Suporte</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Nível de Risco</TableHead>
                    <TableHead>Tendência</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHealthData.map((tenant) => (
                    <TableRow key={tenant.tenantId}>
                      <TableCell className="font-medium">{tenant.tenantName}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${tenant.healthScore}%` }}
                            />
                          </div>
                          <span className="text-sm">{tenant.healthScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>{tenant.usageScore}</TableCell>
                      <TableCell>{tenant.adoptionScore}</TableCell>
                      <TableCell>{tenant.supportScore}</TableCell>
                      <TableCell>{tenant.paymentScore}</TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(tenant.riskLevel)}>
                          {tenant.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            tenant.trend === 'improving' 
                              ? 'text-green-600 border-green-600' 
                              : tenant.trend === 'declining'
                              ? 'text-red-600 border-red-600'
                              : 'text-gray-600 border-gray-600'
                          }
                        >
                          {tenant.trend}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upgrades Tab */}
        <TabsContent value="upgrades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Oportunidades de Upgrade</CardTitle>
              <CardDescription>Tenants que podem ser upgradeados para planos superiores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Plano Atual</TableHead>
                    <TableHead>Plano Sugerido</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Motivos</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upgradeOpportunities.map((opportunity) => (
                    <TableRow key={opportunity.tenantId}>
                      <TableCell className="font-medium">{opportunity.tenantName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{opportunity.currentPlan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {opportunity.suggestedPlan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${opportunity.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm">{opportunity.confidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {opportunity.reasons.map((reason, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Churn Risk Tab */}
        <TabsContent value="churn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predições de Churn</CardTitle>
              <CardDescription>Tenants com maior probabilidade de churn</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant ID</TableHead>
                    <TableHead>Probabilidade</TableHead>
                    <TableHead>Nível de Risco</TableHead>
                    <TableHead>Dias até Churn</TableHead>
                    <TableHead>Fatores de Risco</TableHead>
                    <TableHead>Ações Recomendadas</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {churnPredictions.map((prediction) => (
                    <TableRow key={prediction.tenantId}>
                      <TableCell className="font-medium">{prediction.tenantId}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-red-600 h-2 rounded-full" 
                              style={{ width: `${prediction.churnProbability}%` }}
                            />
                          </div>
                          <span className="text-sm">{prediction.churnProbability}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(prediction.riskLevel)}>
                          {prediction.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {prediction.daysToChurn ? `${prediction.daysToChurn} dias` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {prediction.riskFactors.slice(0, 2).map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                          {prediction.riskFactors.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{prediction.riskFactors.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {prediction.recommendedActions.slice(0, 2).map((action, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                          {prediction.recommendedActions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{prediction.recommendedActions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}









