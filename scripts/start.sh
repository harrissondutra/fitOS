#!/bin/bash
# FitOS - Startup Script
# Inicia Backend e Frontend em paralelo

set -e

echo "🚀 Iniciando FitOS..."

# Função para cleanup ao sair
cleanup() {
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Capturar sinais de terminação
trap cleanup SIGTERM SIGINT

# Iniciar Backend
echo "📡 Iniciando Backend (porta 3001)..."
cd /app/src/backend
node dist/index.js &
BACKEND_PID=$!

# Aguardar backend estar pronto
echo "⏳ Aguardando Backend..."
for i in {1..30}; do
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ Backend pronto!"
        break
    fi
    sleep 1
done

# Iniciar Frontend
echo "🎨 Iniciando Frontend (porta 3000)..."
cd /app/src/frontend
npm start &
FRONTEND_PID=$!

# Aguardar frontend estar pronto
echo "⏳ Aguardando Frontend..."
for i in {1..30}; do
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Frontend pronto!"
        break
    fi
    sleep 1
done

echo "🎉 FitOS iniciado com sucesso!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"

# Manter container vivo e monitorar processos
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend morreu, reiniciando..."
        cd /app/src/backend
        node dist/index.js &
        BACKEND_PID=$!
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend morreu, reiniciando..."
        cd /app/src/frontend
        npm start &
        FRONTEND_PID=$!
    fi
    
    sleep 5
done
