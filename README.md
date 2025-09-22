<p align="center">
  <img src="./public/images/logo.png" width="120" alt="DJConnect Logo" />
</p>

<div align="center">
  <h1>DJConnect</h1>
  <p>Una plataforma web en tiempo real para la gestión interactiva de peticiones musicales en eventos en vivo. Optimizando la conexión entre el DJ y su audiencia.</p>
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

## 📜 Tabla de Contenidos

1.  [**Acerca del Proyecto**](#-acerca-del-proyecto)
2.  [**Funcionalidades Clave**](#-funcionalidades-clave)
3.  [**Stack Tecnológico**](#-stack-tecnológico)
4.  [**Estructura del Directorio**](#-estructura-del-directorio)
5.  [**Licencia**](#-licencia)

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## 🚀 Acerca del Proyecto

**DJConnect** es una solución de software diseñada para digitalizar y simplificar la interacción entre los DJs y los asistentes a un evento. La aplicación elimina las barreras de la comunicación tradicional (peticiones verbales o en papel) al proporcionar una plataforma centralizada y en tiempo real.

Los invitados utilizan una interfaz web accesible mediante un código QR para buscar en un extenso catálogo de música y enviar sus solicitudes. El DJ, a su vez, gestiona estas peticiones desde un panel de control exclusivo, donde puede visualizar, organizar y marcar las canciones que ya ha reproducido.

El sistema también incorpora un mecanismo de feedback mediante un sistema de valoración, proveyendo al DJ datos valiosos sobre su rendimiento.

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## ✨ Funcionalidades Clave

| Módulo | Funcionalidad | Descripción Técnica |
| :--- | :--- | :--- |
| **Autenticación** | Gestión de Usuarios (DJ) | Registro, login y recuperación de contraseñas mediante `bcryptjs` para el hash y `JWT` para la gestión de sesiones seguras. |
| **Gestión de Eventos**| Salas de Fiesta Dinámicas | Creación de espacios únicos (`partyId`) para cada evento, asociando las peticiones a un DJ y una sesión específicos. |
| **Panel del DJ** | Dashboard en Tiempo Real | Interfaz para visualizar peticiones entrantes vía `Socket.IO`, marcar canciones como reproducidas y gestionar la cola. |
| **Interacción (Invitado)**| Sistema de Peticiones | Búsqueda de canciones contra la API de Spotify y envío de solicitudes al servidor a través de eventos de `Socket.IO`. |
| **Gamificación** | Ranking y Valoraciones | Sistema que agrega las puntuaciones de los invitados para generar un ranking de DJs basado en su rendimiento promedio. |
| **Accesibilidad** | Código QR y Movilidad | Generación de códigos QR en el frontend para un acceso instantáneo. `CapacitorJS` se utiliza para habilitar la compartición nativa en dispositivos móviles. |

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## 🛠️ Stack Tecnológico

La arquitectura de la aplicación se basa en las siguientes tecnologías:

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Backend** | **Node.js / Express** | Entorno de ejecución y framework para la construcción de la API REST y la lógica del servidor. |
| **Base de Datos** | **MongoDB (con Mongoose)** | Almacenamiento NoSQL para persistir datos de usuarios, fiestas y canciones. |
| **Comunicación Real-Time** | **Socket.IO** | Habilita la comunicación bidireccional y de baja latencia entre cliente y servidor. |
| **Frontend** | **HTML5, CSS3, Vanilla JS** | Estructura, diseño e interactividad del lado del cliente sin dependencias de frameworks. |
| **Servicios Externos** | **API de Spotify** | Provee el catálogo de búsqueda de canciones para los invitados. |

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## 📁 Estructura del Directorio

El proyecto sigue una organización modular para separar las responsabilidades:

```sh
/
├── assets/                # Recursos para el README (logo, gifs)
│   ├── logo.png
│   ├── visualizer_banner.gif
│   └── wave_divider.gif
├── public/                # Assets del cliente (Frontend)
# ... resto de la estructura
```

<img src="assets/wave_divider.gif" alt="Sound Wave Divider" width="100%" height="40px"/>

## 📄 Licencia

Este proyecto se distribuye bajo una licencia propietaria. Consulta el archivo `LICENSE.md` para más detalles.
