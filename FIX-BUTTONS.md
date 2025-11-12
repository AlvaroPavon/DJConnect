# Fix: Botones No Funcionan

## Problemas Reportados
1. ❌ Botón "Cerrar Sesión" no funciona
2. ❌ Botón "Eliminar DJ" no funciona en panel admin

## Causa Probable

**Caché del navegador** - Los archivos JavaScript antiguos están cacheados y no se actualizan.

## Solución Rápida

### Paso 1: Limpiar Caché del Navegador

**Opción A: Hard Refresh (Más Rápido)**
```
Chrome/Edge: Ctrl + Shift + R (Windows) o Cmd + Shift + R (Mac)
Firefox: Ctrl + F5
Safari: Cmd + Option + R
```

**Opción B: Modo Incógnito**
1. Abre ventana de incógnito
2. Accede a `https://djapp.duckdns.org`
3. Prueba los botones

**Opción C: Limpiar Caché Manualmente**
1. Chrome: Settings → Privacy → Clear browsing data
2. Marca "Cached images and files"
3. Click "Clear data"

### Paso 2: Verificar en VPS

Asegúrate que los archivos JS están actualizados:

```bash
cd /var/www/DJConnect

# Verificar que el JS tiene el código de logout
grep -A 5 "logout-btn" public/js/dj.js

# Debe mostrar:
# const logoutBtn = document.getElementById('logout-btn');
# if (logoutBtn) {
#     logoutBtn.addEventListener('click', () => {
#         if (confirm('¿Estás seguro...')) {
#             localStorage.removeItem('dj-token');

# Verificar función deleteDJ
grep "async function deleteDJ" public/js/admin-djs.js

# Debe existir la función
```

### Paso 3: Verificar Errores en Consola

1. Abre DevTools: F12
2. Ve a pestaña "Console"
3. Intenta usar el botón
4. Copia cualquier error que aparezca

## Verificación de Funcionamiento

### Test 1: Botón Cerrar Sesión

1. Login como DJ
2. Ve al panel de DJ
3. Click en "Cerrar Sesión" (suele estar abajo)
4. Debe aparecer confirmación
5. Acepta
6. ✅ Debe llevarte a `/html/login.html`

### Test 2: Botón Eliminar DJ

1. Login como Admin (username: admin)
2. Ve a "Gestión de DJs"
3. Click en "Eliminar" en cualquier DJ
4. Debe aparecer confirmación
5. Acepta
6. ✅ DJ debe desaparecer de la lista

## Si Sigue Sin Funcionar

### Debug en Consola del Navegador

Abre la consola (F12) y ejecuta:

```javascript
// Test 1: Verificar que el botón existe
document.getElementById('logout-btn')
// Debe devolver: <button id="logout-btn"...>

// Test 2: Verificar que la función existe
typeof deleteDJ
// Debe devolver: "function"

// Test 3: Verificar token
localStorage.getItem('dj-token')
// Debe devolver un JWT largo
```

### Verificar Network en DevTools

1. F12 → Network tab
2. Intenta eliminar un DJ
3. Busca la petición DELETE a `/api/admin/djs/...`
4. Verifica:
   - Status code: ¿200? ¿401? ¿404?
   - Response: ¿Qué mensaje devuelve?

### Posibles Errores y Soluciones

**Error: "token is not defined"**
```bash
Solución: El usuario no está logueado correctamente
- Cierra sesión
- Vuelve a hacer login
- Intenta de nuevo
```

**Error: "401 Unauthorized"**
```bash
Solución: Token expirado (2 horas)
- El token expiró
- Cierra sesión y vuelve a entrar
```

**Error: "Cannot read property 'addEventListener' of null"**
```bash
Solución: El botón no existe en el DOM
- Hard refresh (Ctrl + Shift + R)
- Verifica que el HTML tiene el botón
```

**Error: "deleteDJ is not defined"**
```bash
Solución: El JS no se cargó
- Hard refresh (Ctrl + Shift + R)
- Verifica en Sources tab que admin-djs.js se cargó
```

## Solución Definitiva: Bustear Caché

Si el problema persiste, añade versión a los archivos JS:

### En el VPS

```bash
cd /var/www/DJConnect

# Editar dj.html
nano public/html/dj.html

# Cambiar línea 19 de:
# <script src="/js/dj.js" defer></script>
# A:
# <script src="/js/dj.js?v=2.2.1" defer></script>

# Editar admin-djs.html
nano public/html/admin-djs.html

# Cambiar:
# <script src="/js/admin-djs.js" defer></script>
# A:
# <script src="/js/admin-djs.js?v=2.2.1" defer></script>

# Reiniciar
pm2 restart dj-app
```

Esto fuerza al navegador a descargar la nueva versión.

## Testing Final

Después de aplicar las soluciones:

**Test Completo:**
```
1. ✅ Abre modo incógnito
2. ✅ Login como DJ
3. ✅ Panel de DJ → Click "Cerrar Sesión"
4. ✅ Debe funcionar
5. ✅ Login como Admin
6. ✅ Gestión DJs → Eliminar un DJ
7. ✅ Debe funcionar
```

## Notas

- **Caché es la causa #1** de "botones no funcionan después de actualizar"
- **Token expira en 2 horas** - Si un DJ lleva >2h logueado, debe volver a entrar
- **Modo incógnito** es tu mejor amigo para testear

---

*Si después de todo esto sigue sin funcionar, reporta los errores de la consola del navegador.*
