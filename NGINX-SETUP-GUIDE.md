# 🔧 Guía de Configuración Nginx para DJConnect

## Objetivo

Configurar nginx en tu VPS para que preserve todos los headers de seguridad y permita que el rate limiting funcione correctamente.

---

## ⚠️ IMPORTANTE: Antes de Empezar

Esta guía asume que:
- ✅ Tienes acceso SSH a tu VPS
- ✅ Tienes permisos de root/sudo
- ✅ Nginx ya está instalado y funcionando
- ✅ DJConnect corre en `localhost:3000`
- ✅ El dominio `tu-dominio.com` apunta a tu VPS

## 🚨 Problema Común: Error 400 al Subir Logo

Si obtienes un error 400 al subir el logo del DJ en el panel de administrador, es probable que NGINX tenga un límite de tamaño muy pequeño para el body de las peticiones.

**Solución:**

1. Edita tu archivo de configuración de NGINX (usualmente en `/etc/nginx/sites-available/djapp` o similar)
2. Agrega o modifica la siguiente línea dentro del bloque `server`:

```nginx
client_max_body_size 10M;
```

3. Guarda el archivo y recarga NGINX:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Nota:** El límite de 10M permite subir imágenes de hasta 10 megabytes. Ajusta este valor según tus necesidades.

---

## 📋 Pasos de Instalación

### Paso 1: Conectar al VPS por SSH

```bash
ssh tu-usuario@tu-servidor
```

### Paso 2: Ver archivos necesarios

Los archivos ya están creados en `/app/`:
- `nginx-dj-app-secure.conf` - Nueva configuración nginx
- `install-nginx-config.sh` - Script de instalación automática

### Paso 3: Ejecutar el Script de Instalación

```bash
cd /app
sudo bash install-nginx-config.sh
```

**El script hará automáticamente:**
1. ✅ Backup de tu configuración actual
2. ✅ Instalar nueva configuración
3. ✅ Verificar sintaxis de nginx
4. ✅ Recargar nginx
5. ✅ Verificar que el servidor Node.js esté corriendo
6. ✅ Probar headers de seguridad

---

## 🔍 Verificación Manual (Opcional)

Si prefieres hacerlo manualmente paso a paso:

### 1. Hacer Backup

```bash
sudo cp /etc/nginx/sites-available/dj-app.conf /etc/nginx/sites-available/dj-app.conf.backup
```

### 2. Copiar Nueva Configuración

```bash
sudo cp /app/nginx-dj-app-secure.conf /etc/nginx/sites-available/dj-app.conf
```

### 3. Verificar Sintaxis

```bash
sudo nginx -t
```

Debes ver:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4. Recargar Nginx

```bash
sudo systemctl reload nginx
```

### 5. Verificar Estado

```bash
sudo systemctl status nginx
```

---

## 🧪 Probar que Funciona

### Verificar Headers de Seguridad

```bash
curl -I https://tu-dominio.com
```

Debes ver estos headers:
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-XSS-Protection: 1; mode=block
Content-Security-Policy: ...
```

### Probar Rate Limiting

Intenta hacer login 6 veces seguidas con datos incorrectos:

```bash
for i in {1..6}; do
  echo "Intento $i:"
  curl -X POST https://tu-dominio.com/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done
```

**Resultado esperado:**
- Intentos 1-5: `401 Unauthorized` (credenciales incorrectas)
- Intento 6: `429 Too Many Requests` (rate limit activado)

### Probar Validación de Subida de Archivos

```bash
# 1. Hacer login como admin
TOKEN=$(curl -X POST https://tu-dominio.com/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# 2. Intentar subir un archivo inválido (texto como imagen)
curl -X POST https://tu-dominio.com/api/admin/config/logo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"logoData":"data:image/png;base64,VGhpcyBpcyBub3QgYW4gaW1hZ2U="}'
```

**Resultado esperado:**
```json
{
  "message": "El archivo no corresponde al tipo de imagen declarado"
}
```

---

## 🔄 Cambios Realizados en la Configuración

### Antes (Configuración Original)

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # Faltaban headers críticos
}
```

### Después (Configuración Segura)

```nginx
location / {
    proxy_pass http://localhost:3000;
    
    # Headers para WebSocket
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    
    # Headers básicos
    proxy_set_header Host $host;
    
    # CRÍTICO: Para rate limiting
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    
    # CRÍTICO: Preservar headers de seguridad
    proxy_pass_header Content-Security-Policy;
    proxy_pass_header X-Frame-Options;
    proxy_pass_header Strict-Transport-Security;
    
    # Optimizaciones
    proxy_buffering off;
    proxy_cache_bypass $http_upgrade;
}
```

### Cambios en Express (server.js)

```javascript
// NUEVO: Confiar en el proxy
app.set('trust proxy', 1);
```

Esto permite que Express lea la IP real desde `X-Forwarded-For`.

---

## 🐛 Resolución de Problemas

### Problema: "nginx: configuration file test failed"

**Solución:**
```bash
# Ver el error específico
sudo nginx -t

# Restaurar backup
sudo cp /etc/nginx/sites-available/dj-app.conf.backup /etc/nginx/sites-available/dj-app.conf
sudo systemctl reload nginx
```

### Problema: "No aparecen los headers de seguridad"

**Causas posibles:**
1. Nginx no se recargó correctamente
2. Hay caché del navegador

**Solución:**
```bash
# Recargar nginx
sudo systemctl reload nginx

# Verificar desde servidor (sin caché)
curl -I https://tu-dominio.com

# Limpiar caché del navegador
Ctrl + Shift + R (hard refresh)
```

### Problema: "Rate limiting no funciona"

**Causa:** Express no confía en el proxy

**Solución:**
```bash
# Verificar que server.js tiene esta línea
grep "trust proxy" /app/server.js

# Si no está, el servidor ya fue actualizado
# Solo necesitas reiniciarlo
cd /app
pkill -f "node server.js"
node server.js > /tmp/server.log 2>&1 &
```

### Problema: "502 Bad Gateway"

**Causa:** Servidor Node.js no está corriendo

**Solución:**
```bash
# Verificar estado
ps aux | grep "node server.js"

# Iniciar servidor
cd /app
node server.js > /tmp/server.log 2>&1 &

# Ver logs
tail -f /tmp/server.log
```

### Problema: "SSL certificate problem"

**Causa:** Certificados Let's Encrypt expirados

**Solución:**
```bash
# Renovar certificados
sudo certbot renew

# Recargar nginx
sudo systemctl reload nginx
```

---

## 📊 Validación Completa

Ejecuta este script para validar toda la configuración:

```bash
#!/bin/bash
echo "🔍 Validando Configuración de Seguridad de DJConnect"
echo "=================================================="

# 1. Nginx corriendo
echo ""
echo "1. Estado de Nginx:"
sudo systemctl is-active nginx && echo "✅ Nginx corriendo" || echo "❌ Nginx no corriendo"

# 2. Servidor Node.js corriendo
echo ""
echo "2. Servidor Node.js:"
pgrep -f "node server.js" > /dev/null && echo "✅ Servidor corriendo" || echo "❌ Servidor no corriendo"

# 3. Headers de seguridad
echo ""
echo "3. Headers de Seguridad:"
curl -sI https://tu-dominio.com | grep -i "x-frame-options" && echo "✅ X-Frame-Options" || echo "❌ X-Frame-Options falta"
curl -sI https://tu-dominio.com | grep -i "strict-transport" && echo "✅ HSTS" || echo "❌ HSTS falta"
curl -sI https://tu-dominio.com | grep -i "x-content-type" && echo "✅ X-Content-Type-Options" || echo "❌ X-Content-Type-Options falta"

# 4. SSL válido
echo ""
echo "4. Certificado SSL:"
curl -sI https://tu-dominio.com > /dev/null 2>&1 && echo "✅ SSL válido" || echo "❌ Problema con SSL"

# 5. Manifest.json accesible
echo ""
echo "5. PWA (manifest.json):"
curl -sI https://tu-dominio.com/manifest.json | grep "200 OK" && echo "✅ Manifest accesible" || echo "❌ Manifest no accesible"

# 6. Service Worker accesible
echo ""
echo "6. Service Worker:"
curl -sI https://tu-dominio.com/sw.js | grep "200 OK" && echo "✅ Service Worker accesible" || echo "❌ Service Worker no accesible"

echo ""
echo "=================================================="
echo "✅ Validación completada"
```

Guarda este script como `validate-security.sh` y ejecútalo:

```bash
chmod +x validate-security.sh
bash validate-security.sh
```

---

## 🎯 Resultado Esperado

Después de aplicar la configuración, debes tener:

✅ **Headers de Seguridad Funcionando:**
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: (configurado)
- X-XSS-Protection: 1; mode=block

✅ **Rate Limiting Funcionando:**
- Login: máximo 5 intentos en 15 minutos
- Register: máximo 3 registros por hora
- Password Reset: máximo 3 intentos por hora
- Upload: máximo 10 subidas en 15 minutos

✅ **Validación de Subida de Archivos:**
- Solo acepta PNG, JPEG, JPG, WebP
- Valida magic numbers (primeros bytes)
- Máximo 3MB por archivo
- Rechaza archivos falsos

✅ **PWA Instalable:**
- Manifest.json accesible
- Service Worker registrado
- Iconos disponibles
- HTTPS funcionando

---

## 🔄 Revertir Cambios

Si necesitas volver a la configuración anterior:

```bash
# 1. Restaurar backup de nginx
sudo cp /etc/nginx/sites-available/dj-app.conf.backup /etc/nginx/sites-available/dj-app.conf

# 2. Verificar sintaxis
sudo nginx -t

# 3. Recargar nginx
sudo systemctl reload nginx

# 4. Revertir cambio en Express (opcional)
# Editar /app/server.js y comentar:
# app.set('trust proxy', 1);
```

---

## 📞 Soporte

Si tienes problemas:

1. **Revisar logs de nginx:**
   ```bash
   sudo tail -f /var/log/nginx/djapp_error.log
   ```

2. **Revisar logs del servidor Node.js:**
   ```bash
   tail -f /tmp/server.log
   ```

3. **Contactar:**
   - GitHub Issues: [Reportar problema](https://github.com/tu-usuario/djconnect/issues)
   - Etiqueta: nginx-config

---

*Guía actualizada: 12 de Noviembre de 2025*  
*Versión: 2.2 (Security + PWA)*
