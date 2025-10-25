'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSystemSettings } from '@/hooks/use-system-settings';
import { useLogoUpload } from '@/hooks/use-logo-upload';
import { SystemSettings } from '@/shared/types/settings';
import { Building2, Settings, Bell, Zap, Save, Loader2 } from 'lucide-react';

const timezones = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/New_York', label: 'Nova York (GMT-5)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  { value: 'Asia/Tokyo', label: 'Tóquio (GMT+9)' },
];

const languages = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español (España)' },
];

const currencies = [
  { value: 'BRL', label: 'Real Brasileiro (R$)' },
  { value: 'USD', label: 'Dólar Americano ($)' },
  { value: 'EUR', label: 'Euro (€)' },
];

const membershipTypes = [
  { value: 'basic', label: 'Básico' },
  { value: 'premium', label: 'Premium' },
  { value: 'vip', label: 'VIP' },
];

export default function SystemConfigPage() {
  const { settings, loading, saving, updateSettings } = useSystemSettings();
  const { logoPreview, logoFile, uploading, handleLogoUpload, removeLogo, uploadLogo, reset } = useLogoUpload();
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});

  const handleInputChange = (section: keyof SystemSettings, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      }
    }));
  };

  const handleLogoUploadWithFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleLogoUpload(event);
    // Adicionar ao formData quando um arquivo é selecionado
    if (event.target.files?.[0]) {
      handleInputChange('general', 'logo', event.target.files[0].name);
    }
  };

  const removeLogoWithFormData = () => {
    removeLogo();
    handleInputChange('general', 'logo', '');
  };

  const handleSave = async () => {
    try {
      // Se há um arquivo de logo, fazer upload primeiro
      if (logoFile) {
        const logoUrl = await uploadLogo();
        if (logoUrl) {
          // Atualizar formData com a URL do logo
          handleInputChange('general', 'logo', logoUrl);
        }
      }
      
      await updateSettings(formData);
      setFormData({});
      reset();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const hasChanges = Object.keys(formData).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações gerais da plataforma
          </p>
        </div>
        
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Geral</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Negócio</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>
                Configure as informações básicas da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seção de Logomarca */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Logomarca da Empresa</Label>
                  <p className="text-sm text-muted-foreground">
                    Faça upload da logomarca que será exibida no topo da sidebar
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      {logoPreview || settings?.general?.logo ? (
                        <Image
                          src={logoPreview || settings?.general?.logo || ''}
                          alt="Logo preview"
                          width={48}
                          height={48}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          disabled={uploading}
                        >
                          {uploading ? 'Enviando...' : (logoPreview || settings?.general?.logo ? 'Alterar Logo' : 'Fazer Upload')}
                        </Button>
                        
                        {(logoPreview || settings?.general?.logo) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeLogoWithFormData}
                            disabled={uploading}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Formatos aceitos: JPG, PNG, SVG. Tamanho máximo: 2MB
                      </p>
                    </div>
                  </div>
                  
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUploadWithFormData}
                    className="hidden"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={formData.general?.companyName || settings?.general?.companyName || ''}
                    onChange={(e) => handleInputChange('general', 'companyName', e.target.value)}
                    placeholder="Digite o nome da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select
                    value={formData.general?.timezone || settings?.general?.timezone || ''}
                    onValueChange={(value) => handleInputChange('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={formData.general?.language || settings?.general?.language || ''}
                    onValueChange={(value) => handleInputChange('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select
                    value={formData.general?.currency || settings?.general?.currency || ''}
                    onValueChange={(value) => handleInputChange('general', 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Negócio */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Negócio</CardTitle>
              <CardDescription>
                Defina as regras e padrões do negócio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="membershipType">Tipo de Plano Padrão</Label>
                  <Select
                    value={formData.business?.defaultMembershipType || settings?.business?.defaultMembershipType || ''}
                    onValueChange={(value) => handleInputChange('business', 'defaultMembershipType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      {membershipTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Horário de Funcionamento</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="time"
                      value={formData.business?.workingHours?.start || settings?.business?.workingHours?.start || ''}
                      onChange={(e) => handleInputChange('business', 'workingHours', {
                        ...formData.business?.workingHours,
                        start: e.target.value,
                      })}
                    />
                    <span className="flex items-center text-muted-foreground">até</span>
                    <Input
                      type="time"
                      value={formData.business?.workingHours?.end || settings?.business?.workingHours?.end || ''}
                      onChange={(e) => handleInputChange('business', 'workingHours', {
                        ...formData.business?.workingHours,
                        end: e.target.value,
                      })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-aprovar Novos Membros</Label>
                  <p className="text-sm text-muted-foreground">
                    Aprovar automaticamente novos cadastros de membros
                  </p>
                </div>
                <Switch
                  checked={formData.business?.autoApproveMembers ?? settings?.business?.autoApproveMembers ?? false}
                  onCheckedChange={(checked) => handleInputChange('business', 'autoApproveMembers', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Integrações */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Gerencie as integrações com serviços externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Google Calendar</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar agendamentos com Google Calendar
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={settings?.integrations?.googleCalendar ? "default" : "secondary"}>
                      {settings?.integrations?.googleCalendar ? "Conectado" : "Desconectado"}
                    </Badge>
                    <Switch
                      checked={formData.integrations?.googleCalendar ?? settings?.integrations?.googleCalendar ?? false}
                      onCheckedChange={(checked) => handleInputChange('integrations', 'googleCalendar', checked)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>WhatsApp Business</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações via WhatsApp
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={settings?.integrations?.whatsapp ? "default" : "secondary"}>
                      {settings?.integrations?.whatsapp ? "Conectado" : "Desconectado"}
                    </Badge>
                    <Switch
                      checked={formData.integrations?.whatsapp ?? settings?.integrations?.whatsapp ?? false}
                      onCheckedChange={(checked) => handleInputChange('integrations', 'whatsapp', checked)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMTP Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar emails via servidor SMTP
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={settings?.integrations?.smtp ? "default" : "secondary"}>
                      {settings?.integrations?.smtp ? "Conectado" : "Desconectado"}
                    </Badge>
                    <Switch
                      checked={formData.integrations?.smtp ?? settings?.integrations?.smtp ?? false}
                      onCheckedChange={(checked) => handleInputChange('integrations', 'smtp', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Notificações */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure as preferências de notificação padrão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações importantes por email
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications?.emailNotifications ?? settings?.notifications?.emailNotifications ?? true}
                    onCheckedChange={(checked) => handleInputChange('notifications', 'emailNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembretes urgentes por SMS
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications?.smsNotifications ?? settings?.notifications?.smsNotifications ?? false}
                    onCheckedChange={(checked) => handleInputChange('notifications', 'smsNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar notificações no navegador
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications?.pushNotifications ?? settings?.notifications?.pushNotifications ?? true}
                    onCheckedChange={(checked) => handleInputChange('notifications', 'pushNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
