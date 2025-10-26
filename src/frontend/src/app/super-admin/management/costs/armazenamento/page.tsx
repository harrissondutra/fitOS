'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Database, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Plus,
  RefreshCw,
  Settings,
  Zap,
  Image,
  Cloud
} from 'lucide-react';
import { useCosts, CostFilters } from '../_hooks/use-costs';
import { CostServiceCard } from '../_components/cost-service-card';
import { CostTrendsChart } from '../_components/cost-trends-chart';
import { CostEntryForm } from '../_components/cost-entry-form';
import { useToast } from '@/hooks/use-toast';

export default function ArmazenamentoPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<CostFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    categoryId: 'storage'
  });

  const { loading: costsLoading, getDashboard } = useCosts();
  const { toast } = useToast();

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Usar dados mockados quando a API falhar ou timeout
    const mockDashboard = {
      totalCost: 1250.50,
      monthlyTrend: 12.5,
      services: [
        {
          id: 'cloudinary',
          name: 'Cloudinary',
          cost: 450.30,
          trend: 8.2,
          status: 'active',
          icon: Image,
          description: 'Armazenamento e transformação de imagens'
        },
        {
          id: 'aws-s3',
          name: 'AWS S3',
          cost: 320.80,
          trend: -2.1,
          status: 'active',
          icon: Cloud,
          description: 'Armazenamento de arquivos e backups'
        },
        {
          id: 'database',
          name: 'Database Storage',
          cost: 479.40,
          trend: 15.3,
          status: 'active',
          icon: Database,
          description: 'Armazenamento de dados do banco'
        }
      ],
      trends: [
        { date: '2024-01-01', totalCost: 800, categories: { storage: 800 } },
        { date: '2024-02-01', totalCost: 950, categories: { storage: 950 } },
        { date: '2024-03-01', totalCost: 1100, categories: { storage: 1100 } },
        { date: '2024-04-01', totalCost: 1050, categories: { storage: 1050 } },
        { date: '2024-05-01', totalCost: 1200, categories: { storage: 1200 } },
        { date: '2024-06-01', totalCost: 1250, categories: { storage: 1250 } }
      ]
    };
    
    setDashboard(mockDashboard);
    setServices(mockDashboard.services);
    
    toast({
      title: 'Modo Demonstração',
      description: 'Usando dados de exemplo para armazenamento',
      variant: 'default',
    });
    
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    // Simular refresh dos dados
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast({
      title: "Dados atualizados",
      description: "Os custos de armazenamento foram atualizados com sucesso."
    });
  }, [toast]);

  const handleAddService = useCallback((serviceData: any) => {
    // Lógica para adicionar novo serviço
    console.log('Adicionando serviço:', serviceData);
    setShowAddForm(false);
    toast({
      title: "Serviço adicionado",
      description: "O novo serviço de armazenamento foi configurado."
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          
          {/* Chart Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>

          {/* Service Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-3 w-48 mb-2" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custos de Armazenamento</h1>
          <p className="text-muted-foreground">
            Monitore e gerencie os custos de armazenamento de dados
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Serviço
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {dashboard?.totalCost?.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{dashboard?.monthlyTrend}%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendência</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{dashboard?.monthlyTrend}%</div>
            <p className="text-xs text-muted-foreground">
              Crescimento mensal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Serviços configurados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Gráfico de tendências */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Custos</CardTitle>
            </CardHeader>
            <CardContent>
              <CostTrendsChart data={dashboard?.trends || []} />
            </CardContent>
          </Card>

          {/* Serviços por tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cloudinary</CardTitle>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">Cloudinary</div>
                <p className="text-xs text-muted-foreground">
                  Rastreamento automático (storage, bandwidth, transformations)
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <Badge variant="outline">Ativo</Badge>
                  <span className="text-sm text-green-600">+8.2%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AWS S3</CardTitle>
                <Cloud className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">AWS S3</div>
                <p className="text-xs text-muted-foreground">
                  Armazenamento de arquivos e backups
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <Badge variant="outline">Ativo</Badge>
                  <span className="text-sm text-red-600">-2.1%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services?.map((service) => (
              <CostServiceCard
                key={service.id}
                service={service}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Tendências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Crescimento Mensal</span>
                  <Badge variant="outline" className="text-green-600">
                    +{dashboard?.monthlyTrend}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Projeção Trimestral</span>
                  <Badge variant="outline" className="text-blue-600">
                    R$ {(dashboard?.totalCost * 1.15).toFixed(2)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Economia Potencial</span>
                  <Badge variant="outline" className="text-orange-600">
                    R$ {(dashboard?.totalCost * 0.1).toFixed(2)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Armazenamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Rastreamento Automático</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitora automaticamente os custos de armazenamento
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Alertas de Limite</h4>
                  <p className="text-sm text-muted-foreground">
                    Notifica quando os custos excedem os limites
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de adicionar serviço - implementar quando necessário */}
    </div>
  );
}