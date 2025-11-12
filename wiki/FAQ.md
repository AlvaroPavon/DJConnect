# ❓ Preguntas Frecuentes (FAQ)

## 📱 General

### ¿Qué es DJConnect?

DJConnect es una plataforma web que permite a los DJs gestionar peticiones musicales en tiempo real durante eventos. Los invitados pueden buscar y solicitar canciones desde sus dispositivos móviles, y el DJ las recibe instantáneamente en su panel de control.

### ¿Es gratuito?

Sí, DJConnect es de código abierto y gratuito para uso personal y comercial. Consulta el archivo LICENSE.md para más detalles.

### ¿Funciona sin internet?

No, DJConnect requiere conexión a internet para:
- Búsqueda de canciones en Spotify
- Comunicación en tiempo real vía WebSockets
- Acceso a la base de datos

**Nota:** Planeamos agregar modo offline en futuras versiones.

---

## 🎧 Para DJs

### ¿Necesito cuenta de Spotify?

No necesariamente. Si no configuras Spotify API, la aplicación usará un catálogo de ejemplo funcional. Sin embargo, para la mejor experiencia con el catálogo completo de Spotify, sí necesitas credenciales de la API (gratuitas).

### ¿Cuántas peticiones puedo recibir?

No hay límite. El bug de 100 peticiones fue solucionado en la v2.0. Ahora puedes recibir cientos o miles de peticiones sin problema.

### ¿Puedo tener múltiples fiestas activas?

✅ **Sí, desde v2.2** puedes gestionar hasta 3 fiestas simultáneas. Usa el selector de fiestas en tu panel para cambiar entre ellas.

### ¿Cómo protejo mi panel de accesos no autorizados?

- ✅ Usa una contraseña fuerte (mínimo 6 caracteres)
- ✅ No compartas tus credenciales
- ✅ Cierra sesión cuando no uses el panel
- ✅ El token JWT expira en 2 horas automáticamente (v2.2)
- ✅ Rate limiting protege contra fuerza bruta (5 intentos/15 min)

### ¿Puedo rechazar peticiones?

Sí, usa el botón "🗑️ Ocultar" en cualquier canción. La petición desaparece de tu vista pero se mantiene en la base de datos para las estadísticas.

---

## 📱 Para Invitados

### ¿Necesito instalar una app?

No, DJConnect funciona completamente en el navegador web. Solo escanea el código QR o accede al link que te comparta el DJ.

### ¿Necesito crear una cuenta?

No, los invitados no necesitan cuenta. Solo acceder al link de la fiesta.

### ¿Puedo pedir múltiples canciones?

Sí, puedes pedir todas las canciones que quieras. El DJ decide cuáles tocar.

### No encuentro mi canción favorita

Posible causas:
1. **Error de ortografía**: Intenta diferentes variantes del nombre
2. **Canción muy nueva**: Puede no estar en Spotify aún
3. **Canción regional**: Algunas canciones no están disponibles en todos los países
4. **Sin Spotify**: Si el DJ no configuró Spotify, verás un catálogo limitado

### ¿El DJ verá mi nombre?

No, las peticiones son anónimas. El DJ solo ve el título y artista de la canción.

---

## 🔧 Técnico

### ¿En qué tecnologías está construido?

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML/CSS/JavaScript Vanilla
- **Database**: MongoDB
- **Real-time**: WebSockets (Socket.IO)

### ¿Puedo self-hostear DJConnect?

Sí, completamente. Sigue la [Guía de Instalación](./Instalacion.md) para configurarlo en tu propio servidor.

### ¿Funciona en dispositivos móviles?

Sí, DJConnect es 100% responsive. Funciona perfectamente en:
- iPhone (iOS 12+)
- Android (Chrome, Firefox)
- iPad / Tablets
- Desktop (todos los navegadores modernos)

### ¿Qué navegadores son compatibles?

**Totalmente compatible:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Funcionalidades limitadas:**
- Internet Explorer (no soportado)

### ¿Puedo usar mi propio dominio?

Sí, configura las variables de entorno `APP_BASE_URL` y `FRONTEND_URL` con tu dominio.

---

## 📊 Estadísticas

### ¿Cómo se detectan los géneros musicales?

Los géneros se obtienen automáticamente de la Spotify Artist API. Cada canción hereda el género principal de su artista.

### ¿Por qué algunas canciones aparecen como "Desconocido"?

Puede ocurrir si:
- No hay credenciales de Spotify configuradas
- El artista no tiene géneros asignados en Spotify
- Error al consultar la API

### ¿Se pierden las estadísticas si cierro el navegador?

No, si finalizas la fiesta correctamente con el botón "Finalizar Fiesta", todas las estadísticas se guardan permanentemente en la base de datos.

**Importante:** Si cierras el navegador sin finalizar, las estadísticas en vivo se pierden.

### ¿Puedo exportar las estadísticas?

Actualmente solo puedes verlas en la web. La exportación a PDF/CSV está planeada para v2.1.

---

## 🔒 Seguridad

### ¿Es segura mi información?

Sí. DJConnect implementa:
- Contraseñas hasheadas con bcrypt
- Autenticación JWT
- HTTPS (en producción)
- Validación de entradas
- Rate limiting (próximamente)

### ¿Dónde se guardan los datos?

En tu propia base de datos MongoDB. Si self-hosteas, tienes control total de tus datos.

### ¿Puedo eliminar mi cuenta?

Sí, contacta al administrador o elimina manualmente tu usuario de la base de datos.

---

## 🐛 Problemas Comunes

### Las peticiones no llegan al panel del DJ

**Soluciones:**
1. Verifica que la fiesta esté activa
2. Recarga la página del DJ
3. Verifica la conexión a internet
4. Revisa la consola del navegador (F12)

### No puedo iniciar sesión

**Soluciones:**
1. Verifica usuario y contraseña
2. Borra caché y cookies
3. Verifica que el servidor esté corriendo
4. Revisa `JWT_SECRET` en `.env`

### El código QR no se genera

**Soluciones:**
1. Verifica que `qrcode.min.js` esté cargado
2. Recarga la página
3. Revisa errores en la consola (F12)

### MongoDB no se conecta

**Soluciones:**
1. Verifica que MongoDB esté corriendo: `sudo systemctl status mongod`
2. Verifica `MONGO_URI` en `.env`
3. Revisa permisos de MongoDB
4. Consulta logs: `/var/log/mongodb/mongod.log`

---

## 💰 Costos

### ¿Cuánto cuesta usar DJConnect?

La aplicación es gratuita. Los únicos costos opcionales son:

**Spotify API:** Gratuita (con límites generosos)

**SendGrid:** 
- Gratuito hasta 100 emails/día
- Planes pagos desde $15/mes

**Hosting (si self-hosteas):**
- VPS: $5-20/mes
- Cloud (AWS/GCP): Variable
- MongoDB Atlas: Gratuito tier M0

**Total estimado para uso pequeño:** $0-10/mes

---

## 📱 Progressive Web App (PWA)

### ¿Qué es una PWA?

Una PWA (Progressive Web App) es una aplicación web que puede instalarse en tu dispositivo como si fuera una app nativa, pero sin necesidad de tiendas de aplicaciones (App Store/Google Play).

### ¿Cómo instalo DJConnect como app?

**Android (Chrome):**
1. Abre DJConnect en Chrome
2. Menú (⋮) → "Instalar app"
3. Confirma y listo

**iOS (Safari):**
1. Abre DJConnect en Safari (solo Safari funciona)
2. Botón compartir 📤 → "Añadir a pantalla de inicio"
3. Toca "Añadir"

**Escritorio:**
1. Chrome/Edge → Ícono de instalación en barra de direcciones
2. Click "Instalar"

### ¿Funciona sin conexión la PWA?

No. DJConnect PWA requiere internet porque:
- Socket.IO necesita conexión en tiempo real
- Spotify API requiere internet
- MongoDB está en la nube

Si pierdes conexión, verás un mensaje claro indicándolo.

### ¿Cuál es la diferencia entre la web y la PWA?

La funcionalidad es idéntica, pero la PWA ofrece:
- ✅ Ícono en pantalla de inicio
- ✅ Abre en ventana propia (sin barra del navegador)
- ✅ Experiencia más rápida
- ✅ Actualizaciones automáticas

### ¿Cuesta algo instalar la PWA?

No, es completamente gratis. No hay costos de App Store ($99/año) ni Google Play ($25 único).

### ¿Puedo desinstalar la PWA?

Sí, como cualquier app:
- **Android:** Mantén presionado el ícono → Desinstalar
- **iOS:** Mantén presionado → Eliminar app
- **Escritorio:** Click derecho → Desinstalar

### ¿La PWA recibe actualizaciones?

Sí, automáticamente. Cuando el desarrollador actualiza el código, tu PWA se actualiza sola en la próxima apertura. No necesitas reinstalar.

### ¿Por qué no aparece en App Store/Google Play?

Porque es una PWA, no una app nativa. Las ventajas:
- ✅ No paga comisiones a Apple/Google
- ✅ Actualizaciones instantáneas (sin aprobación)
- ✅ Instalación directa desde web
- ✅ Funciona en todos los dispositivos

Si necesitas una app nativa está en el roadmap v4.0.

---

## 🔒 Seguridad

### ¿Es seguro usar DJConnect?

Sí. Desde v2.2 implementa seguridad de nivel empresarial:
- ✅ HTTPS obligatorio con certificado SSL
- ✅ Headers HTTP seguros (CSP, HSTS, X-Frame-Options)
- ✅ Rate limiting contra fuerza bruta
- ✅ Validación estricta de todos los inputs
- ✅ Protección contra NoSQL injection
- ✅ JWT con tokens de 2 horas
- ✅ Passwords hasheados con bcrypt

Consulta [Seguridad](./Seguridad) para detalles completos.

### ¿Qué pasa si alguien intenta hackear mi cuenta?

El sistema te protege automáticamente:
- Después de 5 intentos fallidos de login, tu IP queda bloqueada 15 minutos
- Los passwords están hasheados (no se pueden "descifrar")
- Los tokens expiran en 2 horas
- Todas las peticiones se validan y sanitizan

### ¿Puedo subir archivos maliciosos?

No. El sistema valida:
1. Tipo de archivo (solo imágenes)
2. Magic numbers (primeros bytes del archivo)
3. Tamaño (máximo 3MB)
4. Rate limiting (10 subidas/15min)

Cualquier archivo sospechoso es rechazado automáticamente.

### ¿Mis datos están seguros?

Sí:
- Passwords hasheados con bcrypt (no texto plano)
- Comunicación HTTPS encriptada
- Base de datos con queries sanitizadas
- Variables sensibles en .env (no en código)

---

## 🚀 Deployment

### ¿Dónde puedo desplegar DJConnect?

DJConnect funciona en cualquier plataforma que soporte Node.js:

- ✅ **Heroku** (con MongoDB Atlas)
- ✅ **DigitalOcean App Platform**
- ✅ **AWS EC2** / Elastic Beanstalk
- ✅ **Google Cloud Run**
- ✅ **Azure App Service**
- ✅ **Vercel** (solo frontend)
- ✅ **Railway**
- ✅ **Render**

Consulta la [Guía de Deployment](./Deployment.md) para instrucciones específicas.

### ¿Necesito certificado SSL?

✅ **Sí, obligatorio desde v2.2.** Es esencial para:
- Seguridad de contraseñas y datos
- WebSockets en HTTPS
- **PWA (no funciona sin HTTPS)**
- Headers de seguridad (HSTS)

Puedes obtener certificados gratuitos con [Let's Encrypt](https://letsencrypt.org/).

---

## 🤝 Contribución

### ¿Puedo contribuir al proyecto?

¡Absolutamente! Lee la [Guía de Contribución](./Contribuir.md) para empezar.

### Encontré un bug, ¿qué hago?

1. Verifica que no esté ya reportado en [Issues](https://github.com/tu-usuario/djconnect/issues)
2. Crea un nuevo Issue con detalles
3. Incluye pasos para reproducirlo
4. Adjunta screenshots si es relevante

### Tengo una idea de feature

¡Genial! Abre una [Discussion](https://github.com/tu-usuario/djconnect/discussions) para conversarlo con la comunidad.

---

## 📞 Soporte

### ¿Cómo obtengo ayuda?

1. **Revisa esta FAQ**
2. **Lee la [Wiki](./Home.md)**
3. **Busca en [Issues cerrados](https://github.com/tu-usuario/djconnect/issues?q=is%3Aissue+is%3Aclosed)**
4. **Pregunta en [Discussions](https://github.com/tu-usuario/djconnect/discussions)**
5. **Crea un nuevo [Issue](https://github.com/tu-usuario/djconnect/issues/new)**

### ¿Ofrecen soporte comercial?

DJConnect es un proyecto open-source comunitario. Para soporte empresarial dedicado, contacta via email.

---

## 📝 Licencia

### ¿Puedo usar DJConnect comercialmente?

Consulta el archivo LICENSE.md para los términos específicos. Generalmente, sí puedes usarlo comercialmente con atribución apropiada.

### ¿Puedo modificar el código?

Sí, puedes modificar el código según los términos de la licencia. Apreciamos que compartas tus mejoras con la comunidad.

---

**¿No encontraste tu respuesta?**

- 💬 [Abre una Discussion](https://github.com/tu-usuario/djconnect/discussions)
- 🐛 [Reporta un Issue](https://github.com/tu-usuario/djconnect/issues)
- 📧 Email: soporte@djconnect.app
