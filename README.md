<p align="center">
  <img src="./public/images/logo.png" width="120" alt="DJConnect Logo" />
</p>

<div align="center">
  <h1>🎵 DJConnect</h1>
  <p><strong>Plataforma web en tiempo real para la gestión interactiva de peticiones musicales en eventos en vivo</strong></p>
  <p>Optimizando la conexión entre el DJ y su audiencia</p>
</div>

<p align="center">
  <img src="assets/visualizer_banner.gif" alt="Music Visualizer Banner" width="700px"/>
</p>

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js"/>
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
</div>

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## 📋 Tabla de Contenidos

1. [**Acerca del Proyecto**](#-acerca-del-proyecto)
2. [**Funcionalidades Clave**](#-funcionalidades-clave)
3. [**Novedades v2.1**](#-novedades-v21)
4. [**Stack Tecnológico**](#️-stack-tecnológico)
5. [**Documentación (Wiki)**](#-documentación-wiki)
6. [**Hoja de Ruta**](#-hoja-de-ruta)
7. [**Estructura del Directorio**](#-estructura-del-directorio)
8. [**Contribuir**](#-contribuir)
9. [**Licencia**](#-licencia)

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## 🚀 Acerca del Proyecto

**DJConnect** es una solución de software diseñada para digitalizar y simplificar la interacción entre los DJs y los asistentes a un evento. La aplicación elimina las barreras de la comunicación tradicional (peticiones verbales o en papel) al proporcionar una plataforma centralizada y en tiempo real.

### 🎯 Características Destacadas

- 🎵 **Peticiones en Tiempo Real**: Los invitados piden canciones desde sus móviles
- 📊 **Analytics Avanzados**: Estadísticas de géneros musicales y valoraciones
- 📱 **100% Responsive**: Optimizado para cualquier dispositivo móvil
- 🎨 **Interfaz Moderna**: Dark mode con animaciones fluidas
- 🔒 **Seguro**: Autenticación JWT y gestión de sesiones
- ⚡ **Rápido**: WebSockets para comunicación instantánea

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## ✨ Funcionalidades Clave

| Módulo | Funcionalidad | Descripción |
| :--- | :--- | :--- |
| **🔐 Autenticación** | Gestión de Usuarios (DJ) | Registro, login y recuperación de contraseñas con `bcryptjs` y `JWT` |
| **🎉 Gestión de Eventos** | Salas de Fiesta Dinámicas | Creación de eventos únicos con códigos QR para acceso instantáneo |
| **🎛️ Panel del DJ** | Dashboard en Tiempo Real | Visualización de peticiones, estadísticas y gestión de cola |
| **📱 Interacción** | Sistema de Peticiones | Búsqueda en Spotify y envío de solicitudes vía Socket.IO |
| **⭐ Valoraciones** | Ranking y Feedback | Sistema de puntuación y ranking de DJs |
| **📊 Analytics** | Estadísticas Avanzadas | Géneros más pedidos, historial de fiestas y métricas |

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## 🆕 Novedades v2.1

### Mejoras Implementadas

#### 📝 **Wishlists Pre-Evento** (NUEVO!)
- **Planificación Anticipada**: Crea wishlists antes de tus eventos
- **Recopilación de Favoritas**: Los invitados sugieren canciones antes del evento
- **Gestión Completa**: 
  - Crea múltiples wishlists para diferentes eventos
  - Comparte via URL o código QR
  - Cierra/abre wishlists según necesites
  - Elimina canciones individuales
- **Exportación a PDF**: Descarga la lista completa para preparar tu set
- **Separación Total**: Las wishlists NO interfieren con peticiones en vivo
- **Estadísticas**: Ve cuántas canciones, géneros y quién las sugirió

**Casos de uso:**
- Bodas: Recopila canciones especiales de los novios e invitados
- Cumpleaños: Lista de favoritos del cumpleañero
- Eventos corporativos: Preferencias musicales del equipo
- Fiestas temáticas: Asegura tener el repertorio adecuado

#### 📱 **Diseño Responsive Mejorado**
- Media queries completas para smartphones y tablets
- Optimización táctil para interfaces móviles
- QR codes responsivos que se adaptan a cualquier pantalla

#### 📊 **Sistema de Estadísticas Avanzado**
- **Géneros Musicales**: Integración con Spotify API para detectar géneros automáticamente
- **Analytics en Tiempo Real**: Panel con género más pedido y contadores
- **Historial Completo**: Nueva sección con estadísticas de fiestas pasadas
  - Total de canciones pedidas
  - Género más popular
  - Valoración media del evento
  - Lista completa de todas las canciones

#### 🎵 **Gestión Mejorada de Peticiones**
- **Ocultar canciones**: Elimina de la vista sin borrar de la base de datos
- **Sin límites**: Solucionado bug de carga máxima de 100 peticiones
- **Mejor scroll**: Lista optimizada para cientos de peticiones

#### 📢 **Espacios Publicitarios**
- Banners no invasivos superiores e inferiores
- Listos para AdSense u otras plataformas
- Diseño responsive que no afecta la funcionalidad

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Backend** | **Node.js / Express** | API REST y lógica del servidor |
| **Base de Datos** | **MongoDB (Mongoose)** | Almacenamiento NoSQL persistente |
| **Tiempo Real** | **Socket.IO** | Comunicación bidireccional de baja latencia |
| **Frontend** | **HTML5, CSS3, Vanilla JS** | Interfaz sin dependencias de frameworks |
| **APIs Externas** | **Spotify API** | Catálogo de búsqueda de música |
| **Email** | **SendGrid** | Recuperación de contraseñas |

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## 📚 Documentación (Wiki)

Toda la documentación detallada sobre la **arquitectura, funcionalidades y planes futuros** del proyecto se encuentra en la **[Wiki oficial del repositorio](https://github.com/tu-usuario/djconnect/wiki)**.

Con el objetivo de proteger la propiedad intelectual del proyecto, **no se proporcionan guías de instalación o uso directo**. La Wiki sirve como un escaparate de la arquitectura del software para fines de portafolio y evaluación.

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## 🗺️ Hoja de Ruta

### ✅ v2.1 - Completado (Actual)
- [x] **Wishlists Pre-Evento** - Sistema completo de listas de deseos
- [ ] Temas Personalizables - Dark/Light mode
- [ ] Exportación avanzada - CSV para Excel
- [ ] Notificaciones Push - Alertas en tiempo real
- [ ] Multi-idioma - Inglés, Portugués, Francés

### 🚧 v2.2 - En Desarrollo (Q2 2025)
- [ ] **Playlists Personalizadas**: Crear playlists basadas en peticiones
- [ ] **Temas Personalizables**: Dark/Light mode y colores customizables
- [ ] **Exportación de Datos**: PDF y CSV con estadísticas detalladas
- [ ] **Notificaciones Push**: Alertas para el DJ en nuevas peticiones
- [ ] **Multi-idioma**: Soporte para inglés, portugués y francés

### 🔮 v3.0 - Planificado (Q3 2025)
- [ ] **Integración con Apple Music**: Alternativa a Spotify
- [ ] **Sistema de Votación**: Los invitados votan las canciones más deseadas
- [ ] **Chat en Vivo**: Comunicación directa DJ-invitados
- [ ] **Predicción de Hits**: IA para sugerir canciones basadas en el ambiente
- [ ] **Modo Karaoke**: Gestión de turnos para karaoke

### 🌟 v4.0 - Visión Futura (2026)
- [ ] **App Móvil Nativa**: iOS y Android con React Native
- [ ] **Integración con Hardware DJ**: Pioneer, Traktor, Serato
- [ ] **Monetización para DJs**: Sistema de propinas digitales
- [ ] **Analytics Predictivos**: ML para recomendar setlists
- [ ] **Marketplace**: Plantillas y temas de la comunidad

### 💡 Ideas en Consideración
- Integración con sistemas de iluminación (Philips Hue)
- Modo "DJ Battle" para competencias
- Sistema de fidelización para invitados frecuentes
- API pública para integraciones de terceros
- Modo offline con sincronización posterior

> **¿Tienes ideas?** ¡Abre un [Issue](https://github.com/tu-usuario/djconnect/issues) o [Discussion](https://github.com/tu-usuario/djconnect/discussions)!

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## 📁 Estructura del Directorio

```sh
/
├── assets/                    # Recursos para el README
│   ├── logo.png
│   ├── visualizer_banner.gif
│   └── wave_divider.gif
├── public/                    # Frontend estático
│   ├── css/
│   │   └── style.css         # Estilos responsive
│   ├── html/
│   │   ├── dj.html           # Panel del DJ
│   │   ├── history.html      # Historial de fiestas
│   │   ├── login.html
│   │   ├── register.html
│   │   └── ...
│   ├── js/
│   │   ├── config.js         # Configuración centralizada
│   │   ├── dj.js             # Lógica del panel DJ
│   │   ├── history.js        # Lógica del historial
│   │   └── ...
│   ├── images/
│   └── index.html            # Página de peticiones
├── djModel.js                 # Modelo de datos DJ (Mongoose)
├── partyModel.js              # Modelo de datos Party (Mongoose)
├── server.js                  # Servidor Express + Socket.IO
├── package.json               # Dependencias del proyecto
├── .env.example               # Plantilla de variables de entorno
├── CHANGELOG.md               # Registro de cambios
├── GUIA_INICIO.md            # Guía de inicio rápido
└── README.md                  # Este archivo
<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

🤝 Contribuir
¡Las contribuciones son bienvenidas! Si deseas mejorar DJConnect:

Fork el proyecto

Crea una rama para tu feature (git checkout -b feature/AmazingFeature)

Commit tus cambios (git commit -m 'Add: Amazing Feature')

Push a la rama (git push origin feature/AmazingFeature)

Abre un Pull Request

📝 Guías de Contribución
Sigue el estilo de código existente

Escribe commits descriptivos

Documenta nuevas funcionalidades

Agrega tests cuando sea posible

Actualiza el CHANGELOG.md

🐛 Reportar Bugs
Si encuentras un bug, por favor abre un Issue con:

Descripción del problema

Pasos para reproducirlo

Comportamiento esperado vs actual

Screenshots si es aplicable

Información del entorno (OS, navegador, versión)

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

📄 Licencia
Este proyecto se distribuye bajo una licencia propietaria. Consulta el archivo LICENSE.md para más detalles.

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

🌟 Agradecimientos
Spotify Web API por su increíble catálogo musical

Socket.IO por la comunicación en tiempo real

MongoDB por la base de datos flexible

A todos los DJs que han probado y mejorado esta aplicación

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

📞 Contacto & Soporte
Email: soporte@djconnect.app

Issues: GitHub Issues

Discussions: GitHub Discussions

Wiki: Documentación Completa

<div align="center"> <p>Hecho con ❤️ para la comunidad de DJs</p> <p>⭐ Si te gusta DJConnect, dale una estrella en GitHub!</p> </div>