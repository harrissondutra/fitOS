# FitOS - Arquitetura Refatorada para Desenvolvimento Local

## 🎯 Objetivo da Refatoração

Refatorar a arquitetura do FitOS para focar no desenvolvimento local, removendo a dependência inicial do Docker e simplificando o processo de setup para desenvolvedores.

## 🏗️ Nova Arquitetura

### Estrutura do Projeto
```
fitOS/
├── src/
│   ├── backend/          # API Backend (Node.js + Express + TypeScript)
│   │   ├── src/
│   │   │   ├── config/   # Configurações centralizadas
│   │   │   ├── routes/   # Rotas da API
│   │   │   ├── models/   # Modelos de dados
│   │   │   ├── services/ # Lógica de negócio
│   │   │   ├── middleware/ # Middlewares
│   │   │   └── utils/    # Utilitários
│   │   ├── prisma/       # Schema do banco de dados
│   │   └── package.json  # Dependências do backend
│   ├── frontend/         # Frontend (Next.js + React + TypeScript)
│   │   ├── src/
│   │   │   ├── app/      # Páginas (App Router)
│   │   │   ├── components/ # Componentes React
│   │   │   ├── lib/      # Utilitários
│   │   │   └── types/    # Tipos TypeScript
│   │   └── package.json  # Dependências do frontend
│   └── shared/           # Código compartilhado
│       ├── types/        # Tipos compartilhados
│       └── utils/        # Utilitários compartilhados
├── scripts/              # Scripts de desenvolvimento
│   ├── setup-dev.sh     # Setup automático
│   └── dev-start.sh     # Início do desenvolvimento
├── docs/                 # Documentação
├── uploads/              # Arquivos de desenvolvimento
└── logs/                 # Logs da aplicação
```

## 🔧 Configurações Principais

### 1. Variáveis de Ambiente
- **Arquivo principal**: `env.development`
- **Cópia local**: `.env` (criado automaticamente)
- **Configuração**: Banco PostgreSQL local, Redis opcional, IA local com Ollama

### 2. Banco de Dados
- **Desenvolvimento**: PostgreSQL local (`fitos_dev`)
- **Schema**: Prisma com multi-tenancy
- **Migrações**: Automáticas via Prisma
- **Studio**: Interface visual para o banco

### 3. Backend (Express + TypeScript)
- **Porta**: 3001
- **Configuração**: Centralizada em `src/backend/src/config/`
- **Logs**: Estruturados com Winston
- **API**: REST com documentação Swagger

### 4. Frontend (Next.js + React)
- **Porta**: 3000
- **Configuração**: Otimizada para desenvolvimento
- **Hot Reload**: Automático
- **Proxy**: API redirecionada automaticamente

## 🚀 Scripts de Desenvolvimento

### Setup Inicial
```bash
npm run setup              # Setup completo automático
```

### Desenvolvimento
```bash
npm run dev                # Aplicação completa
npm run dev:backend        # Apenas backend
npm run dev:frontend       # Apenas frontend
npm run dev:db            # Prisma Studio
npm run dev:logs          # Ver logs
```

### Qualidade de Código
```bash
npm run lint              # Verificar código
npm run lint:fix          # Corrigir problemas
npm run type-check        # Verificar tipos
```

### Testes
```bash
npm run test              # Todos os testes
npm run test:coverage     # Com cobertura
```

## 📋 Pré-requisitos Simplificados

### Obrigatórios
- **Node.js 20+**
- **PostgreSQL 15+**
- **Git**

### Opcionais (para funcionalidades completas)
- **Redis** - Cache e sessões
- **Ollama** - IA local
- **Chroma** - Vector database

## 🔄 Fluxo de Desenvolvimento

1. **Clone e Setup**
   ```bash
   git clone <repo>
   cd fitOS
   npm run setup
   ```

2. **Desenvolvimento**
   ```bash
   npm run dev
   ```

3. **Acesso**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - API Docs: http://localhost:3001/api/docs

## 🎯 Benefícios da Nova Arquitetura

### Para Desenvolvedores
- ✅ **Setup rápido** - Um comando para configurar tudo
- ✅ **Desenvolvimento local** - Sem dependência do Docker
- ✅ **Hot reload** - Mudanças refletidas instantaneamente
- ✅ **Debugging fácil** - Logs estruturados e ferramentas de debug
- ✅ **Configuração simples** - Arquivos de configuração centralizados

### Para o Projeto
- ✅ **Manutenibilidade** - Código organizado e documentado
- ✅ **Escalabilidade** - Arquitetura preparada para crescimento
- ✅ **Flexibilidade** - Fácil de modificar e estender
- ✅ **Performance** - Otimizado para desenvolvimento local

## 🔮 Próximos Passos

### Fase 1: Desenvolvimento Local (Atual)
- [x] Setup automático
- [x] Configurações otimizadas
- [x] Scripts de desenvolvimento
- [x] Documentação completa

### Fase 2: Docker para Produção
- [ ] Dockerfile otimizado
- [ ] Docker Compose para produção
- [ ] Scripts de deploy
- [ ] Monitoramento com Docker

### Fase 3: Deploy e Infraestrutura
- [ ] Deploy automático
- [ ] CI/CD pipeline
- [ ] Monitoramento em produção
- [ ] Backup e recuperação

## 📚 Documentação Relacionada

- [Desenvolvimento Local](DESENVOLVIMENTO_LOCAL.md) - Guia completo de setup
- [Configurações Técnicas](CONFIGURACOES_TECNICAS_FITOS.md) - Detalhes técnicos
- [Roadmap](ROADMAP_FITOS_DEFINITIVO.md) - Plano de desenvolvimento

## 🤝 Contribuindo

1. Siga o guia de desenvolvimento local
2. Use os scripts fornecidos
3. Mantenha a documentação atualizada
4. Teste suas mudanças localmente
5. Faça commits descritivos

---

**Esta arquitetura refatorada prioriza a experiência do desenvolvedor e facilita o desenvolvimento local, mantendo a flexibilidade para deploy em produção quando necessário.**
