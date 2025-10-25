'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar,
  Filter,
  BarChart3,
  Settings,
  Play,
  Save,
  Eye
} from 'lucide-react';

interface ReportConfig {
  type: 'revenue' | 'users' | 'tenants' | 'health' | 'custom';
  dateRange: {
    start: string;
    end: string;
  };
  filters?: {
    tenantIds?: string[];
    userRoles?: string[];
    plans?: string[];
  };
  format: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
  metrics?: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  defaultMetrics: string[];
}

interface AvailableMetric {
  id: string;
  name: string;
  description: string;
  category: string;
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'revenue-summary',
    name: 'Revenue Summary',
    description: 'Monthly revenue metrics and trends',
    type: 'revenue',
    defaultMetrics: ['mrr', 'arr', 'churnRate', 'ltv']
  },
  {
    id: 'user-analytics',
    name: 'User Analytics',
    description: 'User engagement and activity metrics',
    type: 'users',
    defaultMetrics: ['engagement', 'activity', 'features']
  },
  {
    id: 'tenant-health',
    name: 'Tenant Health',
    description: 'Customer health scores and risk analysis',
    type: 'health',
    defaultMetrics: ['healthScore', 'riskLevel', 'trends']
  },
  {
    id: 'platform-overview',
    name: 'Platform Overview',
    description: 'Complete platform metrics and KPIs',
    type: 'custom',
    defaultMetrics: ['revenue', 'users', 'tenants', 'health']
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level KPIs for executives',
    type: 'custom',
    defaultMetrics: ['mrr', 'growth', 'churn', 'ltv']
  }
];

const availableMetrics: Record<string, AvailableMetric[]> = {
  revenue: [
    { id: 'mrr', name: 'Monthly Recurring Revenue', description: 'Total monthly recurring revenue', category: 'revenue' },
    { id: 'arr', name: 'Annual Recurring Revenue', description: 'Total annual recurring revenue', category: 'revenue' },
    { id: 'churnRate', name: 'Churn Rate', description: 'Percentage of customers lost per month', category: 'revenue' },
    { id: 'ltv', name: 'Lifetime Value', description: 'Average customer lifetime value', category: 'revenue' },
    { id: 'cac', name: 'Customer Acquisition Cost', description: 'Cost to acquire new customers', category: 'revenue' },
    { id: 'ltvCacRatio', name: 'LTV/CAC Ratio', description: 'Lifetime value to acquisition cost ratio', category: 'revenue' }
  ],
  users: [
    { id: 'totalUsers', name: 'Total Users', description: 'Total number of users', category: 'users' },
    { id: 'activeUsers', name: 'Active Users', description: 'Users active in last 7 days', category: 'users' },
    { id: 'engagementScore', name: 'Engagement Score', description: 'Average user engagement score', category: 'users' },
    { id: 'featureUsage', name: 'Feature Usage', description: 'Feature adoption and usage statistics', category: 'users' }
  ],
  tenants: [
    { id: 'totalTenants', name: 'Total Tenants', description: 'Total number of tenants', category: 'tenants' },
    { id: 'activeTenants', name: 'Active Tenants', description: 'Tenants with active subscriptions', category: 'tenants' },
    { id: 'trialTenants', name: 'Trial Tenants', description: 'Tenants in trial period', category: 'tenants' },
    { id: 'churnedTenants', name: 'Churned Tenants', description: 'Tenants that have churned', category: 'tenants' }
  ],
  health: [
    { id: 'avgHealthScore', name: 'Average Health Score', description: 'Average customer health score', category: 'health' },
    { id: 'healthyTenants', name: 'Healthy Tenants', description: 'Number of healthy tenants', category: 'health' },
    { id: 'atRiskTenants', name: 'At-Risk Tenants', description: 'Number of tenants at risk', category: 'health' },
    { id: 'criticalTenants', name: 'Critical Tenants', description: 'Number of critical tenants', category: 'health' }
  ]
};

export default function ReportsBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'revenue',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    format: 'pdf',
    includeCharts: true,
    metrics: []
  });
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setReportConfig(prev => ({
        ...prev,
        type: template.type as any,
        metrics: template.defaultMetrics
      }));
    }
  };

  const handleMetricToggle = (metricId: string, checked: boolean) => {
    setReportConfig(prev => ({
      ...prev,
      metrics: checked 
        ? [...(prev.metrics || []), metricId]
        : (prev.metrics || []).filter(id => id !== metricId)
    }));
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportConfig),
      });
      
      const data = await response.json();
      if (data.success) {
        setGeneratedReport(data.data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (format: string) => {
    if (!generatedReport) return;

    try {
      const response = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportData: generatedReport,
          format
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const selectedTemplateData = reportTemplates.find(t => t.id === selectedTemplate);
  const availableMetricsForType = availableMetrics[reportConfig.type] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports Builder</h1>
          <p className="text-muted-foreground">
            Crie relatórios customizados com métricas e visualizações
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Salvar Template
          </Button>
          <Button onClick={generateReport} disabled={generating}>
            <Play className="mr-2 h-4 w-4" />
            {generating ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Relatório</CardTitle>
              <CardDescription>Configure métricas, filtros e formato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Período</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="start-date" className="text-xs">Início</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={reportConfig.dateRange.start}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-xs">Fim</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={reportConfig.dateRange.end}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Report Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Relatório</Label>
                <Select 
                  value={reportConfig.type} 
                  onValueChange={(value) => setReportConfig(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Receita</SelectItem>
                    <SelectItem value="users">Usuários</SelectItem>
                    <SelectItem value="tenants">Tenants</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="custom">Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <Label htmlFor="format">Formato</Label>
                <Select 
                  value={reportConfig.format} 
                  onValueChange={(value) => setReportConfig(prev => ({ ...prev, format: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Include Charts */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-charts"
                  checked={reportConfig.includeCharts}
                  onCheckedChange={(checked) => setReportConfig(prev => ({ 
                    ...prev, 
                    includeCharts: checked as boolean 
                  }))}
                />
                <Label htmlFor="include-charts">Incluir gráficos</Label>
              </div>

              {/* Metrics Selection */}
              <div className="space-y-2">
                <Label>Métricas</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableMetricsForType.map((metric) => (
                    <div key={metric.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={metric.id}
                        checked={reportConfig.metrics?.includes(metric.id) || false}
                        onCheckedChange={(checked) => handleMetricToggle(metric.id, checked as boolean)}
                      />
                      <Label htmlFor={metric.id} className="text-sm">
                        <div>
                          <div className="font-medium">{metric.name}</div>
                          <div className="text-xs text-muted-foreground">{metric.description}</div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview and Results */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="preview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
            </TabsList>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preview do Relatório</CardTitle>
                  <CardDescription>Visualização do relatório configurado</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedTemplateData ? (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold">{selectedTemplateData.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{selectedTemplateData.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Período:</span>
                            <span>{reportConfig.dateRange.start} até {reportConfig.dateRange.end}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Formato:</span>
                            <span className="uppercase">{reportConfig.format}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Gráficos:</span>
                            <span>{reportConfig.includeCharts ? 'Sim' : 'Não'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Métricas:</span>
                            <span>{reportConfig.metrics?.length || 0} selecionadas</span>
                          </div>
                        </div>

                        {reportConfig.metrics && reportConfig.metrics.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-sm mb-2">Métricas Incluídas:</h4>
                            <div className="flex flex-wrap gap-1">
                              {reportConfig.metrics.map((metricId) => {
                                const metric = availableMetricsForType.find(m => m.id === metricId);
                                return metric ? (
                                  <Badge key={metricId} variant="outline" className="text-xs">
                                    {metric.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecione um template para visualizar o preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Relatório Gerado</CardTitle>
                      <CardDescription>Resultados do relatório</CardDescription>
                    </div>
                    {generatedReport && (
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => exportReport('pdf')}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => exportReport('excel')}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Excel
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => exportReport('csv')}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {generatedReport ? (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">{generatedReport.title}</h3>
                        <div className="text-sm text-muted-foreground mb-4">
                          Gerado em: {new Date(generatedReport.generatedAt).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          Período: {generatedReport.dateRange}
                        </div>

                        {/* Summary */}
                        {generatedReport.summary && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Resumo</h4>
                            <div className="grid gap-2 md:grid-cols-2">
                              {Object.entries(generatedReport.summary).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                  <span className="font-medium">
                                    {typeof value === 'number' 
                                      ? value.toLocaleString('pt-BR')
                                      : String(value)
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Data Table Preview */}
                        {generatedReport.data && generatedReport.data.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Dados ({generatedReport.data.length} registros)</h4>
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {Object.keys(generatedReport.data[0]).slice(0, 5).map((key) => (
                                      <TableHead key={key} className="text-xs">
                                        {key}
                                      </TableHead>
                                    ))}
                                    {Object.keys(generatedReport.data[0]).length > 5 && (
                                      <TableHead className="text-xs">...</TableHead>
                                    )}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {generatedReport.data.slice(0, 5).map((row: any, index: number) => (
                                    <TableRow key={index}>
                                      {Object.values(row).slice(0, 5).map((value: any, cellIndex: number) => (
                                        <TableCell key={cellIndex} className="text-xs">
                                          {typeof value === 'object' 
                                            ? JSON.stringify(value).substring(0, 50) + '...'
                                            : String(value).substring(0, 50)
                                          }
                                        </TableCell>
                                      ))}
                                      {Object.keys(generatedReport.data[0]).length > 5 && (
                                        <TableCell className="text-xs">...</TableCell>
                                      )}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            {generatedReport.data.length > 5 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Mostrando 5 de {generatedReport.data.length} registros
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Gere um relatório para ver os resultados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}






