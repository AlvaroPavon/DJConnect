# Fixes v2.2.1 - Mejoras de UX y Rate Limiting

## Problemas Resueltos

### 1. ❌ Problema: Login no aparecía en PC

**Causa:**
Cuando usuarios accedían desde PC a la URL raíz, redirigía directamente a `/html/login.html`, pero esto no era intuitivo y podía causar confusión sobre si acceder como DJ o invitado.

**Solución:**
✅ Página de bienvenida inteligente que detecta contexto:
- **Con QR (`?dj=codigo`)**: Va directo a peticiones de esa fiesta
- **Sin código**: Muestra página de bienvenida con opciones:
  - **DJ / Admin**: Redirige a panel de control
  - **Invitado**: Explica que necesita escanear QR

**Flujo correcto:**
```
Invitado escanea QR → URL con ?dj=abc123 → Directo a peticiones
Usuario entra sin código → Página bienvenida → Elige DJ o lee instrucciones
DJ accede → Click en "DJ/Admin" → Panel de login
```

**Archivos modificados:**
- `server.js`: Redirección inteligente detectando parámetro `?dj=`
- `manifest.json`: Actualizado `start_url` a `/welcome.html`
- **NUEVO:** `/public/welcome.html` - Página de bienvenida elegante

### 2. ❌ Problema: Rate Limiting bloqueaba invitados legítimos

**Causa:**
En eventos/fiestas, múltiples invitados comparten la misma IP WiFi del local. El rate limiting de 100 requests por 15 minutos bloqueaba a usuarios legítimos después de pocas peticiones.

**Ejemplo problemático:**
```
Fiesta con 50 invitados en WiFi del local
Todos comparten IP: 192.168.1.1
Cada uno hace 3 peticiones = 150 requests
❌ Bloqueado después de request #100
```

**Solución:**
✅ Rate limiting diferenciado por tipo de usuario:

**Para Invitados (peticiones de canciones):**
```javascript
- 500 requests por 5 minutos
- Aplicado solo a /api/party y /api/wishlist
- No limita archivos estáticos (CSS, JS, imágenes)
```

**Para Admin/DJ:**
```javascript
- 200 requests por 15 minutos
- Aplicado a /api/admin y /api/dj
```

**Para Login (más estricto):**
```javascript
- 10 intentos por 15 minutos
- Previene fuerza bruta pero permite reintentos legítimos
```

**Archivos modificados:**
- `server.js`: Reestructurados los rate limiters con lógica diferenciada

## Mejoras Adicionales

### UX Mejorada

**Página de Bienvenida:**
- ✅ Diseño atractivo con gradiente
- ✅ Dos tarjetas grandes claramente diferenciadas
- ✅ Iconos visuales (🎧 para DJ, 🎵 para invitado)
- ✅ Responsive para móvil y desktop
- ✅ Carga logo personalizado si existe
- ✅ Indica que es una PWA instalable

### Rate Limiting Inteligente

**Antes:**
```
General: 100 req/15min para todos
Login: 5 intentos/15min
```

**Después:**
```
Invitados: 500 req/5min (muy permisivo)
Admin/DJ: 200 req/15min (moderado)
Login: 10 intentos/15min (estricto pero justo)
Upload: 10 archivos/15min (sin cambios)
```

### Casos de Uso Cubiertos

✅ **Evento pequeño (20 personas):**
- 20 personas × 10 peticiones = 200 requests
- ✅ No se bloquea (límite: 500)

✅ **Evento grande (100 personas):**
- 100 personas × 5 peticiones = 500 requests
- ✅ No se bloquea en 5 minutos

✅ **Evento masivo (200+ personas):**
- Si se alcanza límite, solo esperan 5 minutos (no 15)
- Límite se resetea rápidamente

✅ **DJ que se equivoca de contraseña:**
- Tiene 10 intentos (antes 5)
- Menos frustrante para DJs legítimos

## Testing

### Test 1: Página de Bienvenida

```bash
# Abrir en navegador
https://tu-dominio.com

# Debe mostrar:
# - Logo centrado
# - Dos opciones: DJ/Admin e Invitado
# - Diseño responsive
```

### Test 2: Rate Limiting de Invitados

```bash
# Simular 20 peticiones rápidas
for i in {1..20}; do
  curl -X POST https://tu-dominio.com/api/party/peticiones \
    -H "Content-Type: application/json" \
    -d '{"partyCode":"test","song":"Test"}'
done

# ✅ Todas deben pasar (límite: 500)
```

### Test 3: Rate Limiting de Login

```bash
# Intentar login 12 veces
for i in {1..12}; do
  echo "Intento $i:"
  curl -X POST https://tu-dominio.com/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done

# Intentos 1-10: 401 Unauthorized
# Intentos 11-12: 429 Too Many Requests
```

## Deployment

### Opción 1: Con PM2 (Recomendado)

```bash
cd /var/www/DJConnect
git pull  # Si usas git
pm2 restart dj-app
pm2 logs dj-app --lines 20
```

### Opción 2: Proceso Manual

```bash
cd /var/www/DJConnect
pkill -f "node server.js"
node server.js > server.log 2>&1 &
tail -f server.log
```

### Opción 3: Script Automático

```bash
cd /var/www/DJConnect
bash update-server.sh
```

## Verificación Post-Deploy

### 1. Verificar Página de Bienvenida

```bash
curl https://tu-dominio.com
# Debe redirigir a /welcome.html
```

### 2. Verificar Rate Limiters

```bash
# Ver logs del servidor
pm2 logs dj-app

# O si es proceso manual
tail -f /tmp/djconnect.log
```

### 3. Probar desde Navegador

- Abrir `https://tu-dominio.com`
- Verificar que aparece página de bienvenida
- Click en "DJ / Admin" → Debe ir a login
- Click en "Invitado" → Debe ir a peticiones

## Changelog

### v2.2.1 - 2025-11-12

**Añadido:**
- ✅ Página de bienvenida con selección DJ/Invitado
- ✅ Rate limiting diferenciado por tipo de usuario

**Cambiado:**
- 🔄 Rate limiting de invitados: 100→500 requests
- 🔄 Rate limiting general: 100→200 requests
- 🔄 Rate limiting login: 5→10 intentos
- 🔄 Ventana de tiempo invitados: 15min→5min
- 🔄 Start URL de PWA: login.html→welcome.html

**Corregido:**
- 🐛 Invitados bloqueados en eventos grandes (misma IP WiFi)
- 🐛 Falta de claridad sobre acceso DJ vs Invitado en PC

## Notas Importantes

### Para Administradores

- ⚠️ Si tienes eventos con más de 200 personas simultáneas, considera aumentar `guestLimiter.max` a 1000
- ⚠️ El límite de 500 requests se resetea cada 5 minutos, no cada 15

### Para DJs

- ✅ Tienes 10 intentos de login en lugar de 5
- ✅ Los invitados ya no serán bloqueados en eventos grandes
- ✅ La página de bienvenida hace más clara la diferencia entre acceso DJ e invitado

### Para Desarrolladores

- Los rate limiters están organizados por funcionalidad:
  - `guestLimiter`: Invitados (muy permisivo)
  - `generalLimiter`: Admin/DJ (moderado)
  - `loginLimiter`: Login (estricto)
  - `uploadLimiter`: Subida archivos (estricto)

---

*Versión: 2.2.1*  
*Fecha: 12 de Noviembre de 2025*
