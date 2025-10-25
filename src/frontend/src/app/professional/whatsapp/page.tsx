'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Phone, Settings, Send, TestTube, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhatsAppConfig {
  id: string;
  provider: string;
  phoneNumber: string;
  isActive: boolean;
  settings: {
    appointmentConfirmation: boolean;
    reminders: boolean;
    newMeasurement: boolean;
    workingHours: {
      start: string;
      end: string;
    };
    templates: {
      appointmentConfirmation: string;
      reminder: string;
      newMeasurement: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const providers = [
  { value: 'twilio', label: 'Twilio WhatsApp API', description: 'Solução robusta e confiável' },
  { value: 'wati', label: 'WATI', description: 'Especializada em WhatsApp Business' },
  { value: 'meta', label: 'Meta WhatsApp Business API', description: 'Solução oficial do Meta' },
  { value: 'zapi', label: 'Z-API', description: 'Solução brasileira' },
];

const messageTemplates = {
  appointmentConfirmation: `Olá {{clientName}}! 

Seu agendamento foi confirmado:
📅 Data: {{appointmentDate}}
🕐 Horário: {{appointmentTime}}
📍 Local: {{location}}
👨‍⚕️ Profissional: {{professionalName}}

Qualquer dúvida, entre em contato conosco!`,
  
  reminder: `Olá {{clientName}}!

Lembrete: Você tem um agendamento amanhã:
📅 Data: {{appointmentDate}}
🕐 Horário: {{appointmentTime}}
📍 Local: {{location}}

Nos vemos em breve!`,
  
  newMeasurement: `Olá {{clientName}}!

Sua nova medição biométrica foi registrada:
📊 Tipo: {{measurementType}}
📈 Valor: {{measurementValue}} {{unit}}
📅 Data: {{measurementDate}}

Continue acompanhando sua evolução!`
};

export default function WhatsAppPage() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/whatsapp/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração WhatsApp:', error);
      toast.error('Erro ao carregar configuração');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (formData: Partial<WhatsAppConfig>) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/whatsapp/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Configuração salva com sucesso!');
        fetchConfig();
      } else {
        throw new Error('Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestMessage = async () => {
    if (!testMessage || !testPhone) {
      toast.error('Preencha a mensagem e o telefone para teste');
      return;
    }

    try {
      setIsTesting(true);
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          phone: testPhone,
        }),
      });

      if (response.ok) {
        toast.success('Mensagem de teste enviada com sucesso!');
        setTestMessage('');
        setTestPhone('');
      } else {
        throw new Error('Erro ao enviar mensagem de teste');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
      toast.error('Erro ao enviar mensagem de teste');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? CheckCircle : XCircle;
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
          <h1 className="text-3xl font-bold">WhatsApp Business</h1>
          <p className="text-muted-foreground">
            Configure e gerencie integração com WhatsApp Business
          </p>
        </div>
        {config && (
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(config.isActive)}>
              {config.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
            <div className={`p-2 rounded-full ${getStatusColor(config.isActive)}`}>
              {(() => {
                const StatusIcon = getStatusIcon(config.isActive);
                return <StatusIcon className="h-4 w-4" />;
              })()}
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="test">Teste</TabsTrigger>
        </TabsList>

        {/* Configuração */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração Básica</CardTitle>
              <CardDescription>
                Configure a integração com WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provedor</Label>
                  <Select
                    value={config?.provider || ''}
                    onValueChange={(value) => setConfig(prev => prev ? { ...prev, provider: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          <div>
                            <div className="font-medium">{provider.label}</div>
                            <div className="text-sm text-muted-foreground">{provider.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Número do WhatsApp</Label>
                  <Input
                    id="phoneNumber"
                    value={config?.phoneNumber || ''}
                    onChange={(e) => setConfig(prev => prev ? { ...prev, phoneNumber: e.target.value } : null)}
                    placeholder="+5511999999999"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={config?.isActive || false}
                  onCheckedChange={(checked) => setConfig(prev => prev ? { ...prev, isActive: checked } : null)}
                />
                <Label htmlFor="isActive">Ativar integração</Label>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => config && handleSaveConfig(config)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configuração'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configurações Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Configure horários e tipos de notificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workingHoursStart">Horário de Funcionamento (Início)</Label>
                  <Input
                    id="workingHoursStart"
                    type="time"
                    value={config?.settings?.workingHours?.start || '08:00'}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        workingHours: {
                          ...prev.settings.workingHours,
                          start: e.target.value
                        }
                      }
                    } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workingHoursEnd">Horário de Funcionamento (Fim)</Label>
                  <Input
                    id="workingHoursEnd"
                    type="time"
                    value={config?.settings?.workingHours?.end || '18:00'}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        workingHours: {
                          ...prev.settings.workingHours,
                          end: e.target.value
                        }
                      }
                    } : null)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="appointmentConfirmation"
                    checked={config?.settings?.appointmentConfirmation || false}
                    onCheckedChange={(checked) => setConfig(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        appointmentConfirmation: checked
                      }
                    } : null)}
                  />
                  <Label htmlFor="appointmentConfirmation">Confirmação de Agendamento</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="reminders"
                    checked={config?.settings?.reminders || false}
                    onCheckedChange={(checked) => setConfig(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        reminders: checked
                      }
                    } : null)}
                  />
                  <Label htmlFor="reminders">Lembretes de Agendamento</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="newMeasurement"
                    checked={config?.settings?.newMeasurement || false}
                    onCheckedChange={(checked) => setConfig(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        newMeasurement: checked
                      }
                    } : null)}
                  />
                  <Label htmlFor="newMeasurement">Notificação de Nova Medição</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Mensagem</CardTitle>
              <CardDescription>
                Personalize as mensagens enviadas via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="appointmentConfirmationTemplate">Confirmação de Agendamento</Label>
                  <Textarea
                    id="appointmentConfirmationTemplate"
                    value={config?.settings?.templates?.appointmentConfirmation || messageTemplates.appointmentConfirmation}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        templates: {
                          ...prev.settings.templates,
                          appointmentConfirmation: e.target.value
                        }
                      }
                    } : null)}
                    rows={8}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Variáveis disponíveis: {`{{clientName}}, {{appointmentDate}}, {{appointmentTime}}, {{location}}, {{professionalName}}`}
                  </p>
                </div>

                <div>
                  <Label htmlFor="reminderTemplate">Lembrete de Agendamento</Label>
                  <Textarea
                    id="reminderTemplate"
                    value={config?.settings?.templates?.reminder || messageTemplates.reminder}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        templates: {
                          ...prev.settings.templates,
                          reminder: e.target.value
                        }
                      }
                    } : null)}
                    rows={8}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Variáveis disponíveis: {`{{clientName}}, {{appointmentDate}}, {{appointmentTime}}, {{location}}`}
                  </p>
                </div>

                <div>
                  <Label htmlFor="newMeasurementTemplate">Nova Medição Biométrica</Label>
                  <Textarea
                    id="newMeasurementTemplate"
                    value={config?.settings?.templates?.newMeasurement || messageTemplates.newMeasurement}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        templates: {
                          ...prev.settings.templates,
                          newMeasurement: e.target.value
                        }
                      }
                    } : null)}
                    rows={8}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Variáveis disponíveis: {`{{clientName}}, {{measurementType}}, {{measurementValue}}, {{unit}}, {{measurementDate}}`}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => config && handleSaveConfig(config)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Templates'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teste */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Integração</CardTitle>
              <CardDescription>
                Teste o envio de mensagens via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testPhone">Número de Teste</Label>
                <Input
                  id="testPhone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+5511999999999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testMessage">Mensagem de Teste</Label>
                <Textarea
                  id="testMessage"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Digite sua mensagem de teste aqui..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleTestMessage}
                  disabled={isTesting || !testMessage || !testPhone}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Teste
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status da Integração */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Integração</CardTitle>
              <CardDescription>
                Verifique o status da sua integração WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge className={getStatusColor(config?.isActive || false)}>
                    {config?.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Provedor</span>
                  <span className="text-sm text-muted-foreground">
                    {config?.provider || 'Não configurado'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Número</span>
                  <span className="text-sm text-muted-foreground">
                    {config?.phoneNumber || 'Não configurado'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Atualização</span>
                  <span className="text-sm text-muted-foreground">
                    {config?.updatedAt ? format(new Date(config.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Nunca'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
