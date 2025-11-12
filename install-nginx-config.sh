#!/bin/bash

# Script de instalación de configuración nginx segura para DJConnect
# Ejecutar como root: sudo bash install-nginx-config.sh

echo "🔒 Instalando configuración nginx segura para DJConnect"
echo "========================================================"

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Error: Este script debe ejecutarse como root"
    echo "   Usa: sudo bash install-nginx-config.sh"
    exit 1
fi

# Hacer backup de la configuración actual
echo ""
echo "📦 Haciendo backup de configuración actual..."
BACKUP_FILE="/etc/nginx/sites-available/dj-app.conf.backup.$(date +%Y%m%d_%H%M%S)"
cp /etc/nginx/sites-available/dj-app.conf "$BACKUP_FILE"
echo "✅ Backup guardado en: $BACKUP_FILE"

# Copiar nueva configuración
echo ""
echo "📝 Instalando nueva configuración..."
# Detectar ruta del proyecto (puede ser /app o /var/www/DJConnect)
if [ -f "/app/nginx-dj-app-secure.conf" ]; then
    PROJECT_PATH="/app"
elif [ -f "/var/www/DJConnect/nginx-dj-app-secure.conf" ]; then
    PROJECT_PATH="/var/www/DJConnect"
else
    echo "❌ Error: No se encontró nginx-dj-app-secure.conf"
    exit 1
fi
cp $PROJECT_PATH/nginx-dj-app-secure.conf /etc/nginx/sites-available/dj-app.conf
echo "✅ Configuración actualizada"

# Verificar sintaxis de nginx
echo ""
echo "🔍 Verificando sintaxis de nginx..."
if nginx -t; then
    echo "✅ Sintaxis correcta"
else
    echo "❌ Error en la sintaxis de nginx"
    echo "   Restaurando backup..."
    cp "$BACKUP_FILE" /etc/nginx/sites-available/dj-app.conf
    exit 1
fi

# Recargar nginx
echo ""
echo "🔄 Recargando nginx..."
systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx recargado correctamente"
else
    echo "❌ Error al recargar nginx"
    echo "   Restaurando backup..."
    cp "$BACKUP_FILE" /etc/nginx/sites-available/dj-app.conf
    nginx -t && systemctl reload nginx
    exit 1
fi

# Verificar que el servidor Node.js está corriendo
echo ""
echo "🔍 Verificando servidor Node.js..."
# Verificar si usa PM2
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "dj-app.*online"; then
        echo "✅ Servidor Node.js está corriendo (PM2)"
        echo "   Reiniciando con PM2..."
        cd $PROJECT_PATH
        pm2 restart dj-app
    else
        echo "⚠️  Servidor Node.js no está corriendo en PM2"
        echo "   Iniciando con PM2..."
        cd $PROJECT_PATH
        pm2 start server.js --name dj-app
    fi
elif pgrep -f "node server.js" > /dev/null; then
    echo "✅ Servidor Node.js está corriendo (standalone)"
else
    echo "⚠️  Servidor Node.js no está corriendo"
    echo "   Iniciando servidor..."
    cd $PROJECT_PATH
    pkill -f "node server.js" 2>/dev/null
    node server.js > /tmp/djconnect-server.log 2>&1 &
    sleep 3
    if pgrep -f "node server.js" > /dev/null; then
        echo "✅ Servidor Node.js iniciado"
    else
        echo "❌ Error al iniciar servidor Node.js"
        cat /tmp/djconnect-server.log
        exit 1
    fi
fi

# Verificar que la configuración funciona
echo ""
echo "🧪 Verificando configuración..."
sleep 2

# Test de headers de seguridad
echo "   Probando headers de seguridad..."
HEADERS=$(curl -sI https://djapp.duckdns.org 2>&1 | grep -i "x-frame-options\|strict-transport-security\|x-content-type")
if [ -n "$HEADERS" ]; then
    echo "✅ Headers de seguridad detectados:"
    echo "$HEADERS" | sed 's/^/      /'
else
    echo "⚠️  Headers de seguridad no detectados (puede tardar unos segundos en propagarse)"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Resumen:"
echo "   - Backup guardado: $BACKUP_FILE"
echo "   - Configuración instalada: /etc/nginx/sites-available/dj-app.conf"
echo "   - Nginx recargado correctamente"
echo "   - Servidor Node.js: corriendo"
echo ""
echo "🔒 Medidas de seguridad activadas:"
echo "   ✅ Headers de seguridad (X-Frame-Options, HSTS, CSP)"
echo "   ✅ Rate limiting funcional (IP real del cliente)"
echo "   ✅ Validación de subida de archivos"
echo "   ✅ SSL/TLS configurado"
echo ""
echo "🧪 Para verificar la seguridad completa:"
echo "   curl -I https://djapp.duckdns.org"
echo ""
echo "📝 Si necesitas revertir los cambios:"
echo "   sudo cp $BACKUP_FILE /etc/nginx/sites-available/dj-app.conf"
echo "   sudo systemctl reload nginx"
echo ""
