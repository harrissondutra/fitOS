#!/bin/bash
# FitOS - Build Script Local
# Script para build e teste local da aplicação

set -e

echo "🚀 Iniciando build do FitOS..."

# Verificar dependências
echo "🔍 Verificando dependências..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 20+ primeiro."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker primeiro."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build do backend
echo "🔧 Build do Backend..."
cd src/backend
npm install
npm run build
cd ../..

# Build do frontend
echo "🎨 Build do Frontend..."
cd src/frontend
npm install
npm run build
cd ../..

# Build da imagem Docker
echo "🐳 Build da imagem Docker..."
docker build -f docker/Dockerfile -t fitos:latest .

echo "✅ Build concluído com sucesso!"
echo ""
echo "📋 Comandos disponíveis:"
echo "  npm run docker:run     # Executar container localmente"
echo "  npm run docker:dev     # Executar com docker-compose (desenvolvimento)"
echo "  npm run deploy:vps     # Preparar deploy para VPS"
echo ""
echo "🌐 Para testar localmente:"
echo "  docker run -p 3000:3000 -p 3001:3001 fitos:latest"
