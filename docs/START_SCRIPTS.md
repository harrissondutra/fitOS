# 🚀 Scripts de Inicialização - FitOS

Este documento descreve todos os scripts disponíveis para inicializar a aplicação FitOS.

## 📋 Scripts Disponíveis

### `npm run start`
**Script principal e recomendado**
- ✅ Executa build completo (backend + frontend)
- ✅ Inicia aplicação em modo desenvolvimento
- ✅ Verifica dependências automaticamente
- ✅ Verifica serviços Docker
- ✅ Output colorido e organizado
- ✅ Tratamento de erros

```bash
npm run start
```

### `npm run start:quick`
**Início rápido sem build**
- ⚡ Pula o build (apenas modo dev)
- ✅ Verifica dependências
- ✅ Inicia aplicação rapidamente
- 💡 Ideal para desenvolvimento contínuo

```bash
npm run start:quick
```

### `npm run start:dev`
**Apenas modo desenvolvimento**
- ⚡ Inicia backend e frontend em paralelo
- ❌ Não executa build
- ❌ Não verifica dependências
- 💡 Mais rápido, mas sem verificações

```bash
npm run start:dev
```

### `npm run start:build`
**Apenas build**
- 🔨 Executa build completo
- ❌ Não inicia aplicação
- 💡 Útil para CI/CD ou preparação

```bash
npm run start:build
```

### `npm run start:prod`
**Modo produção**
- 🔨 Executa build completo
- 🚀 Inicia aplicação em modo produção
- 💡 Para deploy ou testes de produção

```bash
npm run start:prod
```

### `npm run start:bash`
**Script bash alternativo**
- 🐧 Script em bash (mais simples)
- ✅ Mesmas funcionalidades do script Node.js
- 💡 Alternativa para ambientes Linux/macOS

```bash
npm run start:bash
```

## 🎯 Quando Usar Cada Script

### Desenvolvimento Diário
```bash
# Primeira vez ou após mudanças significativas
npm run start

# Desenvolvimento contínuo (mais rápido)
npm run start:quick
```

### Desenvolvimento Rápido
```bash
# Quando você sabe que tudo está OK
npm run start:dev
```

### Preparação para Deploy
```bash
# Apenas build
npm run start:build

# Teste de produção
npm run start:prod
```

## ⚙️ Opções Avançadas

### Script Node.js (recomendado)
```bash
# Opções disponíveis
npm run start -- --no-build      # Pular build
npm run start -- --no-docker      # Não verificar Docker
npm run start -- --quick          # Início rápido
npm run start -- --help           # Mostrar ajuda
```

### Script Bash
```bash
# Opções disponíveis
./scripts/quick-start.sh --no-build      # Pular build
./scripts/quick-start.sh --no-docker     # Não verificar Docker
./scripts/quick-start.sh --build-only    # Apenas build
./scripts/quick-start.sh --help          # Mostrar ajuda
```

## 🔧 Configuração

### Variáveis de Ambiente
Certifique-se de que o arquivo `.env` está configurado:

```bash
# Copiar exemplo
cp env.example .env

# Editar configurações
nano .env
```

### Serviços Docker
Para funcionalidade completa, inicie os serviços Docker:

```bash
# Iniciar todos os serviços
docker-compose -f docker/docker-compose.yml up -d

# Verificar status
docker-compose -f docker/docker-compose.yml ps
```

## 🐛 Solução de Problemas

### Erro: "Dependências não encontradas"
```bash
# Instalar dependências
npm install
cd src/backend && npm install
cd ../frontend && npm install
```

### Erro: "Serviços Docker não estão rodando"
```bash
# Iniciar serviços Docker
docker-compose -f docker/docker-compose.yml up -d

# Verificar logs
docker-compose -f docker/docker-compose.yml logs
```

### Erro: "Porta já em uso"
```bash
# Verificar processos usando as portas
lsof -i :3000  # Frontend
lsof -i :3001  # Backend

# Parar processos
kill -9 <PID>
```

### Erro: "Build falhou"
```bash
# Limpar cache e reinstalar
npm run clean
npm install
npm run start:build
```

## 📊 Monitoramento

### Logs em Tempo Real
```bash
# Logs do Docker
docker-compose -f docker/docker-compose.yml logs -f

# Logs da aplicação
npm run start  # Output colorido no terminal
```

### Verificação de Saúde
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001/api/health
- **Grafana**: http://localhost:3001 (admin/admin)
- **MinIO**: http://localhost:9001 (minioadmin/minioadmin)

## 🚀 Performance

### Otimizações de Build
- Build é executado em paralelo (backend + frontend)
- Cache de dependências é preservado
- Apenas arquivos alterados são recompilados

### Otimizações de Desenvolvimento
- Hot reload ativo no frontend
- Watch mode ativo no backend
- Logs coloridos para fácil identificação

## 📝 Exemplos de Uso

### Cenário 1: Primeira Execução
```bash
# 1. Configurar ambiente
cp env.example .env
npm install

# 2. Iniciar serviços Docker
docker-compose -f docker/docker-compose.yml up -d

# 3. Executar migrações
npm run migrate:dev
npm run seed:dev

# 4. Iniciar aplicação
npm run start
```

### Cenário 2: Desenvolvimento Contínuo
```bash
# Início rápido (sem build)
npm run start:quick

# Ou apenas dev (mais rápido ainda)
npm run start:dev
```

### Cenário 3: Deploy
```bash
# Build para produção
npm run start:build

# Teste de produção local
npm run start:prod
```

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs** do script
2. **Consulte este documento** para soluções
3. **Execute com --help** para opções
4. **Abra uma issue** no GitHub

---

**Desenvolvido com ❤️ para facilitar o desenvolvimento FitOS**
