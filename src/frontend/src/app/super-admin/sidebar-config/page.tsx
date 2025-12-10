'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';
import { GripVertical, Eye, Save, RefreshCw } from 'lucide-react';
import { SidebarMenuItem } from '@/shared/types/sidebar.types';
import * as LucideIcons from 'lucide-react';

const MODULE_COLORS: Record<string, string> = {
  'core': 'bg-blue-500 text-white',
  'training': 'bg-green-500 text-white',
  'nutrition': 'bg-orange-500 text-white',
  'scheduling': 'bg-purple-500 text-white',
  'crm': 'bg-pink-500 text-white',
  'communication': 'bg-yellow-500 text-white',
  'analytics': 'bg-indigo-500 text-white',
  'marketplace': 'bg-teal-500 text-white',
  'admin': 'bg-red-500 text-white',
  'superadmin': 'bg-gray-700 text-white'
};

export default function SidebarConfigPage() {
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [menuItems, setMenuItems] = useState<SidebarMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [changelog, setChangelog] = useState('');
  const [previewRole, setPreviewRole] = useState('TRAINER');
  const [previewMenus, setPreviewMenus] = useState<SidebarMenuItem[]>([]);
  
  useEffect(() => {
    loadPlanConfig(selectedPlan);
  }, [selectedPlan]);
  
  const loadPlanConfig = async (plan: string) => {
    setIsLoading(true);
    try {
      // Determinar URL da API (fallback para localhost)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = `${apiUrl}/api/sidebar/plan/${plan}/current`;
      
      console.log('Loading plan config from:', url);
      
      // Obter token de auth
      const token = localStorage.getItem('token');
      
      const res = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Response data:', data);
        console.log('Loaded menu items count:', data.data?.length || 0);
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setMenuItems(data.data);
          toast.success(`✅ Carregado ${data.data.length} menus para plano ${plan}`);
        } else {
          console.warn('No menu items returned or empty array');
          setMenuItems([]);
          toast.error(`⚠️ Nenhum menu configurado para o plano ${plan}`);
        }
      } else {
        let errorMessage = `Falha ao carregar configuração (status: ${res.status})`;
        try {
          const text = await res.text();
          console.error('Response text:', text);
          const errorData = text ? JSON.parse(text) : {};
          errorMessage = errorData.error || errorData.message || `Status: ${res.status}`;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        toast.error(`❌ Erro: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`❌ Erro ao carregar configuração: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!changelog.trim()) {
      toast.error('Por favor, descreva as mudanças feitas');
      return;
    }
    
    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const url = `${apiUrl}/api/sidebar/plan/${selectedPlan}`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify({ menuItems, changelog })
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      toast.success('Configuração salva com sucesso!');
      setChangelog('');
      await loadPlanConfig(selectedPlan);
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePreview = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      const res = await fetch(
        `${apiUrl}/api/sidebar/preview?plan=${selectedPlan}&role=${previewRole}`,
        { 
          credentials: 'include',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setPreviewMenus(data.data || []);
        toast.success(`${data.data.length} menus visíveis para ${previewRole}`);
      }
    } catch (error) {
      toast.error('Erro ao gerar preview');
    }
  };
  
  const handleReorder = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === menuItems.length - 1)) {
      return;
    }
    
    const items = [...menuItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    setMenuItems(items.map((item, i) => ({ ...item, order: i })));
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold">Configuração de Sidebar</h1>
        <p className="text-muted-foreground">
          Configure os menus visíveis para cada plano com subdivisões por módulo
        </p>
      </div>

      <Tabs defaultValue="starter" onValueChange={setSelectedPlan}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="starter">Starter</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPlan} className="space-y-4">
          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Preview em Tempo Real</CardTitle>
              <CardDescription>
                Teste como a sidebar aparecerá para diferentes roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Select value={previewRole} onValueChange={setPreviewRole}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="TRAINER">Personal Trainer</SelectItem>
                    <SelectItem value="NUTRITIONIST">Nutricionista</SelectItem>
                    <SelectItem value="CLIENT">Cliente</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Gerar Preview
                </Button>
              </div>
              
              {/* Preview Results */}
              {previewMenus.length > 0 && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="text-sm font-medium mb-2">
                    Menus visíveis para {previewRole}: {previewMenus.length}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewMenus.map((menu) => (
                      <Badge key={menu.id} variant="outline">
                        {menu.icon} {menu.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menus Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Menus do Plano {selectedPlan}</CardTitle>
              <CardDescription>
                Edite os menus: clique nos campos para alterar título/URL/ícone, use switch para visibilidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : menuItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum menu configurado para este plano
                </div>
              ) : (
                <div className="space-y-3">
                  {menuItems.map((item, index) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Badge do Módulo */}
                        <Badge className={MODULE_COLORS[item.module]}>
                          {item.module}
                        </Badge>
                        
                        {/* Ícone */}
                        <Select
                          value={item.icon}
                          onValueChange={(value) => {
                            const updated = [...menuItems];
                            updated[index].icon = value;
                            setMenuItems(updated);
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {Object.keys(LucideIcons).slice(0, 100).map((icon) => (
                              <SelectItem key={icon} value={icon}>
                                {icon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Título */}
                        <Input
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...menuItems];
                            updated[index].title = e.target.value;
                            setMenuItems(updated);
                          }}
                          className="flex-1"
                          placeholder="Nome do menu"
                        />
                        
                        {/* URL */}
                        <Input
                          value={item.url}
                          onChange={(e) => {
                            const updated = [...menuItems];
                            updated[index].url = e.target.value;
                            setMenuItems(updated);
                          }}
                          className="flex-1"
                          placeholder="/rota"
                        />
                        
                        {/* Switch Visibilidade */}
                        <Switch
                          checked={item.isVisible}
                          onCheckedChange={(checked) => {
                            const updated = [...menuItems];
                            updated[index].isVisible = checked;
                            setMenuItems(updated);
                          }}
                        />
                      </div>
                      
                      {/* Info adicional se existir */}
                      {(item.requiredRoles || item.requiredFeature) && (
                        <div className="flex gap-4 mt-3 text-sm">
                          {item.requiredRoles && item.requiredRoles.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Roles:</span>
                              <div className="flex gap-1">
                                {item.requiredRoles.map((role) => (
                                  <Badge key={role} variant="outline" className="text-xs">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.requiredFeature && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Feature:</span>
                              <Badge variant="secondary" className="text-xs">
                                {item.requiredFeature}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Changelog */}
          <Card>
            <CardHeader>
              <CardTitle>Changelog (Obrigatório)</CardTitle>
              <CardDescription>
                Descreva as mudanças feitas para manter histórico de versões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="changelog">Descrição das mudanças</Label>
                <Textarea
                  id="changelog"
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  placeholder="Ex: Adicionado menu de Bioimpedância para plano Professional"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || !changelog.trim()} 
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar Configuração'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => loadPlanConfig(selectedPlan)}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

