'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Database, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Eye,
  Edit,
  Star,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  UtensilsCrossed,
  Apple,
  Beef,
  Fish,
  Milk,
  Wheat
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function FoodDatabasePage() {
  const foods = [
    {
      id: 1,
      name: "Frango (peito, sem pele)",
      category: "Proteínas",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sodium: 74,
      source: "TACO",
      verified: true,
      popularity: 95,
      icon: Beef
    },
    {
      id: 2,
      name: "Arroz branco cozido",
      category: "Carboidratos",
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      fiber: 0.4,
      sodium: 1,
      source: "TACO",
      verified: true,
      popularity: 88,
      icon: Wheat
    },
    {
      id: 3,
      name: "Salmão (grelhado)",
      category: "Proteínas",
      calories: 208,
      protein: 25,
      carbs: 0,
      fat: 12,
      fiber: 0,
      sodium: 44,
      source: "TACO",
      verified: true,
      popularity: 82,
      icon: Fish
    },
    {
      id: 4,
      name: "Maçã (com casca)",
      category: "Frutas",
      calories: 52,
      protein: 0.3,
      carbs: 14,
      fat: 0.2,
      fiber: 2.4,
      sodium: 1,
      source: "TACO",
      verified: true,
      popularity: 90,
      icon: Apple
    },
    {
      id: 5,
      name: "Leite desnatado",
      category: "Laticínios",
      calories: 34,
      protein: 3.4,
      carbs: 5,
      fat: 0.2,
      fiber: 0,
      sodium: 42,
      source: "TACO",
      verified: true,
      popularity: 75,
      icon: Milk
    }
  ];

  const categories = [
    { name: "Proteínas", count: 156, icon: Beef, color: "text-red-600" },
    { name: "Carboidratos", count: 89, icon: Wheat, color: "text-yellow-600" },
    { name: "Frutas", count: 67, icon: Apple, color: "text-green-600" },
    { name: "Vegetais", count: 134, icon: UtensilsCrossed, color: "text-emerald-600" },
    { name: "Laticínios", count: 45, icon: Milk, color: "text-blue-600" },
    { name: "Gorduras", count: 23, icon: TrendingUp, color: "text-purple-600" }
  ];

  const stats = [
    { title: "Total de Alimentos", value: "2,847", icon: Database, color: "text-blue-600" },
    { title: "Verificados TACO", value: "2,156", icon: CheckCircle, color: "text-green-600" },
    { title: "Adicionados Hoje", value: "12", icon: Plus, color: "text-purple-600" },
    { title: "Mais Populares", value: "156", icon: TrendingUp, color: "text-orange-600" }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Proteínas":
        return <Beef className="w-4 h-4 text-red-600" />;
      case "Carboidratos":
        return <Wheat className="w-4 h-4 text-yellow-600" />;
      case "Frutas":
        return <Apple className="w-4 h-4 text-green-600" />;
      case "Vegetais":
        return <UtensilsCrossed className="w-4 h-4 text-emerald-600" />;
      case "Laticínios":
        return <Milk className="w-4 h-4 text-blue-600" />;
      default:
        return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de Alimentos</h1>
          <p className="text-muted-foreground">
            Biblioteca completa de alimentos com dados nutricionais
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Alimento
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

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias de Alimentos</CardTitle>
          <CardDescription>
            Navegue por categoria para encontrar alimentos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gray-100`}>
                      <category.icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.count} alimentos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Alimentos</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar alimentos..."
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
              <TabsTrigger value="all">Todos (2,847)</TabsTrigger>
              <TabsTrigger value="verified">Verificados (2,156)</TabsTrigger>
              <TabsTrigger value="popular">Populares (156)</TabsTrigger>
              <TabsTrigger value="recent">Recentes (12)</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alimento</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Calorias</TableHead>
                      <TableHead>Macros (100g)</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Popularidade</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {foods.map((food) => (
                      <TableRow key={food.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-gray-100">
                              <food.icon className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium">{food.name}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {food.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(food.category)}
                            <span className="text-sm">{food.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{food.calories} kcal</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>P: {food.protein}g</div>
                            <div>C: {food.carbs}g</div>
                            <div>G: {food.fat}g</div>
                            <div className="text-xs text-muted-foreground">
                              Fibra: {food.fiber}g
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {food.verified ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                            )}
                            <span className="text-sm">{food.source}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-sm">{food.popularity}%</span>
                          </div>
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
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar ao Plano
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Star className="mr-2 h-4 w-4" />
                                Favoritar
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

            <TabsContent value="verified" className="space-y-4">
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Alimentos Verificados</h3>
                <p className="text-muted-foreground">
                  Alimentos com dados validados pela TACO
                </p>
              </div>
            </TabsContent>

            <TabsContent value="popular" className="space-y-4">
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 text-orange-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Mais Populares</h3>
                <p className="text-muted-foreground">
                  Alimentos mais utilizados nos planos
                </p>
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Recentes</h3>
                <p className="text-muted-foreground">
                  Alimentos adicionados recentemente
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Adicionar Alimento
            </CardTitle>
            <CardDescription>
              Cadastre um novo alimento na base de dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Cadastrar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Importar TACO
            </CardTitle>
            <CardDescription>
              Importar dados da Tabela TACO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Importar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2 text-purple-600" />
              Sincronizar Base
            </CardTitle>
            <CardDescription>
              Atualizar dados nutricionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Sincronizar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
