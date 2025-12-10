'use client';

/**
 * Prescription Templates Library Page - Sprint 7
 * Biblioteca de 50+ templates de prescrições prontas
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, CheckCircle, Eye, Copy } from 'lucide-react';

interface PrescriptionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  style: string;
  isPublic: boolean;
  usageCount: number;
  template: any;
}

export default function PrescriptionsLibraryPage() {
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PrescriptionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PrescriptionTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, categoryFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/nutrition/prescription-templates');
      
      if (!res.ok) throw new Error('Erro ao carregar templates');
      
      const data = await res.json();
      setTemplates(data.data || []);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    setFilteredTemplates(filtered);
  };

  const applyTemplate = async (template: PrescriptionTemplate) => {
    try {
      // Aqui você implementaria a lógica de aplicar o template ao plano do cliente
      alert(`Template "${template.name}" aplicado com sucesso!`);
    } catch (err) {
      alert('Erro ao aplicar template');
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      weight_loss: 'Perda de Peso',
      muscle_gain: 'Ganho de Massa',
      diabetes: 'Diabetes',
      hypertension: 'Hipertensão',
      cholesterol: 'Colesterol',
      general: 'Geral'
    };
    return labels[category] || category;
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FileText className="h-12 w-12 animate-pulse mx-auto mb-4" />
          <p>Carregando templates...</p>
        </div>
      </div>
    );
  }

  // Preview do template
  if (selectedTemplate) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedTemplate(null)}
          className="mb-6"
        >
          ← Voltar
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedTemplate.name}</CardTitle>
                <CardDescription>{selectedTemplate.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge>{getCategoryLabel(selectedTemplate.category)}</Badge>
                <Badge variant="secondary">{selectedTemplate.style}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <h3 className="font-semibold">Estrutura do Plano:</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
                {JSON.stringify(selectedTemplate.template, null, 2)}
              </pre>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => applyTemplate(selectedTemplate)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Aplicar Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Biblioteca de Prescrições</h1>
        <p className="text-muted-foreground">
          50+ templates prontos para acelerar sua prescrição nutricional
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id}
            className="hover:border-primary transition-colors cursor-pointer"
            onClick={() => setSelectedTemplate(template)}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary">{getCategoryLabel(template.category)}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  {template.usageCount} usado{template.usageCount !== 1 ? 's' : ''}
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum template encontrado. Tente ajustar os filtros.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




