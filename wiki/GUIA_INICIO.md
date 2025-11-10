# 🎵 Guía de Inicio Rápido - DJConnect

## ✅ Estado del Sistema

- ✅ Servidor corriendo en `http://localhost:3000`
- ✅ MongoDB conectado
- ✅ Usuario de prueba creado
- ⚠️ Spotify API usando datos de ejemplo (funcional para pruebas)

---

## 👤 Credenciales de Prueba

**Usuario:** djtest  
**Email:** dj@test.com  
**Password:** password123

---

## 🚀 Cómo Probar la Aplicación

### Opción 1: Login Normal (Recomendado)

1. **Abre tu navegador** y ve a: `http://localhost:3000`
2. Serás redirigido a la página de login
3. **Inicia sesión** con las credenciales:
   - **Usuario:** `djtest`
   - **Contraseña:** `password123`

### Opción 2: Usar el Token Directamente

Si el login no funciona, puedes establecer el token manualmente:

1. Abre tu navegador en: `http://localhost:3000`
2. Presiona `F12` para abrir DevTools
3. Ve a la pestaña **Console**
4. Pega este comando:
```javascript
localStorage.setItem('dj-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDkzYWNiYWY2MGQwMzNiZWZmNmZjNyIsInVzZXJuYW1lIjoiZGp0ZXN0IiwiaWF0IjoxNzYyMjEyNTU2LCJleHAiOjE3NjIyOTg5NTZ9.FEBGk6GvAhLoh9JFFtgwEZCMsaRFYeVZebFkXBwwdVA');
window.location.href = '/html/dj.html';
```

---

## 🎯 Flujo de Prueba Completo

### 1️⃣ **Panel del DJ**

Después de iniciar sesión, verás:

- ✅ **Panel de estadísticas en vivo**
  - Total de peticiones
  - Género más pedido
  - Badges de géneros

- ✅ **Botones de navegación**
  - "Ver Ranking"
  - "Historial de Fiestas" (NUEVO)

- ✅ **Crear una fiesta**
  - Escribe un nombre (ej: "Fiesta Test")
  - Clic en "Crear Fiesta y Generar QR"

### 2️⃣ **Código QR**

- Se generará un código QR automáticamente
- En la URL verás algo como: `?dj=fiesta-test-abc123`
- **Copia esta URL completa** para usarla como invitado

### 3️⃣ **Simular Invitado (Pedir Canciones)**

Abre una **ventana de incógnito** o **otro navegador** y:

1. Pega la URL del QR (ej: `http://localhost:3000/index.html?dj=fiesta-test-abc123`)
2. Verás la página de "¡Pide tu Canción!"
3. **Busca una canción**:
   - Escribe cualquier palabra (ej: "amor", "rock", "fiesta")
   - Aparecerán **canciones de ejemplo** con géneros
4. **Selecciona una canción**
5. Se te pedirá que **valores al DJ** (1-5 estrellas)

### 4️⃣ **Ver Peticiones en Tiempo Real**

Vuelve a la ventana del DJ:

- ✅ Verás la canción aparecer **instantáneamente**
- ✅ Muestra el **género** con un badge de color
- ✅ Las **estadísticas se actualizan** en tiempo real
- ✅ Puedes **marcar como "Puesta"**
- ✅ Puedes **"Ocultar"** (se mantiene en BD)

### 5️⃣ **Probar Funcionalidades Nuevas**

**Ocultar canciones:**
- Clic en "🗑️ Ocultar" en cualquier canción
- La canción desaparece de la vista
- Sigue en la BD para estadísticas

**Estadísticas en vivo:**
- Agrega varias canciones de diferentes géneros
- Observa cómo cambia el "Género más pedido"
- Mira los badges con contadores

**Finalizar fiesta:**
- Clic en "Finalizar y Crear Nueva Fiesta"
- Confirma la acción
- Se guardan **todas las estadísticas**

### 6️⃣ **Ver Historial de Fiestas** (NUEVO)

1. Clic en "Historial de Fiestas" en el panel DJ
2. Verás todas las fiestas finalizadas con:
   - ✅ Total de canciones
   - ✅ Género más pedido
   - ✅ Valoración media
   - ✅ Fecha de finalización
3. Expande "Ver todas las canciones" para ver detalles

---

## 📱 Probar Diseño Responsive

### En Chrome/Firefox:

1. Presiona `F12` para abrir DevTools
2. Presiona `Ctrl+Shift+M` (o clic en el icono de móvil)
3. Selecciona un dispositivo:
   - iPhone 12/13/14
   - Samsung Galaxy S20
   - O usa dimensiones personalizadas

### Qué Observar:

- ✅ Banners publicitarios se adaptan
- ✅ Botones del tamaño correcto para touch
- ✅ Listas de canciones con diseño flexible
- ✅ QR code responsive
- ✅ Modal de valoración optimizado

---

## 🧪 Crear Más Usuarios (Opcional)

```bash
./register_user.sh "dj2" "dj2@test.com" "password456"
```

O manualmente con curl:

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"dj2","email":"dj2@test.com","password":"password456"}'
```

---

## 🔧 Comandos Útiles

**Ver logs del servidor:**
```bash
tail -f /app/server.log
```

**Reiniciar servidor:**
```bash
pkill -f "node server.js" && cd /app && node server.js > server.log 2>&1 &
```

**Verificar que el servidor está corriendo:**
```bash
curl http://localhost:3000/
```

---

## 📝 Notas Importantes

1. **Spotify API**: Como no tenemos credenciales reales, la búsqueda usa **datos de ejemplo** que funcionan perfectamente para probar todas las funcionalidades

2. **Géneros**: Los géneros de ejemplo son: rock, pop, reggaeton, electronic, hip hop

3. **Token JWT**: Expira en 24 horas. Si el token expira, simplemente vuelve a hacer login

4. **Base de Datos**: MongoDB local guarda todos los datos persistentemente

---

## ✅ Checklist de Pruebas

- [ ] Login funciona
- [ ] Crear fiesta genera QR
- [ ] Búsqueda de canciones funciona
- [ ] Peticiones aparecen en tiempo real
- [ ] Géneros se muestran correctamente
- [ ] Estadísticas se actualizan en vivo
- [ ] Marcar como "Puesta" funciona
- [ ] Ocultar canciones funciona
- [ ] Finalizar fiesta guarda estadísticas
- [ ] Historial muestra fiestas pasadas
- [ ] Diseño responsive en móviles
- [ ] Banners publicitarios visibles

---

## 🆘 Solución de Problemas

**El servidor no responde:**
```bash
pkill -f "node server.js"
cd /app && node server.js > server.log 2>&1 &
```

**No puedo hacer login:**
```bash
./register_user.sh
```

**Las peticiones no aparecen:**
- Verifica que la URL del invitado incluya `?dj=ID_DE_FIESTA`
- Abre DevTools y revisa la consola por errores

---

¡Disfruta probando tu aplicación mejorada! 🎉
