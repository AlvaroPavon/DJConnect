#!/bin/bash

echo "🔄 Actualizando DJConnect..."

# Detectar si usa PM2 o proceso normal
if command -v pm2 &> /dev/null; then
    echo "📦 Detectado PM2"
    
    # Verificar si hay cambios en package.json
    if git diff --name-only | grep -q "package.json"; then
        echo "📦 Instalando nuevas dependencias..."
        npm install
    fi
    
    echo "🔄 Reiniciando con PM2..."
    pm2 restart dj-app
    pm2 logs dj-app --lines 20 --nostream
    
elif pgrep -f "node server.js" > /dev/null; then
    echo "🔄 Detectado proceso Node.js standalone"
    
    # Matar proceso actual
    pkill -f "node server.js"
    sleep 2
    
    # Instalar dependencias si es necesario
    if git diff --name-only | grep -q "package.json"; then
        echo "📦 Instalando nuevas dependencias..."
        npm install
    fi
    
    # Iniciar nuevo proceso
    node server.js > /tmp/djconnect.log 2>&1 &
    sleep 3
    
    echo "📋 Últimos logs:"
    tail -20 /tmp/djconnect.log
    
else
    echo "⚠️  No se detectó servidor corriendo"
    echo "Iniciando servidor..."
    node server.js > /tmp/djconnect.log 2>&1 &
    sleep 3
    tail -20 /tmp/djconnect.log
fi

echo ""
echo "✅ Actualización completada"
echo ""
echo "🧪 Puedes probar la app en:"
echo "   https://tu-dominio.com"
