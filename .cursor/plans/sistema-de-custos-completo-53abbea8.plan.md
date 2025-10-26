<!-- 53abbea8-ab96-40f0-81a3-808aa0165e7d db97da4d-043c-45c4-a516-1e1796b9b16d -->
# Sistema de Custos 100% Completo + Funcionalidades Avançadas

## 📊 OVERVIEW GERAL

### O que será implementado:

- ✅ **Base (60% já existe)**: 9 páginas, backend core, hooks
- 🔨 **Sprint Atual (40%)**: Spinners → Skeleton, integrações reais, Redis
- 🚀 **15 Funcionalidades Avançadas**: KPIs, tags, ML, IA, APIs, etc.

---

## 🎯 FASE 1: BASE (40% - Manter do Plano Original)

### 1.1 Configuração (5%)

- [ ] Criar branch + adicionar variáveis .env

### 1.2 Backend - Integrações (25%)

- [ ] Cloudinary, Database, AWS trackers com Redis
- [ ] AI cost tracking enhancement

### 1.3 Backend - Automação (15%)

- [ ] Cron jobs, middleware, webhooks

### 1.4 Frontend - Skeleton (35%)

- [ ] Substituir spinner por Skeleton em 9 páginas
- [ ] Remover mocks de armazenamento

### 1.5 Backend - Análise Básica (15%)

- [ ] Análise preditiva simples
- [ ] Relatórios agendados

### 1.6 Validação (5%)

- [ ] Testes e validação final

---

## 💰 ANÁLISE DE CUSTOS DAS INTEGRAÇÕES

### ✅ APIs GRATUITAS (Prioridade ALTA - implementar primeiro)

1. **Cloudinary Admin API** - ✅ **GRÁTIS**

   - Já incluída no plano free/paid
   - Endpoint: `https://api.cloudinary.com/v1_1/{cloud_name}/usage`
   - Apenas Basic Auth necessário

2. **PostgreSQL Queries** - ✅ **GRÁTIS**

   - Queries internas ao banco (pg_total_relation_size)
   - Sem custo adicional

3. **Redis Local** - ✅ **GRÁTIS**

   - Já provisionado remotamente
   - Sem custo adicional de API

4. **ExchangeRate-API** - ✅ **GRÁTIS** (até 1500 req/mês)

   - API: `https://api.exchangerate-api.com/v4/latest/USD`
   - Tier free suficiente para uso

5. **FreeCurrencyAPI** - ✅ **GRÁTIS** (até 5000 req/mês)

   - API: `https://freecurrencyapi.com/api/v1/latest`
   - Alternativa ao ExchangeRate

6. **Detecção de Anomalias Estatística** - ✅ **GRÁTIS**

   - Algoritmo próprio (Z-Score, desvio padrão)
   - Sem dependências externas

7. **Slack Webhooks** - ✅ **GRÁTIS**

   - Incoming webhooks gratuitos
   - Ilimitado no plano free

8. **Discord Webhooks** - ✅ **GRÁTIS**

   - Webhooks nativos gratuitos
   - Sem limite

9. **Email via SMTP** - ✅ **GRÁTIS**

   - Usando servidor SMTP existente
   - Já configurado (EMAIL_* vars)

10. **Benchmark Interno** - ✅ **GRÁTIS**

    - Dados mockados baseados em pesquisa de mercado
    - Sem API externa necessária

---

### ⚠️ APIs PAGAS (Prioridade MÉDIA/BAIXA - implementar depois)

1. **AWS Cost Explorer API** - 💰 **PAGO**

   - **Custo**: $0.01 por request
   - **Estimativa**: ~$10-30/mês (1000-3000 requests)
   - **Alternativa grátis**: Desabilitar em dev, usar apenas em prod se necessário
   - **Decisão**: Implementar mas deixar desabilitado por padrão

2. **OpenAI API (GPT-4)** - 💰 **PAGO**

   - **Custo**: $0.03/1K tokens input, $0.06/1K tokens output
   - **Uso**: Sugestões de otimização com IA
   - **Estimativa**: ~$20-50/mês (uso moderado)
   - **Alternativa grátis**: Usar regras baseadas em lógica ao invés de LLM
   - **Decisão**: Opcional, usar apenas se orçamento permitir

3. **Anthropic Claude API** - 💰 **PAGO**

   - **Custo**: $0.003/1K tokens input, $0.015/1K tokens output
   - **Uso**: Alternativa ao GPT-4
   - **Estimativa**: ~$10-30/mês
   - **Decisão**: Opcional

4. **Twilio WhatsApp API** - 💰 **PAGO**

   - **Custo**: $0.005 por mensagem
   - **Estimativa**: ~$5-15/mês (1000-3000 msgs)
   - **Alternativa grátis**: Usar apenas Email + Slack + Discord
   - **Decisão**: Implementar estrutura, mas desabilitar por padrão

5. **Prophet/ARIMA (Python ML)** - ✅ **GRÁTIS** (infra pode ter custo)

   - **Software**: Open source gratuito
   - **Infra**: Requer servidor Python (pode ser o mesmo backend)
   - **Custo real**: Apenas servidor (já provisionado)
   - **Decisão**: Implementar, considerar custo de infra desprezível

6. **Stripe API** - ✅ **GRÁTIS** (API grátis, taxas são sobre transações)

   - **API**: Gratuita
   - **Custo**: Apenas taxas de transação (não da API)
   - **Decisão**: Implementar webhook listener

7. **Mercado Pago API** - ✅ **GRÁTIS** (API grátis, taxas são sobre transações)

   - **API**: Gratuita
   - **Custo**: Apenas taxas de transação
   - **Decisão**: Implementar webhook listener

8. **Industry Benchmark APIs** - 💰 **PAGO** (opcional)

   - **Ex**: Cloudability, Apptio - Enterprise pricing
   - **Alternativa grátis**: Usar dados mockados baseados em pesquisa
   - **Decisão**: Usar mock, não integrar API paga

---

### 🎯 ESTRATÉGIA DE IMPLEMENTAÇÃO ATUALIZADA

#### **SPRINT ATUAL (Prioridade 1 - APENAS GRÁTIS)**

✅ **Implementar APENAS APIs gratuitas**:

1. Cloudinary Admin API (grátis)
2. PostgreSQL queries (grátis)
3. Redis cache (grátis)
4. ExchangeRate-API (grátis - 1500 req/mês)
5. Detecção anomalias estatística (grátis)
6. Slack/Discord webhooks (grátis)
7. Email SMTP (grátis)
8. Benchmark interno mock (grátis)

❌ **NÃO implementar ainda**:

- AWS Cost Explorer (pago)
- OpenAI/Anthropic (pago)
- Twilio WhatsApp (pago)
- APIs enterprise de benchmark (pago)

#### **PREPARAR ESTRUTURA (mas desabilitar por padrão)**

🔧 **Criar estrutura, mas com flags de desativação**:

```typescript
// Variáveis de ambiente com flags
AWS_COST_EXPLORER_ENABLED=false          // Desabilitado (pago)
OPENAI_OPTIMIZATION_ENABLED=false        // Desabilitado (pago)
TWILIO_WHATSAPP_ENABLED=false           // Desabilitado (pago)
ANTHROPIC_ENABLED=false                  // Desabilitado (pago)

// Gratuitas - sempre habilitadas
CLOUDINARY_TRACKING_ENABLED=true         // Grátis
DATABASE_TRACKING_ENABLED=true           // Grátis
SLACK_NOTIFICATIONS_ENABLED=true         // Grátis
DISCORD_NOTIFICATIONS_ENABLED=true       // Grátis
EMAIL_NOTIFICATIONS_ENABLED=true         // Grátis
CURRENCY_CONVERSION_ENABLED=true         // Grátis (FreeCurrencyAPI)
```

---

### 📋 SUBSTITUIÇÕES GRATUITAS

#### 1. **Otimização com IA → Regras Baseadas em Lógica**

❌ **Pago** (OpenAI GPT-4):

```typescript
const suggestion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: `Analyze costs: ${JSON.stringify(costs)}` }]
});
```

✅ **Grátis** (Regras de negócio):

```typescript
const suggestions = [];

// Regra 1: GPT-4 muito usado
if (usage.gpt4Percentage > 60) {
  suggestions.push({
    type: 'provider_change',
    description: 'Trocar 60% das calls GPT-4 por GPT-3.5 em casos simples',
    savings: calculateGPTSavings(usage, 0.6),
    effort: 'medium',
  });
}

// Regra 2: Cache miss alto
if (usage.cacheMissRate > 0.3) {
  suggestions.push({
    type: 'cache_optimization',
    description: 'Aumentar TTL de cache de 1h para 6h',
    savings: usage.cloudinaryCost * 0.2,
    effort: 'low',
  });
}

// Regra 3: Imagens não comprimidas
if (usage.compressionRate < 0.5) {
  suggestions.push({
    type: 'compression',
    description: 'Ativar compressão WebP antes do upload',
    savings: usage.imageBandwidth * 0.4 * costPerGB,
    effort: 'low',
  });
}
```

**Resultado**: Mesma funcionalidade, ZERO custo de API

---

#### 2. **WhatsApp → Slack/Discord/Email**

❌ **Pago** (Twilio):

```typescript
await twilio.messages.create({
  from: 'whatsapp:+14155238886',
  to: 'whatsapp:+5511999999999',
  body: 'Alerta de custo crítico'
});
// Custo: $0.005/msg
```

✅ **Grátis** (Múltiplos canais):

```typescript
// Slack (grátis)
await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify({ text: '🚨 Alerta de custo crítico' })
});

// Discord (grátis)
await fetch(process.env.DISCORD_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify({ content: '⚠️ Alerta de custo crítico' })
});

// Email (grátis)
await sendEmail({
  to: process.env.COST_ALERT_EMAIL_TO,
  subject: 'Alerta Crítico de Custos',
  html: alertTemplate
});
```

**Resultado**: Mesmo impacto, ZERO custo adicional

---

#### 3. **AWS Cost Explorer → Entrada Manual + Webhook**

❌ **Pago** (AWS Cost Explorer API):

```typescript
const costs = await costExplorer.getCostAndUsage({
  TimePeriod: { Start: '2024-01-01', End: '2024-01-31' },
  Granularity: 'DAILY',
  Metrics: ['BlendedCost']
});
// Custo: $0.01/request
```

✅ **Grátis** (Entrada manual + webhook do billing):

```typescript
// 1. Entrada manual via UI (admin adiciona custo mensal)
// 2. Webhook do AWS Billing Alerts (grátis, nativo)
app.post('/webhooks/aws-billing', async (req, res) => {
  const { alarm, cost } = req.body;
  
  await costService.createEntry({
    categoryId: 'infrastructure',
    serviceId: 'aws',
    amount: cost,
    source: 'webhook',
  });
});
```

**Resultado**: Funcionalidade mantida, ZERO custo de API

---

#### 4. **Benchmark Pago → Mock Baseado em Pesquisa**

❌ **Pago** (Cloudability API - Enterprise):

```typescript
const benchmark = await cloudability.getBenchmark({
  category: 'ai',
  companySize: 'startup'
});
```

✅ **Grátis** (Dados mockados de pesquisa de mercado):

```typescript
const industryBenchmarks = {
  ai: {
    startup: {
      average: 5000,  // Baseado em pesquisa de mercado
      median: 4200,
      p25: 2500,
      p75: 7000,
    },
    small: {
      average: 15000,
      median: 12000,
      p25: 8000,
      p75: 20000,
    }
  },
  storage: {
    startup: {
      average: 800,
      median: 650,
      p25: 400,
      p75: 1200,
    }
  }
};

// Atualizar dados trimestralmente via pesquisa manual
```

**Resultado**: Funcionalidade útil, ZERO custo de API

---

## 🚀 FASE 2: FUNCIONALIDADES AVANÇADAS (60%)

## 📊 NÍVEL 1: Essenciais (25%) - APENAS GRÁTIS

### 2.1 Dashboard Executivo com KPIs Avançados (5%)

**Arquivos**:

- `src/backend/src/services/kpi-calculator.service.ts` (novo)
- `src/frontend/src/app/super-admin/management/costs/_components/executive-dashboard.tsx` (novo)

**Implementar KPIs**:

```typescript
interface ExecutiveKPIs {
  // Métricas de eficiência
  costPerUser: number;           // Custo total / usuários ativos
  costPerRequest: number;         // Custo total / número de requests
  costPerFeature: {               // Custo atribuído por feature
    featureName: string;
    cost: number;
    percentage: number;
  }[];
  
  // Métricas financeiras
  burnRate: number;               // Quanto gasta por dia (R$/dia)
  runway: number;                 // Quantos meses o orçamento dura
  monthlyRecurringCost: number;   // Custos recorrentes mensais
  variableCostRatio: number;      // % de custos variáveis
  
  // Métricas de eficiência
  costEfficiencyScore: number;    // Score 0-100
  wastePercentage: number;        // % de recursos desperdiçados
  optimizationPotential: number;  // Economia potencial (R$)
  
  // Comparações
  vsLastMonth: {
    costChange: number;
    efficiencyChange: number;
  };
  vsTarget: {
    costDiff: number;
    status: 'on_track' | 'over_budget' | 'under_budget';
  };
}
```

**Componente Frontend**:

```typescript
// Cards executivos com Skeleton
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <ExecutiveKPICard
    title="Cost Per User"
    value={formatCurrency(kpis.costPerUser)}
    change={kpis.vsLastMonth.costChange}
    icon={Users}
  />
  <ExecutiveKPICard
    title="Burn Rate"
    value={`${formatCurrency(kpis.burnRate)}/dia`}
    subtitle={`Runway: ${kpis.runway} meses`}
    icon={TrendingDown}
  />
  <ExecutiveKPICard
    title="Efficiency Score"
    value={`${kpis.costEfficiencyScore}/100`}
    progress={kpis.costEfficiencyScore}
    icon={Target}
  />
  <ExecutiveKPICard
    title="Optimization Potential"
    value={formatCurrency(kpis.optimizationPotential)}
    subtitle={`${kpis.wastePercentage}% de desperdício`}
    icon={Zap}
  />
</div>
```

---

### 2.2 Sistema de Tags e Categorização Avançada (3%)

**Arquivos**:

- `src/backend/prisma/schema.prisma` - adicionar tags ao CostEntry
- `src/backend/src/services/cost-tagging.service.ts` (novo)
- `src/frontend/src/app/super-admin/management/costs/_components/tag-selector.tsx` (novo)

**Schema Prisma** (adicionar):

```prisma
model CostEntry {
  // ... campos existentes
  tags          String[]  // Array de tags
  project       String?   // Projeto específico
  team          String?   // Time responsável  
  environment   String?   // production, staging, development
  customFields  Json?     // Campos customizados flexíveis
}

model CostTag {
  id          String   @id @default(cuid())
  name        String   @unique
  color       String   // Cor hex para UI
  category    String?  // Categoria da tag
  description String?
  createdAt   DateTime @default(now())
}
```

**Componente de Tags**:

```typescript
<TagSelector
  selected={selectedTags}
  onChange={setSelectedTags}
  suggestions={['producao', 'desenvolvimento', 'teste', 'marketing']}
  allowCreate={true}
/>

// Filtros avançados
<CostFilters>
  <TagFilter tags={['producao', 'api-users']} />
  <ProjectFilter projects={['projeto-a', 'projeto-b']} />
  <TeamFilter teams={['backend', 'frontend']} />
  <EnvironmentFilter env={['production']} />
</CostFilters>
```

---

### 2.3 Comparação de Períodos (MoM, YoY, QoQ, WoW) (3%)

**Arquivos**:

- `src/backend/src/services/cost-comparison.service.ts` (novo)
- `src/frontend/src/app/super-admin/management/costs/_components/period-comparison.tsx` (novo)

**Comparações**:

```typescript
interface PeriodComparison {
  current: {
    period: string;
    totalCost: number;
    breakdown: CategoryBreakdown[];
  };
  previous: {
    period: string;
    totalCost: number;
    breakdown: CategoryBreakdown[];
  };
  comparison: {
    absolute: number;    // Diferença em R$
    percentage: number;  // Diferença em %
    trend: 'up' | 'down' | 'stable';
  };
}

// Tipos de comparação
enum ComparisonType {
  MOM = 'month_over_month',    // Mês atual vs mês anterior
  YOY = 'year_over_year',      // Ano atual vs ano anterior
  QOQ = 'quarter_over_quarter', // Trimestre atual vs anterior
  WOW = 'week_over_week',      // Semana atual vs anterior
}
```

**Componente**:

```typescript
<PeriodComparison
  type="MOM"
  current={currentMonth}
  previous={previousMonth}
>
  <ComparisonChart />
  <ComparisonTable />
  <ComparisonInsights />
</PeriodComparison>
```

---

### 2.4 Alertas Inteligentes com IA (7%)

**Arquivos**:

- `src/backend/src/services/intelligent-alerts.service.ts` (novo)
- `src/backend/src/services/anomaly-detection.service.ts` (novo)
- `src/backend/src/services/notification-channels.service.ts` (novo)

**Tipos de Alertas**:

```typescript
interface IntelligentAlert {
  type: 
    | 'anomaly_detected'           // ML detectou anomalia
    | 'budget_threshold'            // 75%, 90%, 100% do orçamento
    | 'forecast_overrun'           // Previsão de estouro
    | 'optimization_opportunity'    // Oportunidade de economia
    | 'inefficient_usage'          // Recursos ociosos
    | 'spike_detected';            // Pico inesperado
  
  severity: 'info' | 'warning' | 'critical';
  
  detection: {
    method: 'statistical' | 'ml' | 'threshold';
    confidence: number;  // 0-100%
    deviation: number;   // Desvios padrão
  };
  
  impact: {
    currentCost: number;
    expectedCost: number;
    difference: number;
    affectedServices: string[];
  };
  
  recommendation: {
    action: string;
    potentialSavings: number;
    effort: 'low' | 'medium' | 'high';
    steps: string[];
  };
  
  notifications: {
    channels: ('email' | 'slack' | 'discord' | 'whatsapp' | 'webhook')[];
    recipients: string[];
    sent: boolean;
    sentAt?: Date;
  };
}
```

**Detecção de Anomalias com Z-Score**:

```typescript
// Método estatístico simples mas eficaz
class AnomalyDetectionService {
  detectAnomalies(timeSeries: number[]): Anomaly[] {
    const mean = this.calculateMean(timeSeries);
    const stdDev = this.calculateStdDev(timeSeries, mean);
    
    const threshold = parseFloat(
      process.env.COST_ANOMALY_DETECTION_THRESHOLD || '2'
    ); // 2 desvios padrão
    
    return timeSeries.map((value, index) => {
      const zScore = (value - mean) / stdDev;
      
      if (Math.abs(zScore) > threshold) {
        return {
          index,
          value,
          zScore,
          isAnomaly: true,
          severity: Math.abs(zScore) > 3 ? 'critical' : 'warning',
        };
      }
      
      return null;
    }).filter(Boolean);
  }
}
```

**Múltiplos Canais**:

```typescript
// Slack
await notificationService.send({
  channel: 'slack',
  webhook: process.env.SLACK_WEBHOOK_URL,
  message: `🚨 Alerta: Custo de IA aumentou 150% hoje`,
});

// Discord
await notificationService.send({
  channel: 'discord',
  webhook: process.env.DISCORD_WEBHOOK_URL,
  message: `⚠️ Orçamento em 90%`,
});

// WhatsApp (via Twilio)
await notificationService.send({
  channel: 'whatsapp',
  to: '+5511999999999',
  message: 'Alerta crítico de custos',
});

// Email
await notificationService.send({
  channel: 'email',
  to: process.env.COST_ALERT_EMAIL_TO,
  subject: 'Alerta de Custos',
  html: alertTemplate,
});

// Webhook customizado
await notificationService.send({
  channel: 'webhook',
  url: process.env.CUSTOM_WEBHOOK_URL,
  payload: alertData,
});
```

---

### 2.5 Sistema de Aprovação de Custos (7%)

**Arquivos**:

- `src/backend/prisma/schema.prisma` - adicionar modelo CostApproval
- `src/backend/src/services/cost-approval.service.ts` (novo)
- `src/frontend/src/app/super-admin/management/costs/aprovacoes/page.tsx` (novo)

**Schema**:

```prisma
model CostApproval {
  id            String   @id @default(cuid())
  costEntryId   String?  // Custo manual que precisa aprovação
  budgetId      String?  // Orçamento que precisa aprovação
  
  type          String   // 'cost_entry' | 'budget_change'
  amount        Decimal  
  description   String
  
  threshold     Decimal  // Threshold que acionou a aprovação
  
  status        String   @default("pending") // pending, approved, rejected
  
  requestedBy   String
  requestedAt   DateTime @default(now())
  
  approvers     String[] // Lista de IDs de aprovadores
  approvedBy    String?
  approvedAt    DateTime?
  
  rejectedBy    String?
  rejectedAt    DateTime?
  reason        String?  // Motivo da rejeição
  
  metadata      Json?
  
  @@index([status])
  @@index([requestedBy])
}

model ApprovalRule {
  id          String   @id @default(cuid())
  category    String?  // Categoria específica ou null para geral
  threshold   Decimal  // Custos > threshold precisam aprovação
  approvers   String[] // Lista de aprovadores
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

**Fluxo**:

```typescript
// 1. Detecção automática
if (costEntry.amount > approvalRule.threshold) {
  await costApprovalService.createApproval({
    costEntryId: costEntry.id,
    amount: costEntry.amount,
    approvers: approvalRule.approvers,
  });
  
  // Notificar aprovadores
  await notificationService.notifyApprovers(approvalRule.approvers);
}

// 2. Página de aprovações pendentes
<ApprovalsPendingList>
  {approvals.map(approval => (
    <ApprovalCard
      approval={approval}
      onApprove={() => handleApprove(approval.id)}
      onReject={(reason) => handleReject(approval.id, reason)}
    />
  ))}
</ApprovalsPendingList>
```

---

## 📈 NÍVEL 2: Avançadas (20%)

### 2.6 Cost Allocation Rules (Rateio Automático) (5%)

**Arquivos**:

- `src/backend/src/services/cost-allocation.service.ts` (novo)
- `src/frontend/src/app/super-admin/management/costs/rateio/page.tsx` (novo)

**Schema**:

```prisma
model AllocationRule {
  id              String   @id @default(cuid())
  name            String
  costCategory    String   // ai, storage, database
  allocationType  String   // equal, proportional, usage_based, custom
  
  targets         Json     // Array de { tenantId, percentage/weight }
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AllocatedCost {
  id              String   @id @default(cuid())
  originalCostId  String
  tenantId        String
  allocatedAmount Decimal
  percentage      Decimal
  ruleId          String
  createdAt       DateTime @default(now())
}
```

**Lógica de Rateio**:

```typescript
// Rateio igualitário
const equalAllocation = totalCost / tenants.length;

// Rateio proporcional (por uso)
const proportionalAllocation = tenants.map(tenant => ({
  tenantId: tenant.id,
  amount: (tenant.usagePercentage / 100) * totalCost,
}));

// Rateio customizado
const customAllocation = rule.targets.map(target => ({
  tenantId: target.tenantId,
  amount: (target.percentage / 100) * totalCost,
}));
```

---

### 2.7 Simulador de Cenários (What-If Analysis) (4%)

**Arquivos**:

- `src/backend/src/services/scenario-simulator.service.ts` (novo)
- `src/frontend/src/app/super-admin/management/costs/simulador/page.tsx` (novo)

**Interface**:

```typescript
interface Scenario {
  name: string;
  variables: {
    userGrowth?: number;        // % crescimento de usuários
    requestsMultiplier?: number; // Multiplicador de requests
    providerChange?: {
      from: string;
      to: string;
      savingsPercentage: number;
    };
    optimizationSavings?: number; // % de economia via otimização
  };
  
  projection: {
    months: number;
    monthlyCosts: number[];
    totalCost: number;
    vsBaseline: {
      absolute: number;
      percentage: number;
    };
  };
}
```

**Componente**:

```typescript
<ScenarioSimulator>
  <ScenarioBuilder>
    <Input label="Crescimento de usuários (%)" />
    <Select label="Mudar provider" options={providers} />
    <Input label="Otimização esperada (%)" />
  </ScenarioBuilder>
  
  <ScenarioResults>
    <ComparisonChart scenarios={[baseline, scenario1, scenario2]} />
    <ImpactSummary />
  </ScenarioResults>
</ScenarioSimulator>
```

---

### 2.8 Benchmark contra Indústria (3%)

**Arquivos**:

- `src/backend/src/services/industry-benchmark.service.ts` (novo)
- `src/frontend/src/app/super-admin/management/costs/_components/benchmark-widget.tsx` (novo)

**Dados de Benchmark** (mockados ou API externa):

```typescript
interface IndustryBenchmark {
  category: string;
  companySize: 'startup' | 'small' | 'medium' | 'large';
  
  yourCost: number;
  industryAverage: number;
  industryMedian: number;
  industryP25: number;  // 25º percentil
  industryP75: number;  // 75º percentil
  
  percentile: number;   // Você está no percentil X
  rating: 'excellent' | 'good' | 'average' | 'poor';
  
  recommendation: string;
}
```

**Componente**:

```typescript
<BenchmarkCard category="ai">
  <BenchmarkChart
    your={yourCost}
    average={benchmark.industryAverage}
    median={benchmark.industryMedian}
  />
  
  <BenchmarkRating rating={benchmark.rating}>
    Você está no top {benchmark.percentile}%
  </BenchmarkRating>
  
  <BenchmarkRecommendation>
    {benchmark.recommendation}
  </BenchmarkRecommendation>
</BenchmarkCard>
```

---

### 2.9 Cost Optimization Suggestions com IA (8%)

**Arquivos**:

- `src/backend/src/services/optimization-engine.service.ts` (novo)
- `src/frontend/src/app/super-admin/management/costs/otimizacao/page.tsx` (novo)

**Engine de Otimização**:

```typescript
interface OptimizationSuggestion {
  id: string;
  type: 
    | 'provider_change'
    | 'usage_reduction'
    | 'plan_upgrade'
    | 'cache_optimization'
    | 'compression'
    | 'batch_processing'
    | 'reserved_instances';
  
  priority: 'high' | 'medium' | 'low';
  
  current: {
    service: string;
    cost: number;
    usage: number;
  };
  
  proposed: {
    service?: string;
    cost: number;
    usage?: number;
  };
  
  savings: {
    monthly: number;
    annual: number;
    percentage: number;
  };
  
  effort: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  
  implementation: {
    steps: string[];
    estimatedTime: string;
    dependencies: string[];
  };
  
  impact: {
    performance?: 'positive' | 'neutral' | 'negative';
    reliability?: 'positive' | 'neutral' | 'negative';
    userExperience?: 'positive' | 'neutral' | 'negative';
  };
}
```

**Regras de Otimização** (baseadas em padrões):

```typescript
const optimizationRules = [
  {
    condition: (usage) => usage.gpt4Calls > 1000 && usage.gpt4Calls / usage.totalCalls > 0.6,
    suggestion: {
      type: 'provider_change',
      description: 'Trocar 60% das calls GPT-4 por GPT-3.5 em casos simples',
      savings: calculateSavings(usage, 0.6, 'gpt-3.5'),
      effort: 'medium',
    },
  },
  {
    condition: (usage) => usage.imageBandwidth > 100 && usage.compressionRate < 0.5,
    suggestion: {
      type: 'compression',
      description: 'Ativar compressão de imagens (WebP) antes do upload',
      savings: usage.imageBandwidth * 0.4 * costPerGB,
      effort: 'low',
    },
  },
  {
    condition: (usage) => usage.cacheMissRate > 0.3,
    suggestion: {
      type: 'cache_optimization',
      description: 'Aumentar TTL de cache de 1h para 6h em conteúdo estático',
      savings: usage.cloudinaryCost * 0.2,
      effort: 'low',
    },
  },
];
```

**Componente**:

```typescript
<OptimizationDashboard>
  <OptimizationSummary
    totalSavingsPotential={sumSavings(suggestions)}
    highPriority={suggestions.filter(s => s.priority === 'high').length}
  />
  
  <OptimizationList>
    {suggestions.map(suggestion => (
      <OptimizationCard
        key={suggestion.id}
        suggestion={suggestion}
        onImplement={() => trackImplementation(suggestion.id)}
        onDismiss={() => dismissSuggestion(suggestion.id)}
      />
    ))}
  </OptimizationList>
</OptimizationDashboard>
```

---

## 🚀 NÍVEL 3: Premium (15%)

### 2.10 Integração com Sistemas Financeiros/ERP (4%)

**Arquivos**:

- `src/backend/src/services/erp-integration.service.ts` (novo)
- `src/backend/src/services/accounting-export.service.ts` (novo)

**Exportação Contábil**:

```typescript
interface AccountingExport {
  format: 'sap' | 'oracle' | 'totvs' | 'sage' | 'generic_csv';
  
  entries: {
    date: Date;
    account: string;        // GL Account
    costCenter: string;     // Centro de custo
    description: string;
    debit: number;
    credit: number;
    reference: string;
    taxCode?: string;
  }[];
  
  summary: {
    totalDebit: number;
    totalCredit: number;
    balance: number;
  };
}
```

**Mapeamento de Contas**:

```typescript
const accountMapping = {
  ai: process.env.GL_ACCOUNT_AI || '6.1.1.001',              // Custos de IA
  storage: process.env.GL_ACCOUNT_STORAGE || '6.1.1.002',    // Custos de Storage
  database: process.env.GL_ACCOUNT_DATABASE || '6.1.1.003',  // Custos de Database
  payment: process.env.GL_ACCOUNT_PAYMENT || '6.1.2.001',    // Taxas de Pagamento
};
```

---

### 2.11 FinOps Dashboard (CloudOps Style) (5%)

**Arquivos**:

- `src/frontend/src/app/super-admin/management/costs/finops/page.tsx` (novo)
- `src/frontend/src/app/super-admin/management/costs/_components/finops-widgets/*` (múltiplos)

**Visualizações Avançadas**:

```typescript
// 1. Heatmap de custos por hora
<CostHeatmap
  data={hourlyData}
  xAxis="hourOfDay"
  yAxis="dayOfWeek"
  colorScale="blues"
/>

// 2. Treemap de breakdown
<CostTreemap
  data={hierarchicalData}
  levels={['category', 'service', 'tenant']}
  colorBy="cost"
/>

// 3. Sankey diagram (fluxo de custos)
<CostSankeyDiagram
  flows={[
    { from: 'Total', to: 'IA', value: 5000 },
    { from: 'IA', to: 'GPT-4', value: 3000 },
    { from: 'IA', to: 'Claude', value: 2000 },
  ]}
/>

// 4. Cost Explorer interativo
<CostExplorer
  data={costData}
  dimensions={['category', 'service', 'tenant', 'tag']}
  metrics={['cost', 'usage', 'efficiency']}
  filters={advancedFilters}
  savedQueries={userQueries}
/>
```

---

### 2.12 Cost Attribution com Machine Learning (4%)

**Arquivos**:

- `src/backend/src/services/ml-attribution.service.ts` (novo)
- Requer: Python microservice ou biblioteca ML em Node

**Atribuição por Feature**:

```typescript
// Usar análise de correlação para atribuir custos
interface FeatureAttribution {
  feature: string;
  
  attribution: {
    aiCost: number;
    storageCost: number;
    databaseCost: number;
    totalCost: number;
  };
  
  confidence: number;  // 0-100%
  
  usage: {
    requests: number;
    activeUsers: number;
    dataProcessed: number;
  };
  
  efficiency: {
    costPerRequest: number;
    costPerUser: number;
    roi: number;
  };
  
  recommendation: 
    | 'optimize'      // Feature cara, otimizar
    | 'maintain'      // Custo ok
    | 'deprecate'     // Feature cara e pouco usada
    | 'scale';        // Feature eficiente, escalar
}
```

**Algoritmo Simplificado**:

```typescript
// Regressão linear simples para atribuição
class MLAttributionService {
  async attributeCosts(features: Feature[], costs: Cost[]): Promise<FeatureAttribution[]> {
    // Correlação entre uso de feature e custos
    return features.map(feature => {
      const correlation = this.calculateCorrelation(
        feature.usageTimeSeries,
        costs.timeSeries
      );
      
      const attributedCost = correlation * totalCost;
      
      return {
        feature: feature.name,
        attribution: { totalCost: attributedCost },
        confidence: Math.abs(correlation) * 100,
      };
    });
  }
}
```

---

### 2.13 Multi-Currency e Multi-Region (1%)

**Arquivos**:

- `src/backend/src/services/currency-converter.service.ts` (novo)

**Conversão Automática**:

```typescript
// API de taxas de câmbio (usar FreeCurrencyAPI ou ExchangeRate-API)
const rates = await fetch(
  `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
);

// Conversão
const convertedCost = cost * rates[targetCurrency];

// Exibir no dashboard
<CostDisplay
  amount={cost}
  currency={userPreferredCurrency}
  showOriginal={true}
/>
```

---

### 2.14 Cost Forecasting Avançado (Prophet/ARIMA) (3%)

**Arquivos**:

- Python microservice: `src/ml-services/forecasting/prophet_model.py` (novo)
- `src/backend/src/services/advanced-forecasting.service.ts` (novo)

**Python Microservice** (Prophet):

```python
from flask import Flask, request, jsonify
from prophet import Prophet
import pandas as pd

app = Flask(__name__)

@app.route('/forecast', methods=['POST'])
def forecast():
    data = request.json['timeSeries']
    periods = request.json.get('periods', 30)
    
    df = pd.DataFrame({
        'ds': [d['date'] for d in data],
        'y': [d['cost'] for d in data]
    })
    
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False
    )
    model.fit(df)
    
    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)
    
    return jsonify({
        'forecast': forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records')
    })
```

**Chamada do Backend**:

```typescript
const forecast = await fetch('http://localhost:5000/forecast', {
  method: 'POST',
  body: JSON.stringify({
    timeSeries: historicalCosts,
    periods: 90, // 3 meses
  }),
});
```

---

### 2.15 API Pública de Custos (3%)

**Arquivos**:

- `src/backend/src/routes/api/v1/costs-public.ts` (novo)
- Documentação: `docs/API_CUSTOS_V1.md` (novo)

**Endpoints**:

```typescript
// POST /api/v1/costs/track
// Rastrear custo manualmente via API
router.post('/track', authenticateAPIKey, async (req, res) => {
  const { category, service, amount, metadata } = req.body;
  
  const entry = await costService.createEntry({
    categoryId: category,
    serviceId: service,
    amount,
    metadata,
    source: 'api',
    apiKeyId: req.apiKey.id,
  });
  
  res.json({ success: true, data: entry });
});

// GET /api/v1/costs/summary
// Obter resumo de custos
router.get('/summary', authenticateAPIKey, async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;
  
  const summary = await costService.getSummary({
    startDate,
    endDate,
    groupBy,
  });
  
  res.json({ success: true, data: summary });
});

// GET /api/v1/costs/forecast
// Obter previsão de custos
router.get('/forecast', authenticateAPIKey, async (req, res) => {
  const { months = 3 } = req.query;
  
  const forecast = await forecastingService.predict(months);
  
  res.json({ success: true, data: forecast });
});

// GET /api/v1/costs/recommendations
// Obter recomendações de otimização
router.get('/recommendations', authenticateAPIKey, async (req, res) => {
  const suggestions = await optimizationEngine.getSuggestions();
  
  res.json({ success: true, data: suggestions });
});
```

**Webhooks de Eventos**:

```typescript
// Enviar webhook quando eventos ocorrem
enum CostWebhookEvent {
  THRESHOLD_EXCEEDED = 'cost.threshold.exceeded',
  ANOMALY_DETECTED = 'cost.anomaly.detected',
  BUDGET_WARNING = 'cost.budget.warning',
  OPTIMIZATION_FOUND = 'cost.optimization.found',
}

// Configuração de webhook
interface WebhookConfig {
  url: string;
  events: CostWebhookEvent[];
  secret: string;  // Para HMAC signature
  isActive: boolean;
}
```

---

## ✅ CHECKLIST COMPLETO (100%)

### FASE 1: Base (40%)

- [ ] Setup + env vars (5%)
- [ ] Backend integrações (25%)
- [ ] Backend automação (15%)
- [ ] Frontend Skeleton (35%)
- [ ] Análise básica (15%)
- [ ] Validação (5%)

### FASE 2: Nível 1 - Essenciais (25%)

- [ ] KPIs Executivos (5%)
- [ ] Sistema de Tags (3%)
- [ ] Comparação Períodos (3%)
- [ ] Alertas Inteligentes (7%)
- [ ] Aprovação de Custos (7%)

### FASE 2: Nível 2 - Avançadas (20%)

- [ ] Cost Allocation (5%)
- [ ] Simulador Cenários (4%)
- [ ] Benchmark Indústria (3%)
- [ ] Optimization IA (8%)

### FASE 2: Nível 3 - Premium (15%)

- [ ] Integração ERP (4%)
- [ ] FinOps Dashboard (5%)
- [ ] ML Attribution (4%)
- [ ] Multi-Currency (1%)
- [ ] Forecasting Avançado (3%)
- [ ] API Pública (3%)

---

## 📁 RESUMO DE ARQUIVOS

### Backend (26 novos + 2 modificar)

1. Integrações base (7)
2. KPI calculator (1)
3. Cost tagging (1)
4. Period comparison (1)
5. Intelligent alerts (3)
6. Cost approval (1)
7. Cost allocation (1)
8. Scenario simulator (1)
9. Industry benchmark (1)
10. Optimization engine (1)
11. ERP integration (2)
12. ML attribution (1)
13. Currency converter (1)
14. Advanced forecasting (1)
15. Public API (1)

### Frontend (18 novos + 9 modificar)

1. Skeleton em 9 páginas
2. Executive dashboard (1)
3. Tag selector (1)
4. Period comparison (1)
5. Aprovações page (1)
6. Rateio page (1)
7. Simulador page (1)
8. Benchmark widget (1)
9. Otimização page (1)
10. FinOps page (1)
11. + diversos components

### Python Microservice (1)

1. Prophet forecasting service

### Configuração (3)

1. env.example
2. env.development
3. env.production

### Documentação (1)

1. API_CUSTOS_V1.md

---

## ⏱️ ESTIMATIVA TOTAL

| Fase | Tempo |

|------|-------|

| Base (Fase 1) | 33h |

| Nível 1 - Essenciais | 25h |

| Nível 2 - Avançadas | 20h |

| Nível 3 - Premium | 15h |

| **TOTAL** | **93 horas** |

---

## 🎯 PRIORIZAÇÃO SUGERIDA

### Sprint Atual (40h):

✅ Fase 1 completa (33h)

✅ KPIs Executivos (5h)

✅ Sistema de Tags (2h adicional para buffer)

### Sprint N+1 (40h):

✅ Comparação Períodos (3h)

✅ Alertas Inteligentes (7h)

✅ Aprovação de Custos (7h)

✅ Cost Allocation (5h)

✅ Simulador Cenários (4h)

✅ Benchmark (3h)

✅ Optimization IA (8h)

✅ Buffer (3h)

### Sprint N+2 (40h):

✅ Integração ERP (4h)

✅ FinOps Dashboard (5h)

✅ ML Attribution (4h)

✅ Multi-Currency (1h)

✅ Forecasting Avançado (3h)

✅ API Pública (3h)

✅ Testes E2E (10h)

✅ Documentação final (5h)

✅ Buffer (5h)

---

## 🚀 RESULTADO FINAL

✅ Sistema de Custos 100% completo

✅ 15 funcionalidades avançadas

✅ ZERO hardcode

✅ ZERO spinners

✅ Dados 100% reais

✅ Redis cache otimizado

✅ ML/IA integrado

✅ API pública documentada

✅ Pronto para escala enterprise

**Sistema de custos COMPLETO e ROBUSTO pronto para produção!** 🎉

### To-dos

- [ ] Implementar integração real com Cloudinary API para rastreamento automático de custos
- [ ] Implementar integração com AWS Cost Explorer API
- [ ] Criar serviço de monitoramento de database storage e performance
- [ ] Implementar cron jobs para rastreamento automático diário/horário
- [ ] Criar middleware para rastreamento automático de requisições
- [ ] Implementar webhooks para receber notificações de serviços externos
- [ ] Implementar página de custos de IA (inteligencia-artificial/page.tsx)
- [ ] Implementar página de custos de database (database/page.tsx)
- [ ] Implementar página de custos de pagamentos (pagamentos/page.tsx)
- [ ] Implementar página de custos de comunicação (comunicacao/page.tsx)
- [ ] Implementar página de custos de automação (automacao/page.tsx)
- [ ] Implementar página de orçamentos (orcamentos/page.tsx)
- [ ] Implementar página de alertas (alertas/page.tsx)
- [ ] Conectar página de armazenamento com dados reais (remover mocks)
- [ ] Adicionar análise preditiva e detecção de anomalias
- [ ] Implementar sistema de relatórios agendados com envio por email