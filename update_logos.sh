#!/bin/bash
# Script para actualizar todos los logos

cd /app/public/html

# Buscar y reemplazar en todos los archivos HTML
for file in *.html; do
  if [ -f "$file" ]; then
    # Reemplazar el div del logo con versión simplificada
    sed -i 's|<div id="company-logo-container" style="text-align: center; margin-bottom: 20px;">|<div id="company-logo-container">|g' "$file"
    sed -i 's|<img id="company-logo" src="" alt="" style="max-width: 200px; max-height: 80px; display: none;">|<img id="company-logo" src="" alt="Logo" style="display: none;">|g' "$file"
  fi
done

echo "✅ Logos actualizados en todos los archivos HTML"
