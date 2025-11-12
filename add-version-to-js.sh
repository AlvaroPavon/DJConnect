#!/bin/bash

# Script para añadir versionado a todos los archivos JS
# Esto fuerza al navegador a recargar los JS después de actualizar

VERSION="2.2.1"

echo "🔄 Añadiendo versión $VERSION a archivos JS..."

cd /app/public/html

# Buscar todos los archivos HTML
for file in *.html; do
    if [ -f "$file" ]; then
        echo "📝 Procesando: $file"
        
        # Añadir versión a todos los src="/js/..." que no la tengan
        sed -i "s|src=\"/js/\([^\"]*\)\.js\"|src=\"/js/\1.js?v=$VERSION\"|g" "$file"
        
        echo "✅ $file actualizado"
    fi
done

echo ""
echo "🎉 Completado! Todos los archivos JS ahora tienen versión $VERSION"
echo ""
echo "📋 Para aplicar en producción:"
echo "1. cd /var/www/DJConnect"
echo "2. bash add-version-to-js.sh"
echo "3. pm2 restart dj-app"
