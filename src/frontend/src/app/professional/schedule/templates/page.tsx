'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, MapPin, Monitor, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface AppointmentTemplate {
  id: string;
  name: string;
  type: string;
  duration: number;
  description?: string;
  location?: string;
  isVirtual: boolean;
  isActive: boolean;
  createdAt: string;
}

const appointmentTypes = [
  { value: 'consultation', label: 'Consulta' },
  { value: 'training', label: 'Treino' },
  { value: 'nutrition', label: 'Nutrição' },
  { value: 'assessment', label: 'Avaliação' },
  { value: 'follow_up', label: 'Acompanhamento' },
  { value: 'other', label: 'Outro' },
];

export default function AppointmentTemplatesPage() {
  const [templates, setTemplates] = useState<AppointmentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AppointmentTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    duration: 60,
    description: '',
    location: '',
    isVirtual: false,
    isActive: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointment-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingTemplate 
        ? `/api/appointment-templates/${editingTemplate.id}`
        : '/api/appointment-templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingTemplate ? 'Template atualizado com sucesso!' : 'Template criado com sucesso!'
        );
        setShowCreateDialog(false);
        setEditingTemplate(null);
        resetForm();
        fetchTemplates();
      } else {
        throw new Error('Erro ao salvar template');
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const handleEdit = (template: AppointmentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      duration: template.duration,
      description: template.description || '',
      location: template.location || '',
      isVirtual: template.isVirtual,
      isActive: template.isActive,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const response = await fetch(`/api/appointment-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Template excluído com sucesso!');
        fetchTemplates();
      } else {
        throw new Error('Erro ao excluir template');
      }
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      duration: 60,
      description: '',
      location: '',
      isVirtual: false,
      isActive: true,
    });
  };

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    setEditingTemplate(null);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Agendamento</h1>
          <p className="text-muted-foreground">
            Crie e gerencie templates para agendamentos rápidos
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Criar Novo Template'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate 
                  ? 'Atualize as informações do template de agendamento.'
                  : 'Crie um novo template para facilitar a criação de agendamentos.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Template *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Consulta Nutricional"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Sala 1, Academia"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição detalhada do agendamento..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVirtual"
                    checked={formData.isVirtual}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVirtual: checked }))}
                  />
                  <Label htmlFor="isVirtual">Agendamento Virtual</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Ativo</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Atualizar' : 'Criar'} Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro template para facilitar a criação de agendamentos.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>
                      {appointmentTypes.find(t => t.value === template.type)?.label || template.type}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{template.duration} minutos</span>
                  </div>
                  
                  {template.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{template.location}</span>
                    </div>
                  )}
                  
                  {template.isVirtual && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Monitor className="h-4 w-4" />
                      <span>Virtual</span>
                    </div>
                  )}
                  
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
