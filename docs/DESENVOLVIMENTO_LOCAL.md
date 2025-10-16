# FitOS - Guia de Desenvolvimento Local

Este guia explica como configurar e executar o FitOS em ambiente de desenvolvimento local, sem Docker.

## 🚀 Início Rápido

### 1. Setup Inicial
```bash
# Clone o repositório (se ainda não fez)
git clone <repository-url>
cd fitOS

# Execute o setup automático
npm run setup
```

### 2. Iniciar Desenvolvimento
```bash
# Iniciar toda a aplicação
npm run dev

# Ou iniciar componentes separadamente
npm run dev:backend   # Apenas backend (porta 3001)
npm run dev:frontend  # Apenas frontend (porta 3000)
```

## 📋 Pré-requisitos

### Software Necessário
- **Node.js 20+** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### Software Opcional (para funcionalidades completas)
- **Redis** - Para cache e sessões
- **Ollama** - Para IA local
- **Chroma** - Para vector database

## 🔧 Configuração Manual

### 1. Instalar Dependências

```bash
# Instalar dependências do projeto
npm install

# Instalar dependências do backend
cd src/backend
npm install
cd ../..

# Instalar dependências do frontend
cd src/frontend
npm install
cd ../..
```

### 2. Configurar Banco de Dados

```bash
# Criar banco de dados
createdb fitos_dev

# Ou via psql
psql -U postgres
CREATE DATABASE fitos_dev;
\q
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp env.development .env

# Editar configurações se necessário
nano .env
```

### 4. Executar Migrações

```bash
# Gerar cliente Prisma
cd src/backend
npm run db:generate

# Executar migrações
npm run migrate:dev

# Voltar ao diretório raiz
cd ../..
```

## 🌐 Acessos da Aplicação

Após iniciar o desenvolvimento:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Prisma Studio**: http://localhost:5555 (execute `npm run dev:db`)

## 📁 Estrutura do Projeto

```
fitOS/
├── src/
│   ├── backend/          # API Backend (Node.js + Express)
│   │   ├── src/
│   │   │   ├── config/   # Configurações
│   │   │   ├── routes/   # Rotas da API
│   │   │   ├── models/   # Modelos de dados
│   │   │   ├── services/ # Lógica de negócio
│   │   │   └── utils/    # Utilitários
│   │   └── prisma/       # Schema do banco
│   └── frontend/         # Frontend (Next.js + React)
│       ├── src/
│       │   ├── app/      # Páginas (App Router)
│       │   ├── components/ # Componentes React
│       │   ├── lib/      # Utilitários
│       │   └── types/    # Tipos TypeScript
├── scripts/              # Scripts de desenvolvimento
├── docs/                 # Documentação
└── uploads/              # Arquivos enviados (desenvolvimento)
```

## 🛠️ Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev              # Iniciar desenvolvimento completo
npm run dev:backend      # Apenas backend
npm run dev:frontend     # Apenas frontend
npm run dev:db          # Prisma Studio
npm run dev:logs        # Ver logs do backend
```

### Banco de Dados
```bash
npm run migrate:dev     # Executar migrações
npm run migrate:reset   # Resetar banco
npm run seed:dev        # Popular com dados de teste
```

### Testes
```bash
npm run test            # Executar todos os testes
npm run test:backend    # Testes do backend
npm run test:frontend   # Testes do frontend
npm run test:coverage   # Cobertura de testes
```

### Qualidade de Código
```bash
npm run lint            # Verificar código
npm run lint:fix        # Corrigir problemas
npm run type-check      # Verificar tipos TypeScript
```

## 🔍 Debugging

### Logs do Backend
```bash
# Ver logs em tempo real
npm run dev:logs

# Ou diretamente
tail -f src/backend/logs/combined.log
```

### Banco de Dados
```bash
# Acessar Prisma Studio
npm run dev:db

# Conectar via psql
psql -U postgres -d fitos_dev
```

### Frontend
- Use as DevTools do navegador
- Logs aparecem no console do navegador
- Hot reload automático com Next.js

## 🐛 Solução de Problemas

### Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
pg_isready -h localhost -p 5432

# Iniciar PostgreSQL
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Erro de Porta em Uso
```bash
# Verificar processos usando as portas
lsof -i :3000
lsof -i :3001

# Matar processo específico
kill -9 <PID>
```

### Erro de Dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Para backend
cd src/backend
rm -rf node_modules package-lock.json
npm install
cd ../..

# Para frontend
cd src/frontend
rm -rf node_modules package-lock.json
npm install
cd ../..
```

### Erro de Migrações
```bash
# Resetar banco e migrações
cd src/backend
npm run migrate:reset
npm run migrate:dev
cd ../..
```

## 🔄 Fluxo de Desenvolvimento

1. **Fazer mudanças no código**
2. **Testar localmente** (`npm run dev`)
3. **Executar testes** (`npm run test`)
4. **Verificar qualidade** (`npm run lint`)
5. **Fazer commit** das mudanças

## 📚 Recursos Adicionais

- [Documentação do Backend](./BACKEND.md)
- [Documentação do Frontend](./FRONTEND.md)
- [Configurações Técnicas](./CONFIGURACOES_TECNICAS_FITOS.md)
- [Roadmap do Projeto](./ROADMAP_FITOS_DEFINITIVO.md)

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📞 Suporte

Se encontrar problemas:

1. Verifique este guia
2. Consulte os logs de erro
3. Verifique as issues do GitHub
4. Abra uma nova issue com detalhes do problema
