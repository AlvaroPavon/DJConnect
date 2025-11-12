#!/bin/bash

echo "🔧 Aplicando FIX FINAL para DJConnect"
echo "======================================"
echo ""
echo "Este script arregla:"
echo "- CSP bloqueando scripts de CDN"
echo "- CSP bloqueando Google Fonts"
echo "- Botones con onclick que no funcionan"
echo ""

# Detectar directorio
if [ -d "/var/www/DJConnect" ]; then
    TARGET="/var/www/DJConnect"
elif [ -d "/app" ]; then
    TARGET="/app"
else
    echo "❌ Error: No se encontró el directorio del proyecto"
    exit 1
fi

echo "📂 Directorio detectado: $TARGET"
echo ""

# 1. Copiar server.js con CSP corregido
echo "1️⃣  Copiando server.js con CSP relajado..."
cp /app/server.js $TARGET/server.js
echo "✅ server.js actualizado"
echo ""

# 2. Copiar Service Worker corregido
echo "2️⃣  Copiando Service Worker (sw.js)..."
cp /app/public/sw.js $TARGET/public/sw.js
echo "✅ sw.js actualizado"
echo ""

# 3. Verificar cambios
echo "3️⃣  Verificando cambios..."
if grep -q "scriptSrcAttr" $TARGET/server.js; then
    echo "✅ CSP tiene scriptSrcAttr (permite onclick)"
else
    echo "❌ FALTA scriptSrcAttr en CSP"
    exit 1
fi

if grep -q "cdn.jsdelivr.net" $TARGET/server.js; then
    echo "✅ CSP permite CDN (jsdelivr, socket.io)"
else
    echo "❌ FALTA cdn.jsdelivr.net en CSP"
    exit 1
fi

if grep -q "fonts.googleapis.com" $TARGET/public/sw.js; then
    echo "✅ Service Worker ignora Google Fonts"
else
    echo "❌ FALTA ignore de Google Fonts en SW"
    exit 1
fi
echo ""

# 4. Reiniciar servidor
echo "4️⃣  Reiniciando servidor..."
if command -v pm2 &> /dev/null; then
    pm2 restart dj-app
    if [ $? -eq 0 ]; then
        echo "✅ PM2 reiniciado"
        echo ""
        echo "📋 Últimos logs:"
        pm2 logs dj-app --lines 15 --nostream
    else
        echo "❌ Error al reiniciar PM2"
        exit 1
    fi
else
    pkill -f "node server.js"
    sleep 2
    cd $TARGET
    node server.js > /tmp/djconnect-final.log 2>&1 &
    sleep 3
    if pgrep -f "node server.js" > /dev/null; then
        echo "✅ Servidor reiniciado"
        tail -15 /tmp/djconnect-final.log
    else
        echo "❌ Error al iniciar servidor"
        cat /tmp/djconnect-final.log
        exit 1
    fi
fi

echo ""
echo "======================================"
echo "✅ FIX APLICADO CORRECTAMENTE"
echo "======================================"
echo ""
echo "🧹 AHORA EN TU NAVEGADOR:"
echo "1. Presiona Ctrl + Shift + Delete"
echo "2. Selecciona 'Cached images and files'"
echo "3. Time range: 'All time'"
echo "4. Click 'Clear data'"
echo "5. CIERRA el navegador COMPLETAMENTE"
echo "6. Abre de nuevo"
echo "7. Ve a https://djapp.duckdns.org"
echo ""
echo "✅ Los botones deberían funcionar ahora"
echo ""
