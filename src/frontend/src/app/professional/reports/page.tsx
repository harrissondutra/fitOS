'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, BarChart3, Users, Calendar, Target, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'pdf' | 'csv';
  category: string;
  icon: string;
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'bioimpedance-pdf',
    name: 'Relatório de Bioimpedância',
    description: 'Histórico completo de medições biométricas em PDF',
    type: 'pdf',
    category: 'Bioimpedância',
    icon: 'BarChart3'
  },
  {
    id: 'appointments-csv',
    name: 'Agendamentos (CSV)',
    description: 'Lista de agendamentos por período em formato CSV',
    type: 'csv',
    category: 'Agendamentos',
    icon: 'Calendar'
  },
  {
    id: 'crm-pipeline-csv',
    name: 'Pipeline CRM (CSV)',
    description: 'Dados do pipeline de clientes em formato CSV',
    type: 'csv',
    category: 'CRM',
    icon: 'Users'
  },
  {
    id: 'goals-progress-pdf',
    name: 'Progresso de Metas',
    description: 'Relatório de evolução das metas dos clientes',
    type: 'pdf',
    category: 'Metas',
    icon: 'Target'
  },
  {
    id: 'attendance-csv',
    name: 'Presença (CSV)',
    description: 'Relatório de frequência e presença',
    type: 'csv',
    category: 'Presença',
    icon: 'Calendar'
  },
  {
    id: 'analytics-pdf',
    name: 'Analytics Completo',
    description: 'Dashboard de métricas e KPIs em PDF',
    type: 'pdf',
    category: 'Analytics',
    icon: 'BarChart3'
  }
];

const iconMap = {
  BarChart3,
  Calendar,
  Users,
  Target,
  FileText,
  FileSpreadsheet
};

export default function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [clientId, setMemberId] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [clients, setMembers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.clients || []);
      }
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      toast.error('Selecione um tipo de relatório');
      return;
    }

    try {
      setIsGenerating(true);
      
      const template = reportTemplates.find(t => t.id === selectedTemplate);
      if (!template) {
        toast.error('Template não encontrado');
        return;
      }

      const params = new URLSearchParams({
        template: selectedTemplate,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        clientId: clientId
      });

      const response = await fetch(`/api/reports/generate?${params}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name}_${format(new Date(), 'yyyy-MM-dd')}.${template.type}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Relatório gerado com sucesso!');
      } else {
        throw new Error('Erro ao gerar relatório');
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || FileText;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Bioimpedância': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Agendamentos': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'CRM': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Metas': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Presença': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Analytics': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Gere relatórios em PDF e CSV dos dados do sistema
          </p>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTemplates.map((template) => {
          const Icon = getIcon(template.icon);
          const isSelected = selectedTemplate === template.id;
          
          return (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getCategoryColor(template.category)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {template.type.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Configuration */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Relatório</CardTitle>
            <CardDescription>
              Configure os parâmetros para gerar o relatório selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {format(startDate, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente (Opcional)</label>
              <Select value={clientId} onValueChange={setMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="min-w-32"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Relatórios pré-configurados para download imediato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                setSelectedTemplate('analytics-pdf');
                setStartDate(subDays(new Date(), 30));
                setEndDate(new Date());
              }}
            >
              <BarChart3 className="h-6 w-6" />
              <span>Analytics Últimos 30 dias</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                setSelectedTemplate('appointments-csv');
                setStartDate(subDays(new Date(), 7));
                setEndDate(new Date());
              }}
            >
              <Calendar className="h-6 w-6" />
              <span>Agendamentos Esta Semana</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
