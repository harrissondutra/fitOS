'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Wheat,
  X,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Download,
  Upload
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function FoodDatabasePage() {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [calorieRange, setCalorieRange] = useState([0, 1000]);
  const [proteinRange, setProteinRange] = useState([0, 100]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

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
      icon: Beef,
      favorite: true,
      createdAt: "2024-01-15"
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
      icon: Wheat,
      favorite: false,
      createdAt: "2024-01-14"
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
      icon: Fish,
      favorite: true,
      createdAt: "2024-01-13"
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
      icon: Apple,
      favorite: false,
      createdAt: "2024-01-12"
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
      icon: Milk,
      favorite: false,
      createdAt: "2024-01-11"
    },
    {
      id: 6,
      name: "Brócolis (cozido)",
      category: "Vegetais",
      calories: 25,
      protein: 3,
      carbs: 5,
      fat: 0.3,
      fiber: 2.6,
      sodium: 33,
      source: "TACO",
      verified: true,
      popularity: 78,
      icon: UtensilsCrossed,
      favorite: true,
      createdAt: "2024-01-10"
    },
    {
      id: 7,
      name: "Azeite de oliva",
      category: "Gorduras",
      calories: 884,
      protein: 0,
      carbs: 0,
      fat: 100,
      fiber: 0,
      sodium: 2,
      source: "TACO",
      verified: true,
      popularity: 65,
      icon: TrendingUp,
      favorite: false,
      createdAt: "2024-01-09"
    },
    {
      id: 8,
      name: "Batata doce (cozida)",
      category: "Carboidratos",
      calories: 77,
      protein: 1.6,
      carbs: 18,
      fat: 0.1,
      fiber: 2.5,
      sodium: 6,
      source: "TACO",
      verified: true,
      popularity: 85,
      icon: Wheat,
      favorite: true,
      createdAt: "2024-01-08"
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

  // Filtered and sorted foods
  const filteredFoods = useMemo(() => {
    let filtered = foods.filter(food => {
      // Search term filter
      if (searchTerm && !food.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && food.category !== selectedCategory) {
        return false;
      }

      // Calorie range filter
      if (food.calories < calorieRange[0] || food.calories > calorieRange[1]) {
        return false;
      }

      // Protein range filter
      if (food.protein < proteinRange[0] || food.protein > proteinRange[1]) {
        return false;
      }

      // Verified only filter
      if (verifiedOnly && !food.verified) {
        return false;
      }

      // Favorites only filter
      if (favoritesOnly && !food.favorite) {
        return false;
      }

      return true;
    });

    // Sort foods
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'calories':
          aValue = a.calories;
          bValue = b.calories;
          break;
        case 'protein':
          aValue = a.protein;
          bValue = b.protein;
          break;
        case 'popularity':
          aValue = a.popularity;
          bValue = b.popularity;
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, sortBy, sortOrder, calorieRange, proteinRange, verifiedOnly, favoritesOnly]);

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
      case "Gorduras":
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setCalorieRange([0, 1000]);
    setProteinRange([0, 100]);
    setVerifiedOnly(false);
    setFavoritesOnly(false);
  };

  const activeFiltersCount = [
    searchTerm,
    selectedCategory !== 'all',
    calorieRange[0] > 0 || calorieRange[1] < 1000,
    proteinRange[0] > 0 || proteinRange[1] < 100,
    verifiedOnly,
    favoritesOnly
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Base de Alimentos</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Biblioteca completa de alimentos com dados nutricionais
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Alimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4 sm:mx-0">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Alimento</DialogTitle>
                <DialogDescription>
                  Cadastre um novo alimento na base de dados nutricionais
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Alimento</Label>
                    <Input id="name" placeholder="Ex: Frango grelhado" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.name} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calorias (kcal)</Label>
                    <Input id="calories" type="number" placeholder="165" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">Proteína (g)</Label>
                    <Input id="protein" type="number" placeholder="31" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carboidratos (g)</Label>
                    <Input id="carbs" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat">Gordura (g)</Label>
                    <Input id="fat" type="number" placeholder="3.6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" placeholder="Informações adicionais sobre o alimento..." />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto">
                  Salvar Alimento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
              <Card 
                key={index} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedCategory === category.name ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedCategory(category.name)}
              >
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
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-lg sm:text-xl">Alimentos ({filteredFoods.length})</CardTitle>
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar alimentos..."
                  className="w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={showFilters ? "default" : "outline"} 
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative"
                >
                  <Filter className="h-4 w-4" />
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy('name')}>
                      Nome {sortBy === 'name' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('calories')}>
                      Calorias {sortBy === 'calories' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('protein')}>
                      Proteína {sortBy === 'protein' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('popularity')}>
                      Popularidade {sortBy === 'popularity' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('created')}>
                      Data de Criação {sortBy === 'created' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortOrder('asc')}>
                      Crescente {sortOrder === 'asc' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('desc')}>
                      Decrescente {sortOrder === 'desc' && '✓'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                >
                  {viewMode === 'table' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Advanced Filters */}
        {showFilters && (
          <CardContent className="border-t">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Filtros Avançados</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Limpar Filtros
                </Button>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Calorias (kcal)</Label>
                  <div className="px-2">
                    <Slider
                      value={calorieRange}
                      onValueChange={setCalorieRange}
                      max={1000}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{calorieRange[0]} kcal</span>
                      <span>{calorieRange[1]} kcal</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Proteína (g)</Label>
                  <div className="px-2">
                    <Slider
                      value={proteinRange}
                      onValueChange={setProteinRange}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{proteinRange[0]}g</span>
                      <span>{proteinRange[1]}g</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Filtros Especiais</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="verified" 
                        checked={verifiedOnly}
                        onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
                      />
                      <Label htmlFor="verified" className="text-sm">
                        Apenas verificados
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="favorites" 
                        checked={favoritesOnly}
                        onCheckedChange={(checked) => setFavoritesOnly(checked as boolean)}
                      />
                      <Label htmlFor="favorites" className="text-sm">
                        Apenas favoritos
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.name} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          {viewMode === 'table' ? (
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
                  {filteredFoods.map((food) => (
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
                              {food.favorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFoods.map((food) => (
                <Card key={food.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <food.icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex items-center space-x-1">
                        {food.favorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        {food.verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{food.name}</h3>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Calorias:</span>
                        <span className="font-medium">{food.calories} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Proteína:</span>
                        <span>{food.protein}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Carboidratos:</span>
                        <span>{food.carbs}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gordura:</span>
                        <span>{food.fat}g</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {food.category}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs">{food.popularity}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {filteredFoods.length === 0 && (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum alimento encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou termos de busca
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-sm sm:text-base">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
              Adicionar Alimento
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Cadastre um novo alimento na base de dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="sm" onClick={() => setShowAddDialog(true)}>
              Cadastrar
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-sm sm:text-base">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
              Importar TACO
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Importar dados da Tabela TACO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" size="sm">
              Importar
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-sm sm:text-base">
              <Database className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
              Sincronizar Base
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Atualizar dados nutricionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" size="sm">
              Sincronizar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

