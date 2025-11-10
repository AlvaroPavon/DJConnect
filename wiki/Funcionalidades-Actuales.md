# ✨ Funcionalidades Actuales (v2.1)

Esta sección describe las características principales implementadas en la versión actual de DJConnect.

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

## 🔐 Autenticación y Seguridad

- **Sistema de Cuentas para DJs**: Registro, inicio de sesión y recuperación de contraseña (vía SendGrid).
- **Protección de Rutas**: Se utiliza `bcryptjs` para hashear contraseñas y `JWT` (JSON Web Tokens) para asegurar las rutas del panel del DJ.

## 📱 Diseño Adaptativo (Responsive)

- **Mobile-First**: La interfaz está optimizada para dispositivos móviles, tanto para el DJ como para los invitados.
- **Banners Publicitarios**: Incluye espacios designados para banners de publicidad, diseñados para no ser intrusivos.