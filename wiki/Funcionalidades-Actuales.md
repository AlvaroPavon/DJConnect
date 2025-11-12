# ✨ Funcionalidades Actuales (v2.2)

Esta sección describe las características principales implementadas en la versión actual de DJConnect.

## 🎉 Novedades v2.2

### 📱 Progressive Web App (PWA)

DJConnect es ahora una **aplicación web progresiva** completamente instalable:

- **Instalación Nativa**: Los usuarios pueden instalar DJConnect directamente desde el navegador sin necesidad de App Store o Google Play.
- **Experiencia de App**: Al instalarse, funciona como una aplicación nativa con su propio ícono en la pantalla de inicio.
- **Sin Barra del Navegador**: Ejecuta en modo standalone para una experiencia inmersiva.
- **Actualizaciones Instantáneas**: Cada vez que se actualiza el código, todos los usuarios obtienen la nueva versión automáticamente.
- **Compatible**: Funciona perfectamente en Android (Chrome) e iOS (Safari).
- **Requiere Internet**: Diseñada para trabajar online con conexión en tiempo real.

### 🔒 Seguridad Empresarial

Implementación completa de medidas de seguridad de nivel producción:

**Headers HTTP Seguros (Helmet.js):**
- Content Security Policy (CSP) para prevenir XSS
- Strict-Transport-Security (HSTS) para forzar HTTPS
- X-Frame-Options para prevenir clickjacking
- X-Content-Type-Options para prevenir MIME sniffing
- X-XSS-Protection adicional

**Rate Limiting (Protección DDoS/Fuerza Bruta):**
- Login: máximo 5 intentos cada 15 minutos
- Registro: máximo 3 intentos por hora
- Reset de contraseña: máximo 3 intentos por hora
- Subida de archivos: máximo 10 por 15 minutos
- Rate limit general: 100 requests por 15 minutos por IP

**Validación y Sanitización:**
- Validación estricta con express-validator
- Sanitización de todos los inputs del usuario
- Validación de emails, usernames y passwords
- Remoción automática de caracteres peligrosos

**Protección NoSQL Injection:**
- Middleware personalizado que bloquea operadores MongoDB maliciosos
- Sanitización recursiva de objetos anidados
- Protección en queries de base de datos

**Validación de Subida de Archivos:**
- Verificación de "magic numbers" (primeros bytes del archivo)
- Solo formatos permitidos: PNG, JPEG, JPG, WebP
- Validación de tamaño máximo: 3MB
- No se confía en la extensión del archivo declarada

**JWT Mejorado:**
- Tokens con expiración de 2 horas (antes 24h)
- Trust proxy configurado para nginx
- Protección en todas las rutas privadas

### 👨‍💼 Panel de Administración

Sistema completo de administración para gestionar toda la plataforma:

- **Dashboard Centralizado**: Vista general con estadísticas del sistema.
- **Gestión de DJs**: Crear, editar, eliminar DJs y cambiar contraseñas.
- **Gestión de Fiestas**: Crear y asignar eventos a DJs específicos.
- **Vista de Wishlists**: Acceso a todas las wishlists del sistema.
- **Estadísticas Globales**: Total de DJs, fiestas activas, wishlists.
- **Exportación de Wishlists**: PDF desde el panel admin.
- **Configuración Global**: Cambiar el logo de la plataforma.

### 🎉 Multi-Fiesta para DJs

Los DJs pueden gestionar múltiples eventos simultáneamente:

- **Hasta 3 Fiestas Activas**: Manejo de múltiples eventos al mismo tiempo.
- **Selector de Fiesta**: Dropdown para cambiar rápidamente entre eventos.
- **Gestión Independiente**: Cada fiesta tiene su propia lista de peticiones.
- **Sin Interferencias**: Las wishlists y peticiones están separadas por evento.

### 📸 Integración Social

- **Perfil de Instagram**: Los DJs pueden agregar su usuario de Instagram.
- **QR Personalizados**: Los códigos QR incluyen el logo de la empresa y el Instagram del DJ.
- **Plantilla Profesional**: Template descargable con toda la información visual.

## 🎵 Wishlists Pre-Evento

La funcionalidad estrella de la v2.1. Permite a los DJs planificar la música *antes* del evento.

- **Creación de Múltiples Wishlists**: El DJ puede tener múltiples wishlists activas para diferentes eventos.
- **Compartir Fácilmente**: Cada wishlist genera una URL única y un código QR para compartir con los invitados.
- **Sugerencias de Invitados**: Los invitados pueden buscar en Spotify o añadir canciones manualmente.
- **Gestión Total**: El DJ puede abrir, cerrar, eliminar canciones individuales o la wishlist completa.
- **Exportación a PDF**: Genera un PDF listo para imprimir y preparar el setlist.

## 🎛️ Panel del DJ en Tiempo Real

El núcleo de la aplicación durante el evento en vivo.

- **Recepción Instantánea**: Las peticiones de los invitados aparecen en tiempo real usando WebSockets (Socket.IO).
- **Gestión de Cola**: El DJ puede marcar canciones como "Puestas" o "Ocultarlas" de la lista.
- **Generación de QR**: Crea un código QR único para cada fiesta en vivo.

## 📊 Analytics y Estadísticas

DJConnect proporciona datos valiosos sobre cada evento.

- **Estadísticas en Vivo**: El panel del DJ muestra el total de peticiones y el género más pedido en tiempo real.
- **Historial de Fiestas**: Al finalizar un evento, se guarda un resumen con el total de canciones, el género más popular y la valoración media.
- **Sistema de Ranking**: Los invitados pueden valorar al DJ (1-5 estrellas), y estos datos alimentan un ranking de DJs.
- **Detección de Géneros**: La app se integra con la API de Spotify para identificar el género de cada canción.

## 🔐 Autenticación Mejorada

- **Sistema de Cuentas Multi-Rol**: Admin y DJ con permisos diferenciados.
- **Protección de Rutas**: Usa `bcryptjs` para hashear contraseñas y `JWT` con expiración de 2 horas.
- **Recuperación de Contraseña**: Sistema seguro con tokens temporales vía SendGrid.
- **Rate Limiting en Login**: Protección contra ataques de fuerza bruta.

## 📱 Diseño Adaptativo (Responsive)

- **Mobile-First**: La interfaz está optimizada para dispositivos móviles, tanto para el DJ como para los invitados.
- **Banners Publicitarios**: Incluye espacios designados para banners de publicidad, diseñados para no ser intrusivos.