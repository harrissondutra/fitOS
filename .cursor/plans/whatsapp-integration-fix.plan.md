<!-- db547364-5659-4474-b918-d795862004e4 9b90788e-af85-4381-b1c2-cb1266452ce7 -->
# Plano de Correção e Centralização da Integração WhatsApp

## 🎯 Objetivo Principal

**Estabelecer UMA ÚNICA configuração centralizada do WhatsApp que será reutilizada por TODAS as funcionalidades do sistema.**

## Análise do Problema Atual

### Erros Identificados

1. **Erro crítico de importação:** `import { Joi } from 'joi'` está incorreto - deve ser `import Joi from 'joi'`
2. **DUPLICAÇÃO CRÍTICA:** Existem 2 arquivos de rotas WhatsApp:

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - `src/backend/src/routes/whatsapp.routes.ts` (com validação Joi - quebrado)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - `src/backend/src/routes/whatsapp.ts` (funcional, usando express-validator)

3. **Falta de centralização:** Múltiplas partes do sistema podem criar configurações independentes
4. **Inconsistência de schema:** O service usa campos que não existem no schema Prisma

### Arquitetura Atual (Problemática)

```
❌ PROBLEMA: Múltiplas configurações possíveis
src/backend/src/
├── routes/
│   ├── whatsapp.routes.ts   # DUPLICADO - para deletar
│   └── whatsapp.ts           # Mantém config local
├── services/
│   └── whatsapp/
│       └── whatsapp.service.ts  # Cria config própria
└── Outras features podem criar configs independentes
```

## 🏗️ Arquitetura Alvo (Centralizada)

### Princípio Fundamental

**"Uma única fonte de verdade para configuração WhatsApp"**

```
✅ SOLUÇÃO: Configuração única e centralizada
src/backend/src/
├── config/
│   └── whatsapp.config.ts        # ⭐ CONFIGURAÇÃO CENTRAL ÚNICA
├── services/
│   └── whatsapp/
│       └── whatsapp.service.ts   # USA config central (não cria)
├── routes/
│   └── whatsapp.ts               # USA config central (não cria)
└── Todas features usam a config central via import
```

### Frontend - Submenu EXCLUSIVO em Integrações

**🎯 PRINCÍPIO:** WhatsApp é configurado APENAS em `/admin/settings/integrations/whatsapp`

**NÃO CRIAR:**
- ❌ `/admin/whatsapp` (standalone)
- ❌ `/professional/whatsapp/settings` (duplicado)
- ❌ Qualquer outra tela de configuração WhatsApp

**CRIAR APENAS:**
```
src/frontend/src/app/admin/settings/integrations/
├── page.tsx                      # Lista integrações (já existe)
└── whatsapp/                     # ⭐ ÚNICA tela de configuração
    └── page.tsx                  # Configuração centralizada UI
```

**Rota única:** `/admin/settings/integrations/whatsapp`

## Etapas de Implementação

### 1. Deletar Arquivo Duplicado

**Arquivo:** `src/backend/src/routes/whatsapp.routes.ts`

**Ação:** Deletar completamente - não corrigir, pois será substituído por sistema centralizado

### 2. Criar Configuração Central Única ⭐ CHAVE

**Novo arquivo:** `src/backend/src/config/whatsapp.config.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WhatsAppConfigData {
  tenantId: string;
  provider: string;
  phoneNumber: string;
  apiKey: string;
  apiSecret: string;
  isActive: boolean;
  settings: any;
}

/**
 * ⭐ CONFIGURAÇÃO CENTRAL ÚNICA DO WHATSAPP
 * Todas as funcionalidades DEVEM usar esta classe
 */
export class WhatsAppConfigManager {
  private static instance: WhatsAppConfigManager;
  private configCache: Map<string, WhatsAppConfigData> = new Map();

  private constructor() {}

  public static getInstance(): WhatsAppConfigManager {
    if (!WhatsAppConfigManager.instance) {
      WhatsAppConfigManager.instance = new WhatsAppConfigManager();
    }
    return WhatsAppConfigManager.instance;
  }

  /**
   * Obter configuração WhatsApp do tenant
   * TODAS as funcionalidades devem usar este método
   */
  async getConfig(tenantId: string): Promise<WhatsAppConfigData | null> {
    // Verificar cache
    if (this.configCache.has(tenantId)) {
      return this.configCache.get(tenantId)!;
    }

    // Buscar do banco
    const config = await prisma.whatsAppConfig.findFirst({
      where: { tenantId, isActive: true }
    });

    if (config) {
      const configData: WhatsAppConfigData = {
        tenantId: config.tenantId,
        provider: config.provider,
        phoneNumber: config.phoneNumber,
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
        isActive: config.isActive,
        settings: config.settings
      };
      
      // Cachear por 5 minutos
      this.configCache.set(tenantId, configData);
      setTimeout(() => this.configCache.delete(tenantId), 5 * 60 * 1000);
      
      return configData;
    }

    return null;
  }

  /**
   * Invalidar cache quando config é atualizada
   */
  invalidateCache(tenantId: string): void {
    this.configCache.delete(tenantId);
  }
}

export const whatsAppConfigManager = WhatsAppConfigManager.getInstance();
```

### 3. Refatorar WhatsAppService para Usar Config Central

**Arquivo:** `src/backend/src/services/whatsapp/whatsapp.service.ts`

**Mudanças principais:**

```typescript
import { whatsAppConfigManager } from '../../config/whatsapp.config';

export class WhatsAppService {
  // ❌ REMOVER: Não criar client aqui
  // const twilioClient = twilio(...);

  async sendMessage(message: WhatsAppMessage): Promise<...> {
    // ✅ USAR: Obter config central
    const config = await whatsAppConfigManager.getConfig(message.tenantId!);
    
    if (!config || !config.isActive) {
      throw new Error('WhatsApp não configurado para este tenant');
    }

    // Criar client temporário com config central
    const twilioClient = twilio(config.apiKey, config.apiSecret);
    
    // Usar config.phoneNumber para envio
    const twilioMessage = await twilioClient.messages.create({
      body: message.body,
      from: `whatsapp:${config.phoneNumber}`,
      to: `whatsapp:${message.to}`,
    });

    // Salvar no schema correto
    await this.saveMessage({
      phone: message.to,      // ✅ Campo correto
      message: message.body,  // ✅ Campo correto
      status: 'sent',
      sentAt: new Date(),
      tenantId: message.tenantId!
    });
  }

  // Adaptar saveMessage para schema correto
  private async saveMessage(data: {
    phone: string;
    message: string;
    status: string;
    sentAt: Date;
    tenantId: string;
  }): Promise<void> {
    await prisma.whatsAppMessage.create({
      data: {
        tenantId: data.tenantId,
        phone: data.phone,
        message: data.message,
        status: data.status,
        sentAt: data.sentAt,
      },
    });
  }
}
```

### 4. Atualizar Rotas para Usar Config Central

**Arquivo:** `src/backend/src/routes/whatsapp.ts`

**Garantir que usa config central:**

```typescript
import { whatsAppConfigManager } from '../config/whatsapp.config';

router.post('/send', requireRole(['OWNER', 'ADMIN']), async (req: any, res) => {
  // ✅ Usar config central
  const config = await whatsAppConfigManager.getConfig(req.user.tenantId);
  
  if (!config || !config.isActive) {
    return res.status(400).json({
      success: false,
      error: 'WhatsApp não configurado'
    });
  }

  // Usar WhatsAppService que já usa config central
  // ...
});

router.put('/config', requireRole(['OWNER']), async (req: any, res) => {
  // Atualizar config
  await prisma.whatsAppConfig.update({...});
  
  // ✅ Invalidar cache
  whatsAppConfigManager.invalidateCache(req.user.tenantId);
});
```

### 5. Criar Submenu WhatsApp em Integrações (Frontend) 🎨

**IMPORTANTE:** Usar APENAS componentes do ShadcnUI - nunca criar componentes customizados

**Novo arquivo:** `src/frontend/src/app/admin/settings/integrations/whatsapp/page.tsx`

**Componentes ShadcnUI utilizados:**
- ✅ `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardDescription` - Para containers
- ✅ `Button` - Para ações (Salvar, Testar)
- ✅ `Input` - Para campos de texto
- ✅ `Label` - Para labels de formulário
- ✅ `Switch` - Para toggle on/off
- ✅ `Alert`, `AlertDescription` - Para mensagens informativas
- ✅ `Badge` - Para status
- ✅ Ícones do `lucide-react` - NUNCA criar SVGs customizados

```typescript
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Save, TestTube, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WhatsAppConfigPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    provider: 'twilio',
    phoneNumber: '',
    apiKey: '',
    apiSecret: '',
    isActive: false,
    settings: {
      appointmentConfirmation: true,
      reminders: true,
      newMeasurement: true,
    }
  });

  // Buscar config existente
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const res = await fetch('/api/whatsapp/config');
    const data = await res.json();
    if (data.success) {
      setConfig(data.config);
    }
  };

  const handleSave = async () => {
    const res = await fetch('/api/whatsapp/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    if (res.ok) {
      toast({ title: 'Configuração salva com sucesso!' });
    }
  };

  const handleTest = async () => {
    const res = await fetch('/api/whatsapp/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Teste de integração WhatsApp',
        phone: config.phoneNumber
      })
    });

    if (res.ok) {
      toast({ title: 'Mensagem de teste enviada!' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <MessageSquare className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Configuração WhatsApp</h1>
          <p className="text-gray-600">
            Configure a integração centralizada do WhatsApp para todo o sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>⭐ Configuração Central Única</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider */}
          <div>
            <Label>Provider</Label>
            <Input value={config.provider} disabled />
          </div>

          {/* Número WhatsApp */}
          <div>
            <Label>Número WhatsApp (Twilio)</Label>
            <Input
              placeholder="+14155238886"
              value={config.phoneNumber}
              onChange={(e) => setConfig({...config, phoneNumber: e.target.value})}
            />
          </div>

          {/* API Key */}
          <div>
            <Label>Twilio Account SID</Label>
            <Input
              type="password"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxx"
              value={config.apiKey}
              onChange={(e) => setConfig({...config, apiKey: e.target.value})}
            />
          </div>

          {/* API Secret */}
          <div>
            <Label>Twilio Auth Token</Label>
            <Input
              type="password"
              placeholder="your_auth_token"
              value={config.apiSecret}
              onChange={(e) => setConfig({...config, apiSecret: e.target.value})}
            />
          </div>

          {/* Ativar */}
          <div className="flex items-center gap-2">
            <Switch
              checked={config.isActive}
              onCheckedChange={(checked) => setConfig({...config, isActive: checked})}
            />
            <Label>Ativar integração WhatsApp</Label>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
            <Button variant="outline" onClick={handleTest}>
              <TestTube className="h-4 w-4 mr-2" />
              Enviar Teste
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info sobre reutilização */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ Esta é a configuração central única
          </h3>
          <p className="text-sm text-blue-800">
            Todas as funcionalidades do sistema (CRM, Agendamentos, Notificações, etc.) 
            usarão esta mesma configuração. Não é necessário configurar WhatsApp em 
            múltiplos lugares.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6. Adicionar Link no Menu de Integrações

**Arquivo:** `src/frontend/src/app/admin/settings/integrations/page.tsx`

Adicionar card WhatsApp:

```typescript
{
  id: 'whatsapp',
  name: 'WhatsApp Business',
  description: '⭐ Configuração centralizada para todo o sistema',
  icon: <MessageSquare className="h-6 w-6" />,
  status: 'configured',
  cost: 'Por mensagem',
  features: ['Templates', 'Automação', 'Webhooks', 'Multi-tenant'],
  setupRequired: true,
  href: '/admin/settings/integrations/whatsapp'  // ⭐ Novo submenu
}
```

### 7. Adicionar Variáveis de Ambiente

**Arquivos:** `env.example`, `env.development`, `env.production`

```env
# ========================================
# WHATSAPP - CONFIGURAÇÃO CENTRAL ÚNICA
# ========================================
# Nota: Estas variáveis são usadas como fallback
# A configuração principal vem do banco (WhatsAppConfig)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
WHATSAPP_FROM_NUMBER=+14155238886
API_BASE_URL=http://localhost:3001

# Cache de configuração WhatsApp (segundos)
WHATSAPP_CONFIG_CACHE_TTL=300
```

### 8. Documentar Padrão de Uso

**Novo arquivo:** `docs/WHATSAPP_CENTRALIZED_CONFIG.md`

````markdown
# 🎯 WhatsApp - Configuração Centralizada

## Princípio Fundamental

**O sistema possui UMA ÚNICA configuração WhatsApp por tenant.**

## Como Usar em Qualquer Feature

### 1. Importar Config Manager
```typescript
import { whatsAppConfigManager } from '@/config/whatsapp.config';
````

### 2. Obter Configuração

```typescript
const config = await whatsAppConfigManager.getConfig(tenantId);

if (!config || !config.isActive) {
  throw new Error('WhatsApp não configurado');
}

// Usar config.phoneNumber, config.apiKey, etc.
```

### 3. Nunca Criar Config Própria

❌ **NÃO FAZER:**

```typescript
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
```

✅ **FAZER:**

```typescript
const config = await whatsAppConfigManager.getConfig(tenantId);
const twilioClient = twilio(config.apiKey, config.apiSecret);
```

## Features que Usam WhatsApp

Todas devem usar a config central:

- ✅ CRM (automações)
- ✅ Agendamentos (confirmações)
- ✅ Bioimpedância (resultados)
- ✅ Notificações gerais
- ✅ Marketing (campanhas)
- ✅ Nutrição (planos)

## Onde Configurar

**UI:** `/admin/settings/integrations/whatsapp`

**API:** `PUT /api/whatsapp/config`

**Banco:** Tabela `whatsapp_configs` (1 registro por tenant)

```

## 📋 Checklist de Validação

Após implementação, verificar:

- [ ] ✅ Apenas 1 arquivo de rotas WhatsApp (`whatsapp.ts`)
- [ ] ✅ Config central criada (`config/whatsapp.config.ts`)
- [ ] ✅ WhatsAppService usa config central (não cria própria)
- [ ] ✅ Todas rotas usam config central
- [ ] ✅ Submenu UI criado (`/integrations/whatsapp`)
- [ ] ✅ Backend inicia sem erros
- [ ] ✅ Cache de config funciona
- [ ] ✅ Invalidação de cache ao atualizar
- [ ] ✅ Documentação centralizada criada
- [ ] ✅ Variáveis de ambiente documentadas

## 🎯 Garantias do Sistema

Após implementação:

1. ✅ **Única Fonte de Verdade:** 1 config por tenant no banco
2. ✅ **Reutilização Total:** Todas features usam mesma config
3. ✅ **Sem Duplicação:** Código eliminado, imports únicos
4. ✅ **Cache Eficiente:** Config cacheada por 5min
5. ✅ **UI Centralizada:** 1 tela para configurar tudo
6. ✅ **Consistência:** Schema Prisma alinhado com service

## 📊 Resumo das Mudanças

| Item | Antes | Depois | Impacto |

|------|-------|--------|---------|

| Arquivos rotas | 2 (duplicados) | 1 (único) | ✅ Simplificado |

| Config sources | Múltiplas | 1 central | ✅ Centralizado |

| Service | Cria config | Usa central | ✅ Reutiliza |

| UI | Sem submenu | Submenu dedicado | ✅ Organizado |

| Cache | Não existia | Implementado | ✅ Performance |

| Documentação | Fragmentada | Centralizada | ✅ Clareza |

## 🚀 Impacto nos Sprints

- **Sprint 4:** WhatsApp já implementado, agora centralizado
- **Sprint 5:** Consolidação de integrações (alinhado)
- **Sprint 6:** Pronto para escalar com multi-tenant

## 📝 Próximos Passos Após Implementação

1. Testar envio via endpoint `/api/whatsapp/send`
2. Configurar via UI `/admin/settings/integrations/whatsapp`
3. Validar cache e invalidação
4. Implementar testes E2E
5. Treinar equipe no padrão de uso

### To-dos

- [ ] Corrigir import do Joi em whatsapp.routes.ts (import Joi from 'joi')
- [ ] Deletar arquivo whatsapp.routes.ts (duplicado e quebrado)
- [ ] Ajustar WhatsAppService.saveMessage() para usar campos corretos do schema (phone, message)
- [ ] Adicionar variáveis Twilio em env.example (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, WHATSAPP_FROM_NUMBER)
- [ ] Verificar que index.ts importa apenas whatsapp.ts (não whatsapp.routes.ts)
- [ ] Testar inicialização do backend (npm run dev) sem erros
- [ ] Atualizar documentação INTEGRACOES_EXTERNAS_GUIA_COMPLETO.md com estrutura final