# 🚀 Guía de Instalación

Esta guía te llevará paso a paso por el proceso de instalación de DJConnect en tu entorno local.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

### Software Requerido

| Software | Versión Mínima | Verificar Instalación |
|----------|----------------|----------------------|
| **Node.js** | v14.0.0+ | `node --version` |
| **npm** | v6.0.0+ | `npm --version` |
| **MongoDB** | v4.4.0+ | `mongod --version` |
| **Git** | v2.0.0+ | `git --version` |

### Cuentas Externas (Opcionales)

- [Spotify Developer Account](https://developer.spotify.com/) - Para búsqueda de canciones
- [SendGrid Account](https://sendgrid.com/) - Para recuperación de contraseñas

---

## 📥 Paso 1: Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/djconnect.git

# Navegar al directorio
cd djconnect
```

---

## 📦 Paso 2: Instalar Dependencias

```bash
# Usando npm
npm install

# O usando yarn (si lo prefieres)
yarn install
```

### Dependencias Principales

El proyecto instalará automáticamente:
- `express` - Framework web
- `socket.io` - Comunicación en tiempo real
- `mongoose` - ODM para MongoDB
- `bcryptjs` - Hash de contraseñas
- `jsonwebtoken` - Autenticación JWT
- `axios` - Cliente HTTP
- `nodemailer` - Envío de emails
- `dotenv` - Variables de entorno

---

## ⚙️ Paso 3: Configurar Variables de Entorno

### 3.1 Crear archivo .env

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

### 3.2 Editar el archivo .env

Abre `.env` con tu editor favorito y configura las siguientes variables:

```env
# ===== BASE DE DATOS =====
MONGO_URI=mongodb://localhost:27017/djconnect

# ===== SEGURIDAD =====
JWT_SECRET=genera_una_clave_secreta_muy_larga_y_aleatoria_aqui

# ===== SPOTIFY API (Opcional) =====
SPOTIFY_CLIENT_ID=tu_spotify_client_id_aqui
SPOTIFY_CLIENT_SECRET=tu_spotify_client_secret_aqui

# ===== EMAIL (Opcional) =====
SENDGRID_API_KEY=tu_sendgrid_api_key_aqui

# ===== APLICACIÓN =====
APP_BASE_URL=http://localhost:8001
PORT=8001
FRONTEND_URL=http://localhost:8001
```

> **💡 Consejo:** Genera un JWT_SECRET aleatorio con:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 🔑 Paso 4: Obtener Credenciales de Spotify (Opcional)

### 4.1 Crear una App en Spotify

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Inicia sesión con tu cuenta de Spotify
3. Clic en **"Create an App"**
4. Completa el formulario:
   - **App name**: DJConnect Local
   - **App description**: Local development
   - **Redirect URIs**: `http://localhost:8001/callback`

### 4.2 Copiar Credenciales

1. Una vez creada la app, copia el **Client ID**
2. Clic en **"Show Client Secret"** y copia el **Client Secret**
3. Pégalos en tu archivo `.env`

> **📝 Nota:** Si no configuras Spotify, la app funcionará con canciones de ejemplo.

---

## 💾 Paso 5: Configurar MongoDB

### Opción A: MongoDB Local

#### En Linux/Mac:
```bash
# Iniciar MongoDB
sudo systemctl start mongod

# Verificar que está corriendo
sudo systemctl status mongod

# Habilitar inicio automático
sudo systemctl enable mongod
```

#### En Windows:
```bash
# Iniciar como servicio
net start MongoDB

# O ejecutar manualmente
"C:\Program Files\MongoDB\Server\{version}\bin\mongod.exe" --dbpath="C:\data\db"
```

### Opción B: MongoDB Atlas (Cloud)

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Configura acceso de red (IP Whitelist: 0.0.0.0/0 para desarrollo)
4. Crea un usuario de base de datos
5. Obtén la URI de conexión y úsala en `MONGO_URI`

Ejemplo de URI de Atlas:
```env
MONGO_URI=mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/djconnect?retryWrites=true&w=majority
```

---

## 🚀 Paso 6: Iniciar la Aplicación

### Desarrollo (con recarga automática)

```bash
# Instalar nodemon globalmente si no lo tienes
npm install -g nodemon

# Iniciar en modo desarrollo
npm run dev
```

### Producción

```bash
# Iniciar servidor
npm start
```

### Verificar que está funcionando

Deberías ver en la consola:
```
🚀 Servidor listo y escuchando en http://0.0.0.0:8001
✅ Conectado a la base de datos
```

---

## ✅ Paso 7: Verificar la Instalación

### 7.1 Abrir el navegador

Navega a: `http://localhost:8001`

Deberías ser redirigido a la página de login.

### 7.2 Crear usuario de prueba

```bash
# Ejecutar script de registro
./register_user.sh "djtest" "test@example.com" "password123"
```

O manualmente con curl:
```bash
curl -X POST http://localhost:8001/register \
  -H "Content-Type: application/json" \
  -d '{"username":"djtest","email":"test@example.com","password":"password123"}'
```

### 7.3 Iniciar sesión

- **Usuario**: djtest
- **Contraseña**: password123

---

## 🐛 Solución de Problemas

### Error: "MongoDB connection failed"

**Solución:**
```bash
# Verificar que MongoDB está corriendo
sudo systemctl status mongod

# Si no está corriendo, iniciarlo
sudo systemctl start mongod
```

### Error: "EADDRINUSE: address already in use :::8001"

**Solución:**
```bash
# Encontrar el proceso usando el puerto 8001
lsof -i :8001

# Matar el proceso
kill -9 <PID>
```

### Error: "JWT_SECRET is not defined"

**Solución:**
- Asegúrate de haber creado el archivo `.env`
- Verifica que `JWT_SECRET` esté definido en `.env`
- Reinicia el servidor después de crear/modificar `.env`

### Las canciones no se buscan (Spotify)

**Solución:**
- Verifica que `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` estén correctos
- Si no tienes credenciales, la app usará canciones de ejemplo automáticamente

---

## 🎯 Próximos Pasos

Ahora que tienes DJConnect instalado:

1. ✅ Lee la [Configuración Inicial](./Configuracion.md)
2. ✅ Explora los [Primeros Pasos](./Primeros-Pasos.md)
3. ✅ Familiarízate con el [Panel del DJ](./Panel-DJ.md)

---

## 📚 Referencias

- [Documentación de Node.js](https://nodejs.org/docs/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Socket.IO Docs](https://socket.io/docs/v4/)

---

**¿Problemas con la instalación?** [Abre un Issue](https://github.com/tu-usuario/djconnect/issues) o consulta [Troubleshooting](./Troubleshooting.md)
