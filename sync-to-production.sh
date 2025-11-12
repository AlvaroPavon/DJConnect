#!/bin/bash

# Script de sincronización completa de /app a /var/www/DJConnect
# Actualiza TODOS los archivos y reinicia el servidor

echo "🔄 Sincronizando DJConnect a producción..."
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorios
SOURCE_DIR="/app"
TARGET_DIR="/var/www/DJConnect"

# Verificar que estamos en el servidor correcto
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}❌ Error: $TARGET_DIR no existe${NC}"
    echo "¿Estás en el servidor correcto?"
    exit 1
fi

echo -e "${YELLOW}📂 Copiando archivos...${NC}"
echo ""

# 1. Copiar server.js
echo "1️⃣  Copiando server.js..."
cp -v "$SOURCE_DIR/server.js" "$TARGET_DIR/server.js"
echo -e "${GREEN}✅ server.js actualizado${NC}"
echo ""

# 2. Copiar archivos HTML (con versionado JS)
echo "2️⃣  Copiando archivos HTML..."
cp -v "$SOURCE_DIR/public/html/"*.html "$TARGET_DIR/public/html/"
echo -e "${GREEN}✅ Archivos HTML actualizados${NC}"
echo ""

# 3. Copiar archivos JS
echo "3️⃣  Copiando archivos JavaScript..."
cp -v "$SOURCE_DIR/public/js/"*.js "$TARGET_DIR/public/js/"
echo -e "${GREEN}✅ Archivos JS actualizados${NC}"
echo ""

# 4. Copiar CSS
echo "4️⃣  Copiando archivos CSS..."
cp -v "$SOURCE_DIR/public/css/"*.css "$TARGET_DIR/public/css/"
echo -e "${GREEN}✅ Archivos CSS actualizados${NC}"
echo ""

# 5. Copiar welcome.html
echo "5️⃣  Copiando welcome.html..."
if [ -f "$SOURCE_DIR/public/welcome.html" ]; then
    cp -v "$SOURCE_DIR/public/welcome.html" "$TARGET_DIR/public/welcome.html"
    echo -e "${GREEN}✅ welcome.html copiado${NC}"
else
    echo -e "${YELLOW}⚠️  welcome.html no encontrado en source${NC}"
fi
echo ""

# 6. Copiar manifest.json
echo "6️⃣  Copiando manifest.json..."
if [ -f "$SOURCE_DIR/public/manifest.json" ]; then
    cp -v "$SOURCE_DIR/public/manifest.json" "$TARGET_DIR/public/manifest.json"
    echo -e "${GREEN}✅ manifest.json copiado${NC}"
else
    echo -e "${YELLOW}⚠️  manifest.json no encontrado${NC}"
fi
echo ""

# 7. Copiar service worker
echo "7️⃣  Copiando service worker...${NC}"
if [ -f "$SOURCE_DIR/public/sw.js" ]; then
    cp -v "$SOURCE_DIR/public/sw.js" "$TARGET_DIR/public/sw.js"
    echo -e "${GREEN}✅ sw.js copiado${NC}"
else
    echo -e "${YELLOW}⚠️  sw.js no encontrado${NC}"
fi
echo ""

# 8. Verificar archivos críticos
echo -e "${YELLOW}🔍 Verificando archivos críticos...${NC}"
echo ""

CRITICAL_FILES=(
    "server.js"
    "public/welcome.html"
    "public/html/dj.html"
    "public/html/admin.html"
    "public/html/admin-djs.html"
    "public/js/dj.js"
    "public/js/admin.js"
    "public/js/admin-djs.js"
)

ALL_PRESENT=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$TARGET_DIR/$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file ${RED}(FALTA)${NC}"
        ALL_PRESENT=false
    fi
done
echo ""

if [ "$ALL_PRESENT" = false ]; then
    echo -e "${RED}❌ Algunos archivos críticos faltan. Verifica la copia.${NC}"
    exit 1
fi

# 9. Verificar versionado de JS
echo -e "${YELLOW}🔍 Verificando versionado de archivos JS...${NC}"
if grep -q "?v=2.2.1" "$TARGET_DIR/public/html/dj.html"; then
    echo -e "${GREEN}✅ Archivos JS tienen versionado${NC}"
else
    echo -e "${RED}⚠️  Archivos JS NO tienen versionado${NC}"
    echo "Aplicando versionado..."
    
    cd "$TARGET_DIR/public/html"
    for file in *.html; do
        sed -i 's|src="/js/\([^"?]*\)\.js"|src="/js/\1.js?v=2.2.1"|g' "$file"
    done
    
    echo -e "${GREEN}✅ Versionado aplicado${NC}"
fi
echo ""

# 10. Reiniciar servidor
echo -e "${YELLOW}🔄 Reiniciando servidor...${NC}"
echo ""

if command -v pm2 &> /dev/null; then
    echo "Usando PM2..."
    pm2 restart dj-app
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Servidor reiniciado con PM2${NC}"
        echo ""
        echo "📋 Últimos logs:"
        pm2 logs dj-app --lines 10 --nostream
    else
        echo -e "${RED}❌ Error al reiniciar con PM2${NC}"
        exit 1
    fi
else
    echo "PM2 no encontrado, reiniciando manualmente..."
    pkill -f "node server.js"
    sleep 2
    cd "$TARGET_DIR"
    node server.js > /tmp/djconnect.log 2>&1 &
    sleep 3
    
    if pgrep -f "node server.js" > /dev/null; then
        echo -e "${GREEN}✅ Servidor reiniciado manualmente${NC}"
        echo ""
        echo "📋 Últimos logs:"
        tail -20 /tmp/djconnect.log
    else
        echo -e "${RED}❌ Error al iniciar servidor${NC}"
        echo "Logs de error:"
        cat /tmp/djconnect.log
        exit 1
    fi
fi

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Sincronización completada exitosamente!${NC}"
echo "================================================"
echo ""
echo "✅ Archivos actualizados"
echo "✅ Versionado de JS aplicado"
echo "✅ Servidor reiniciado"
echo ""
echo "🧪 Prueba la aplicación en:"
echo "   https://djapp.duckdns.org"
echo ""
echo "💡 Recuerda hacer hard refresh en el navegador:"
echo "   Chrome/Edge: Ctrl + Shift + R"
echo "   Firefox: Ctrl + F5"
echo ""
