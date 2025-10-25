'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfileSettings } from '@/hooks/use-profile-settings';
import { useTheme } from '@/hooks/use-theme';
import { AvatarSelector } from '@/components/settings/avatar-selector';
import { AvatarUpload } from '@/components/settings/avatar-upload';
import { ColorPicker } from '@/components/settings/color-picker';
import { ThemePreview } from '@/components/settings/theme-preview';
import { ThemePaletteSelector } from '@/components/settings/theme-palette-selector';
import { UserProfileSettings } from '@/shared/types/settings';
import { User, Palette, Settings, Moon, Sun, Save, Loader2, Sparkles } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { THEME_PRESETS } from '@/lib/theme-presets';

const languages = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español (España)' },
];

const timezones = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/New_York', label: 'Nova York (GMT-5)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  { value: 'Asia/Tokyo', label: 'Tóquio (GMT+9)' },
];

export default function ProfileSettingsPage() {
  const { 
    settings, 
    loading, 
    uploading, 
    updateSettings, 
    uploadAvatar, 
    setSocialAvatar 
  } = useProfileSettings();
  
  const { 
    theme, 
    setTheme, 
    applyCustomColors, 
    resetToDefaults, 
    selectThemePreset, 
    currentPreset, 
    isCustom 
  } = useTheme();
  
  const [formData, setFormData] = useState<Partial<UserProfileSettings>>({});
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [selectedAvatarType, setSelectedAvatarType] = useState<'upload' | 'initials' | 'google' | 'apple' | 'microsoft'>('initials');
  const [showAdvancedCustomization, setShowAdvancedCustomization] = useState(false);

  // Aplicar cores customizadas quando settings mudarem
  useEffect(() => {
    if (settings?.theme?.customColors) {
      applyCustomColors(settings.theme.customColors);
    }
  }, [settings?.theme?.customColors, applyCustomColors]);

  // Aplicar tema quando settings mudarem
  useEffect(() => {
    if (settings?.theme?.mode) {
      setTheme(settings.theme.mode);
    }
  }, [settings?.theme?.mode, setTheme]);

  const handleInputChange = (section: keyof UserProfileSettings, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      }
    }));
  };

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      setFormData({});
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      await uploadAvatar(file);
      setShowAvatarUpload(false);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const handleAvatarUploadComplete = async (url: string) => {
    try {
      // Atualizar o avatar no perfil
      handleInputChange('avatar', 'imageUrl', url);
      handleInputChange('avatar', 'type', 'upload');
      setShowAvatarUpload(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  const handleSocialAvatar = async (provider: 'google' | 'apple' | 'microsoft') => {
    try {
      await setSocialAvatar(provider);
      setSelectedAvatarType(provider);
    } catch (error) {
      console.error('Error using social avatar:', error);
    }
  };

  const handleSelectInitials = () => {
    setSelectedAvatarType('initials');
    updateSettings({
      avatar: {
        type: 'initials',
        bgColor: formData.avatar?.bgColor || settings?.avatar?.bgColor || '#3b82f6',
      }
    });
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', color: string) => {
    const currentColors = settings?.theme?.customColors || {
      primary: '#8b5cf6',
      secondary: '#10b981', 
      accent: '#f59e0b'
    };
    
    const newColors = {
      ...currentColors,
      [colorType]: color,
    };
    
    handleInputChange('theme', 'customColors', newColors);
    applyCustomColors(newColors);
  };

  const handlePresetSelect = (preset: any) => {
    selectThemePreset(preset.id);
    handleInputChange('theme', 'customColors', {
      primary: preset.primary,
      secondary: preset.secondary,
      accent: preset.accent,
    });
  };

  const handleCustomizeClick = () => {
    setShowAdvancedCustomization(true);
  };

  const getInitials = () => {
    const firstName = formData.personalData?.firstName || settings?.personalData?.firstName || '';
    const lastName = formData.personalData?.lastName || settings?.personalData?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>
        
        {hasChanges && (
          <Button onClick={handleSave} disabled={uploading}>
            {uploading ? (
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

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Dados Pessoais</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Preferências</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba Dados Pessoais */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Avatar Section - Coluna Esquerda */}
                <div className="lg:col-span-1 space-y-4">
                  <Label>Avatar</Label>
                  {!showAvatarUpload ? (
                    <AvatarSelector
                      currentAvatarUrl={settings?.avatar?.imageUrl}
                      initials={getInitials()}
                      socialAccounts={settings?.socialAccounts || []}
                      onSelectSocial={handleSocialAvatar}
                      onUpload={() => setShowAvatarUpload(true)}
                      onSelectInitials={handleSelectInitials}
                      selectedType={selectedAvatarType}
                      uploading={uploading}
                    />
                  ) : (
                    <AvatarUpload
                      onUploadComplete={handleAvatarUploadComplete}
                      onCancel={() => setShowAvatarUpload(false)}
                      uploading={uploading}
                    />
                  )}
                </div>

                {/* Personal Data Form - Coluna Direita */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={formData.personalData?.firstName || settings?.personalData?.firstName || ''}
                    onChange={(e) => handleInputChange('personalData', 'firstName', e.target.value)}
                    placeholder="Digite seu nome"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={formData.personalData?.lastName || settings?.personalData?.lastName || ''}
                    onChange={(e) => handleInputChange('personalData', 'lastName', e.target.value)}
                    placeholder="Digite seu sobrenome"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.personalData?.phone || settings?.personalData?.phone || ''}
                    onChange={(e) => handleInputChange('personalData', 'phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="email"
                      value={settings?.personalData?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <Badge variant="secondary">Somente leitura</Badge>
                  </div>
                </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Aparência */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Tema e Cores</span>
              </CardTitle>
              <CardDescription>
                Personalize a aparência da interface com temas pré-definidos ou crie o seu próprio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Toggle */}
              <div className="space-y-4">
                <Label>Tema</Label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => {
                      setTheme('light');
                      handleInputChange('theme', 'mode', 'light');
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Sun className="h-4 w-4" />
                    <span>Claro</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => {
                      setTheme('dark');
                      handleInputChange('theme', 'mode', 'dark');
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Moon className="h-4 w-4" />
                    <span>Escuro</span>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Theme Selection */}
              <Accordion type="multiple" defaultValue={["presets"]} className="w-full">
                <AccordionItem value="presets">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Temas Pré-definidos</span>
                      {currentPreset && !isCustom && (
                        <Badge variant="secondary" className="ml-2">
                          {currentPreset.name}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ThemePaletteSelector
                      selectedPresetId={currentPreset?.id}
                      onPresetSelect={handlePresetSelect}
                      onCustomizeClick={handleCustomizeClick}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="custom">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Personalização Avançada</span>
                      {isCustom && (
                        <Badge variant="outline" className="ml-2">
                          Personalizado
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {isCustom && (
                      <Alert>
                        <AlertDescription>
                          Você está usando um tema personalizado. As cores foram ajustadas manualmente.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Label>Cores Personalizadas</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          resetToDefaults();
                          handleInputChange('theme', 'customColors', {
                            primary: '#8b5cf6',
                            secondary: '#10b981',
                            accent: '#f59e0b',
                          });
                        }}
                      >
                        Resetar para Padrão
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <ColorPicker
                        label="Cor Primária"
                        value={formData.theme?.customColors?.primary || settings?.theme?.customColors?.primary || '#8b5cf6'}
                        onChange={(color) => handleColorChange('primary', color)}
                      />
                      
                      <ColorPicker
                        label="Cor Secundária"
                        value={formData.theme?.customColors?.secondary || settings?.theme?.customColors?.secondary || '#10b981'}
                        onChange={(color) => handleColorChange('secondary', color)}
                      />
                      
                      <ColorPicker
                        label="Cor de Destaque"
                        value={formData.theme?.customColors?.accent || settings?.theme?.customColors?.accent || '#f59e0b'}
                        onChange={(color) => handleColorChange('accent', color)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Separator />

              {/* Theme Preview */}
              <div className="space-y-4">
                <Label>Preview do Tema</Label>
                <ThemePreview
                  primaryColor={formData.theme?.customColors?.primary || settings?.theme?.customColors?.primary || '#8b5cf6'}
                  secondaryColor={formData.theme?.customColors?.secondary || settings?.theme?.customColors?.secondary || '#10b981'}
                  accentColor={formData.theme?.customColors?.accent || settings?.theme?.customColors?.accent || '#f59e0b'}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Preferências */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>
                Configure suas preferências de uso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={formData.preferences?.language || settings?.preferences?.language || ''}
                    onValueChange={(value) => handleInputChange('preferences', 'language', value)}
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
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select
                    value={formData.preferences?.timezone || settings?.preferences?.timezone || ''}
                    onValueChange={(value) => handleInputChange('preferences', 'timezone', value)}
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
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações do sistema
                  </p>
                </div>
                <Switch
                  checked={formData.preferences?.notifications ?? settings?.preferences?.notifications ?? true}
                  onCheckedChange={(checked) => handleInputChange('preferences', 'notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
