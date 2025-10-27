'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  UtensilsCrossed, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Calendar,
  Users,
  Target,
  Clock,
  TrendingUp,
  FileText,
  Star
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function MealPlansPage() {
  const mealPlans = [
    {
      id: 1,
      name: "Plano Perda de Peso - 1500kcal",
      client: "Maria Silva",
      calories: 1500,
      protein: 120,
      carbs: 150,
      fat: 50,
      status: "active",
      createdAt: "15/01/2024",
      meals: 5,
      adherence: 85,
      rating: 4.8,
      template: false
    },
    {
      id: 2,
      name: "Plano Ganho de Massa - 2500kcal",
      client: "João Santos",
      calories: 2500,
      protein: 180,
      carbs: 250,
      fat: 80,
      status: "active",
      createdAt: "20/01/2024",
      meals: 6,
      adherence: 92,
      rating: 4.9,
      template: false
    },
    {
      id: 3,
      name: "Template - Plano Vegetariano",
      client: "Template",
      calories: 1800,
      protein: 90,
      carbs: 200,
      fat: 60,
      status: "template",
      createdAt: "10/01/2024",
      meals: 4,
      adherence: 0,
      rating: 4.5,
      template: true
    },
    {
      id: 4,
      name: "Plano Controle Glicêmico",
      client: "Ana Costa",
      calories: 1600,
      protein: 100,
      carbs: 120,
      fat: 70,
      status: "draft",
      createdAt: "25/01/2024",
      meals: 5,
      adherence: 0,
      rating: 0,
      template: false
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Rascunho</Badge>;
      case 'template':
        return <Badge className="bg-blue-100 text-blue-800">Template</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = [
    { title: "Total de Planos", value: "24", icon: UtensilsCrossed, color: "text-blue-600" },
    { title: "Planos Ativos", value: "18", icon: TrendingUp, color: "text-green-600" },
    { title: "Templates", value: "5", icon: FileText, color: "text-purple-600" },
    { title: "Rascunhos", value: "1", icon: Clock, color: "text-yellow-600" }
  ];

  const quickActions = [
    {
      title: "Novo Plano",
      description: "Criar plano personalizado",
      icon: Plus,
      color: "bg-blue-500"
    },
    {
      title: "Usar Template",
      description: "Baseado em template existente",
      icon: FileText,
      color: "bg-green-500"
    },
    {
      title: "Criar Template",
      description: "Novo template reutilizável",
      icon: Star,
      color: "bg-purple-500"
    },
    {
      title: "Importar Plano",
      description: "Importar de arquivo",
      icon: Copy,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planos Alimentares</h1>
          <p className="text-muted-foreground">
            Crie e gerencie planos nutricionais personalizados
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full" variant="outline">
                Acessar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Meal Plans Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Planos Alimentares</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar planos..."
                  className="w-80 pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Todos (24)</TabsTrigger>
              <TabsTrigger value="active">Ativos (18)</TabsTrigger>
              <TabsTrigger value="templates">Templates (5)</TabsTrigger>
              <TabsTrigger value="drafts">Rascunhos (1)</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plano</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Macros</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Adesão</TableHead>
                      <TableHead>Avaliação</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mealPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {plan.meals} refeições • Criado em {plan.createdAt}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{plan.client}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">{plan.calories}</span> kcal
                            </div>
                            <div className="text-xs text-muted-foreground">
                              P: {plan.protein}g • C: {plan.carbs}g • G: {plan.fat}g
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(plan.status)}
                        </TableCell>
                        <TableCell>
                          {plan.adherence > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{plan.adherence}%</span>
                              </div>
                              <Progress value={plan.adherence} className="h-2" />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {plan.rating > 0 ? (
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-sm">{plan.rating}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>
                              {plan.template && (
                                <DropdownMenuItem>
                                  <Star className="mr-2 h-4 w-4" />
                                  Usar Template
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Planos Ativos</h3>
                <p className="text-muted-foreground">
                  Planos em uso pelos clientes
                </p>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Templates</h3>
                <p className="text-muted-foreground">
                  Modelos reutilizáveis para novos planos
                </p>
              </div>
            </TabsContent>

            <TabsContent value="drafts" className="space-y-4">
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Rascunhos</h3>
                <p className="text-muted-foreground">
                  Planos em desenvolvimento
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Meal Plan Creator Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UtensilsCrossed className="w-5 h-5 mr-2" />
            Criador de Planos Alimentares
          </CardTitle>
          <CardDescription>
            Ferramenta visual para criar planos nutricionais personalizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold">Recursos do Criador:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <Target className="w-4 h-4 mr-2 text-green-600" />
                  Cálculo automático de macros
                </li>
                <li className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  Distribuição de refeições
                </li>
                <li className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-purple-600" />
                  Personalização por cliente
                </li>
                <li className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-orange-600" />
                  Biblioteca de receitas
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Próximos Passos:</h4>
              <div className="space-y-2">
                <Button className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Novo Plano
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Usar Template
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar Plano Existente
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


