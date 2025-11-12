# 🛠️ Tecnología y Arquitectura

DJConnect está construido como una aplicación web Full-Stack moderna, priorizando la interactividad en tiempo real y la escalabilidad.

## Arquitectura General

La aplicación sigue un modelo cliente-servidor clásico:

1.  **Backend (Servidor)**: Un servidor **Node.js** con **Express** gestiona la lógica de negocio, la autenticación de usuarios (DJs) y la conexión con la base de datos. Sirve como una API REST para las acciones estándar (login, registro) y como un servidor de **WebSockets (Socket.IO)** para la comunicación en tiempo real (peticiones de canciones).

2.  **Frontend (Cliente)**: Un frontend ligero construido con **HTML5, CSS3 y JavaScript (Vanilla JS)**. No depende de frameworks pesados (como React o Angular), lo que asegura un tiempo de carga mínimo, ideal para invitados en un evento.

3.  **Base de Datos**: Se utiliza **MongoDB** (a través de Mongoose) como base de datos NoSQL para almacenar de forma persistente la información de los DJs, las fiestas, las canciones de las wishlists y el historial de eventos.

## Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Backend** | **Node.js / Express** | API REST y lógica del servidor |
| **Base de Datos** | **MongoDB (Mongoose)** | Almacenamiento NoSQL persistente |
| **Tiempo Real** | **Socket.IO** | Comunicación bidireccional de baja latencia |
| **Frontend** | **HTML5, CSS3, Vanilla JS** | Interfaz sin dependencias de frameworks |
| **PWA** | **Service Worker, Manifest** | Instalabilidad y experiencia nativa |
| **Seguridad** | **Helmet, Express Rate Limit** | Headers seguros y protección DDoS |
| **Validación** | **Express Validator** | Sanitización y validación de inputs |
| **APIs Externas** | **Spotify API** | Catálogo de búsqueda de música y géneros |
| **Email** | **SendGrid (Nodemailer)** | Recuperación de contraseñas |
| **Generación Imágenes** | **Sharp, Canvas API** | Procesamiento de logos y QR templates |
| **Proxy Reverso** | **Nginx** | SSL/TLS, headers de seguridad, load balancing |

## Seguridad Implementada

### Capas de Protección

**Nivel 1: Headers HTTP (Nginx + Helmet)**
- Content Security Policy contra XSS
- HSTS para forzar HTTPS
- X-Frame-Options contra clickjacking
- X-Content-Type-Options contra MIME sniffing

**Nivel 2: Rate Limiting**
- Express Rate Limit en todos los endpoints
- Límites específicos por tipo de operación
- Bloqueo temporal por IP

**Nivel 3: Validación de Datos**
- Express Validator para inputs
- Sanitización automática de caracteres peligrosos
- Validación de tipos y formatos

**Nivel 4: Protección Base de Datos**
- NoSQL injection bloqueada
- Queries parametrizadas
- Sanitización de operadores MongoDB

**Nivel 5: Archivos**
- Validación de magic numbers
- Restricción de tipos MIME
- Límites de tamaño
- Rate limiting específico

### Arquitectura de Seguridad

```
Internet → Nginx (HTTPS/SSL) → Express (Rate Limit + Helmet) → MongoDB
                ↓
         Security Headers
         Rate Limiting
         JWT Validation
                ↓
           Application Logic
```