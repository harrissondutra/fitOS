# FitOS - Fitness Operating System

🚀 **FitOS** é um sistema completo de gestão de academias com IA integrada, arquitetura multi-tenant e foco em desenvolvimento local.

## ✨ Características Principais

- 🤖 **IA Local com Ollama** - Personalização inteligente sem dependências externas
- 🏢 **Multi-Tenant** - Perfeito para academias, personal trainers e comunidades fitness
- 🔒 **100% Self-hosted** - Controle total dos dados e privacidade
- ⚡ **Real-time** - Atualizações instantâneas e feedback em tempo real
- 📊 **Analytics Avançados** - Insights completos sobre a jornada fitness
- 🎯 **Desenvolvimento Local** - Setup simplificado para desenvolvimento

## 🏗️ Arquitetura

### Backend
- **Express.js** + **TypeScript** + **Prisma**
- **PostgreSQL** (banco principal)
- **Redis** (cache e sessões)
- **Ollama** (IA local)
- **Chroma** (vector database)

### Frontend
- **Next.js 14** + **React 18** + **TypeScript**
- **Tailwind CSS** + **ShadcnUI**
- **Zustand** (state management)
- **SWR** (server state)

### Infraestrutura
- **Docker** + **Docker Compose**
- **MinIO** (storage S3-compatible)
- **Grafana** + **Prometheus** (monitoramento)
- **Jaeger** (distributed tracing)

## 🚀 Instalação Rápida

### Pré-requisitos
- **Node.js 20+** e **npm 10+**
- **PostgreSQL 15+**
- **Redis 7+**
- **Docker** e **Docker Compose**
- **Git**

### 1. Clone o repositório
```bash
git clone https://github.com/harrissondutra/fitOS.git
cd fitOS
```

### 2. Setup automático (recomendado)
```bash
# Executa setup completo automaticamente
npm run setup
```

### 3. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite as configurações necessárias
nano .env
```

### 4. Inicie os serviços
```bash
# Iniciar todos os serviços com Docker
docker-compose up -d

# Ou iniciar componentes separadamente
npm run dev:backend   # Backend na porta 3001
npm run dev:frontend  # Frontend na porta 3000
```

### 5. Execute as migrações e seed
```bash
# Executar migrações do banco
npm run migrate:dev

# Popular com dados de exemplo
npm run seed:dev
```

### 6. Acesse a aplicação
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/health

## 📚 Documentação

- **[Deploy no Coolify](docs/COOLIFY_DEPLOY.md)** - Guia completo de deploy no Coolify
- **[Desenvolvimento Local](docs/DESENVOLVIMENTO_LOCAL.md)** - Guia completo de setup
- **[Pipeline CI/CD](docs/CI_CD_PIPELINE.md)** - Esteira de deploy automatizada
- **[Configurações Técnicas](docs/CONFIGURACOES_TECNICAS_FITOS.md)** - Detalhes técnicos
- **[GitHub Secrets](docs/github-secrets.md)** - Configuração de secrets
- **[Roadmap](docs/ROADMAP_FITOS_DEFINITIVO.md)** - Plano de desenvolvimento

## 📱 Funcionalidades

### ✅ Implementado (Sprint 1)
- ✅ **Multi-Tenancy Completo** - Isolamento por academia
- ✅ **Autenticação JWT** - Sistema seguro de autenticação
- ✅ **API REST Completa** - Endpoints para todas as funcionalidades
- ✅ **Sistema de Tenants** - Gerenciamento de organizações
- ✅ **Middleware de Autenticação** - Controle de acesso por roles
- ✅ **Testes Automatizados** - Cobertura completa de testes
- ✅ **CI/CD Pipeline** - Deploy automático com GitHub Actions
- ✅ **Docker Support** - Containerização completa
- ✅ **Health Checks** - Monitoramento de saúde da aplicação
- ✅ **Logs Estruturados** - Sistema de logging avançado

### 🚧 Em Desenvolvimento (Sprint 2)
- 🚧 **Sistema de Billing** - Stripe + Mercado Pago
- 🚧 **Self-Service Onboarding** - Cadastro automático de academias
- 🚧 **Deploy Automático** - Staging e produção

### 📋 Planejado (Sprint 3+)
- 📋 **IA Multiagente** - Coach, Nutrition, Business
- 📋 **Integração com Wearables** - Apple Health, Google Fit
- 📋 **Dashboard Preditivo** - Analytics avançados
- 📋 **Sistema de Limites** - Controle por planos
- 📋 **Marketplace de Profissionais** - Personal trainers e nutricionistas

## 🔧 Scripts Disponíveis

### 🚀 Desenvolvimento
```bash
npm run setup              # Setup inicial completo
npm run dev                # Desenvolvimento completo
npm run dev:backend        # Apenas backend
npm run dev:frontend       # Apenas frontend
npm run dev:db            # Prisma Studio
npm run dev:logs          # Ver logs do backend
```

### 🏗️ Build e Deploy
```bash
npm run build              # Build completo
npm run build:backend      # Build backend
npm run build:frontend     # Build frontend
npm run docker:build       # Build da imagem Docker
npm run docker:run         # Executa container
```

### 🧪 Testes e Qualidade
```bash
npm run test               # Executa todos os testes
npm run test:coverage      # Testes com cobertura
npm run lint               # Linting
npm run lint:fix           # Linting com correção
npm run type-check         # Verificação de tipos
```

### 🗄️ Banco de Dados
```bash
npm run migrate:dev        # Migrações desenvolvimento
npm run migrate:prod       # Migrações produção
npm run migrate:reset      # Reset migrações
npm run seed:dev           # Seed dados desenvolvimento
npm run seed:prod          # Seed dados produção
npm run db:studio          # Prisma Studio
```

### 🐳 Docker
```bash
npm run docker:dev         # Docker desenvolvimento
npm run docker:prod        # Docker produção
npm run docker:build       # Build imagem
npm run docker:run         # Executar container
```

### 📦 Deploy
```bash
npm run deploy:staging     # Deploy staging
npm run deploy:production  # Deploy produção
npm run deploy:vps         # Deploy VPS
```

## 🏢 Multi-Tenant

FitOS suporta múltiplas academias através de subdomínios:

- `academia1.fitos.com` - Academia 1
- `academia2.fitos.com` - Academia 2
- `meugym.com.br` - Domínio personalizado

## 🤖 IA Integrada

### Modelos Suportados
- **Llama 2** - Conversação geral
- **CodeLlama** - Geração de código
- **Mistral** - Raciocínio avançado

### Funcionalidades de IA
- Recomendações de treinos personalizadas
- Chat inteligente com contexto
- Análise de progresso
- Detecção de padrões de treino

## 📊 Monitoramento

### Métricas Disponíveis
- Performance da aplicação
- Uso de recursos
- Requisições por segundo
- Tempo de resposta
- Erros e exceções

### Dashboards Grafana
- Visão geral do sistema
- Performance da aplicação
- Métricas de banco de dados
- Uso de IA e cache

## 🔒 Segurança

- Autenticação JWT com refresh tokens
- Rate limiting por IP e usuário
- Validação de entrada rigorosa
- Headers de segurança (Helmet)
- CORS configurado
- Logs de auditoria

## 🚀 Deploy

### Coolify (Recomendado)
```bash
# Deploy automático no Coolify
# 1. Acesse seu painel do Coolify
# 2. Crie nova aplicação Docker Compose
# 3. Use: https://github.com/harrissondutra/fitOS.git
# 4. Configure: docker-compose.coolify.yml

# Ou use o script automático
./deploy-coolify.sh
```

### VPS
```bash
# Deploy automático para VPS
npm run deploy:vps
```

### Docker Swarm
```bash
# Deploy em cluster
docker stack deploy -c docker/portainer-stack.yml fitos
```

### Kubernetes
```bash
# Deploy em K8s (em breve)
kubectl apply -f k8s/
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Email: suporte@fitos.com
- 💬 Discord: [FitOS Community](https://discord.gg/fitos)
- 📖 Docs: [docs.fitos.com](https://docs.fitos.com)
- 🐛 Issues: [GitHub Issues](https://github.com/harrissondutra/fitOS/issues)

## 🎯 Roadmap

- [x] Estrutura base do projeto
- [x] Autenticação e autorização
- [x] Multi-tenant architecture
- [x] IA local com Ollama
- [x] Monitoramento completo
- [ ] Integração com wearables
- [ ] App mobile (React Native)
- [ ] Marketplace de exercícios
- [ ] Sistema de pagamentos
- [ ] Certificações blockchain

---

**Desenvolvido com ❤️ para a comunidade fitness**