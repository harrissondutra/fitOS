#!/bin/bash

# FitOS - Script de Setup para Desenvolvimento Local
# Este script configura o ambiente de desenvolvimento sem Docker

set -e

echo "🚀 Configurando FitOS para desenvolvimento local..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Node.js está instalado
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado. Por favor, instale Node.js 20+ primeiro."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js versão 20+ é necessário. Versão atual: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) encontrado"
}

# Verificar se PostgreSQL está instalado
check_postgres() {
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL não encontrado. Instalando PostgreSQL..."
        
        # Detectar sistema operacional
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install postgresql@15
                brew services start postgresql@15
            else
                print_error "Homebrew não encontrado. Instale PostgreSQL manualmente."
                exit 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y postgresql postgresql-contrib
                sudo systemctl start postgresql
                sudo systemctl enable postgresql
            elif command -v yum &> /dev/null; then
                sudo yum install -y postgresql postgresql-server
                sudo postgresql-setup initdb
                sudo systemctl start postgresql
                sudo systemctl enable postgresql
            else
                print_error "Gerenciador de pacotes não suportado. Instale PostgreSQL manualmente."
                exit 1
            fi
        else
            print_error "Sistema operacional não suportado. Instale PostgreSQL manualmente."
            exit 1
        fi
    fi
    
    print_success "PostgreSQL encontrado"
}

# Verificar se Redis está instalado (opcional)
check_redis() {
    if ! command -v redis-server &> /dev/null; then
        print_warning "Redis não encontrado. Instalando Redis..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install redis
                brew services start redis
            else
                print_warning "Homebrew não encontrado. Redis é opcional para desenvolvimento."
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if command -v apt-get &> /dev/null; then
                sudo apt-get install -y redis-server
                sudo systemctl start redis-server
                sudo systemctl enable redis-server
            elif command -v yum &> /dev/null; then
                sudo yum install -y redis
                sudo systemctl start redis
                sudo systemctl enable redis
            else
                print_warning "Gerenciador de pacotes não suportado. Redis é opcional para desenvolvimento."
            fi
        else
            print_warning "Redis é opcional para desenvolvimento."
        fi
    else
        print_success "Redis encontrado"
    fi
}

# Configurar banco de dados
setup_database() {
    print_status "Configurando banco de dados..."
    
    # Criar usuário e banco se não existirem
    sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE fitos_dev OWNER postgres;" 2>/dev/null || true
    
    print_success "Banco de dados configurado"
}

# Instalar dependências
install_dependencies() {
    print_status "Instalando dependências..."
    
    # Instalar dependências do root
    npm install
    
    # Instalar dependências do backend
    cd src/backend
    npm install
    cd ../..
    
    # Instalar dependências do frontend
    cd src/frontend
    npm install
    cd ../..
    
    print_success "Dependências instaladas"
}

# Configurar variáveis de ambiente
setup_environment() {
    print_status "Configurando variáveis de ambiente..."
    
    if [ ! -f .env ]; then
        cp env.development .env
        print_success "Arquivo .env criado a partir do template"
    else
        print_warning "Arquivo .env já existe. Verifique se as configurações estão corretas."
    fi
}

# Executar migrações do banco
run_migrations() {
    print_status "Executando migrações do banco de dados..."
    
    cd src/backend
    npm run db:generate
    npm run migrate:dev
    cd ../..
    
    print_success "Migrações executadas"
}

# Criar diretórios necessários
create_directories() {
    print_status "Criando diretórios necessários..."
    
    mkdir -p uploads
    mkdir -p logs
    mkdir -p src/backend/logs
    mkdir -p src/frontend/.next
    
    print_success "Diretórios criados"
}

# Verificar se as portas estão disponíveis
check_ports() {
    print_status "Verificando portas disponíveis..."
    
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Porta 3000 está em uso. Pode ser necessário parar outros serviços."
    fi
    
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Porta 3001 está em uso. Pode ser necessário parar outros serviços."
    fi
    
    print_success "Verificação de portas concluída"
}

# Função principal
main() {
    echo "🎯 FitOS - Setup de Desenvolvimento Local"
    echo "=========================================="
    
    check_node
    check_postgres
    check_redis
    setup_database
    install_dependencies
    setup_environment
    create_directories
    run_migrations
    check_ports
    
    echo ""
    echo "✅ Setup concluído com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Execute 'npm run dev' para iniciar o desenvolvimento"
    echo "2. Acesse http://localhost:3000 para o frontend"
    echo "3. Acesse http://localhost:3001/api/health para verificar o backend"
    echo ""
    echo "🔧 Comandos úteis:"
    echo "- npm run dev          # Iniciar desenvolvimento"
    echo "- npm run dev:backend  # Apenas backend"
    echo "- npm run dev:frontend # Apenas frontend"
    echo "- npm run test         # Executar testes"
    echo "- npm run lint         # Verificar código"
    echo ""
    echo "📚 Documentação: docs/README.md"
}

# Executar função principal
main "$@"
