# 🔒 Seguridad en DJConnect

DJConnect implementa múltiples capas de seguridad de nivel empresarial para proteger tanto la aplicación como los datos de los usuarios.

## Arquitectura de Seguridad

```
┌─────────────────────────────────────────────────┐
│              Internet / Usuario                 │
└────────────────┬────────────────────────────────┘
                 │ HTTPS/SSL
                 ▼
┌─────────────────────────────────────────────────┐
│         Nginx (Proxy Reverso)                   │
│  • SSL/TLS Termination                          │
│  • Security Headers                             │
│  • Request Filtering                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│            Express.js Server                    │
│  • Helmet (Headers)                             │
│  • Rate Limiting                                │
│  • JWT Authentication                           │
│  • Input Validation                             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│            MongoDB Database                     │
│  • NoSQL Injection Protection                   │
│  • Encrypted Passwords (bcrypt)                 │
│  • Sanitized Queries                            │
└─────────────────────────────────────────────────┘
```

## Capas de Protección

### 🛡️ Capa 1: Headers HTTP de Seguridad

Implementados con **Helmet.js** y configuración de Nginx:

**Content Security Policy (CSP)**
```javascript
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
```

**Protege contra:**
- Cross-Site Scripting (XSS)
- Code injection
- Clickjacking
- Data injection

**Strict-Transport-Security (HSTS)**
```
max-age=31536000; includeSubDomains; preload
```

**Protege contra:**
- Man-in-the-middle attacks
- Protocol downgrade attacks
- Cookie hijacking

**X-Frame-Options**
```
SAMEORIGIN
```

**Protege contra:**
- Clickjacking
- UI redressing attacks

**X-Content-Type-Options**
```
nosniff
```

**Protege contra:**
- MIME type confusion
- Drive-by downloads

### 🚫 Capa 2: Rate Limiting

Protección contra ataques de fuerza bruta y DDoS:

| Endpoint | Límite | Ventana | Propósito |
|----------|--------|---------|-----------|
| **Login** | 5 intentos | 15 min | Prevenir fuerza bruta de contraseñas |
| **Registro** | 3 intentos | 1 hora | Prevenir creación masiva de cuentas |
| **Password Reset** | 3 intentos | 1 hora | Prevenir abuso del sistema de email |
| **Upload** | 10 subidas | 15 min | Prevenir abuso de almacenamiento |
| **General** | 100 requests | 15 min | Protección DDoS general |

**Respuesta cuando se excede:**
```json
{
  "error": "Too Many Requests",
  "status": 429,
  "retryAfter": 900
}
```

### ✅ Capa 3: Validación y Sanitización de Inputs

Usando **Express Validator**:

**Registro de Usuario:**
```javascript
username: trim(), isLength(3-30), escape()
email: isEmail(), normalizeEmail()
password: isLength(6-100)
```

**Login:**
```javascript
username: trim(), notEmpty(), escape()
password: notEmpty()
```

**Caracteres Peligrosos Removidos:**
```
< > " '
```

**Protege contra:**
- XSS (Cross-Site Scripting)
- SQL/NoSQL Injection
- Command Injection
- Path Traversal

### 🔐 Capa 4: Protección NoSQL Injection

Middleware personalizado que sanitiza queries de MongoDB:

**Antes (Vulnerable):**
```javascript
// ❌ Vulnerable a injection
db.users.findOne({ username: req.body.username })
```

Si el atacante envía:
```json
{"username": {"$ne": null}}
```

Devolvería todos los usuarios.

**Después (Protegido):**
```javascript
// ✅ Protegido - operadores $ bloqueados
sanitizeObject(req.body)
// {"username": {"_ne": null}} // $ reemplazado
```

**Protege contra:**
- `$where` queries maliciosas
- `$ne` (not equal) injection
- `$gt`, `$lt` operators abuse
- Query operator injection

### 📁 Capa 5: Validación de Subida de Archivos

Validación estricta multi-nivel:

**Nivel 1: Tipo de Archivo**
```javascript
// Solo estos tipos permitidos
PNG, JPEG, JPG, WebP
```

**Nivel 2: Magic Numbers (Firmas)**
```javascript
// Verificar primeros bytes del archivo
PNG:  89 50 4E 47
JPEG: FF D8 FF
WebP: 52 49 46 46
```

**Nivel 3: Tamaño**
```javascript
// Máximo 3MB
maxSize: 3 * 1024 * 1024
```

**Nivel 4: Rate Limiting**
```javascript
// Máximo 10 uploads cada 15 minutos
```

**Protege contra:**
- Shell reversa (reverse shell)
- Malware upload
- File type spoofing
- Storage abuse

**Ejemplo de Validación:**
```javascript
function validateBase64Image(base64String) {
  // 1. Verificar formato data:image
  const matches = base64String.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  
  // 2. Decodificar
  const buffer = Buffer.from(base64Data, 'base64');
  
  // 3. Verificar tamaño
  if (buffer.length > 3MB) return false;
  
  // 4. Verificar magic numbers
  const magicNumbers = { 'png': [0x89, 0x50, 0x4E, 0x47] };
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  
  return true;
}
```

### 🔑 Capa 6: Autenticación JWT

**Tokens con Expiración Corta:**
```javascript
jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' })
```

**Antes:** 24 horas (vulnerable a token theft)  
**Ahora:** 2 horas (ventana de ataque reducida)

**Verificación en Cada Request:**
```javascript
authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  jwt.verify(token, JWT_SECRET, callback);
}
```

**Trust Proxy Configurado:**
```javascript
app.set('trust proxy', 1);
```

Permite leer la IP real del cliente desde headers X-Forwarded-For cuando hay nginx.

**Protege contra:**
- Token theft
- Session hijacking
- Replay attacks

## Amenazas Mitigadas

### ✅ Cross-Site Scripting (XSS)

**Método de Ataque:**
```html
<script>alert('XSS')</script>
```

**Protección:**
- CSP headers bloquean scripts inline no autorizados
- Sanitización de inputs remueve `< > " '`
- Escape de caracteres especiales

### ✅ NoSQL Injection

**Método de Ataque:**
```json
{"username": {"$ne": null}, "password": {"$ne": null}}
```

**Protección:**
- Middleware sanitiza operadores `$`
- Validación de tipos de datos
- Queries parametrizadas

### ✅ Fuerza Bruta de Contraseñas

**Método de Ataque:**
```
Intentar login con:
admin / password1
admin / password2
admin / password3
...
```

**Protección:**
- Rate limiting: 5 intentos / 15 minutos
- Bloqueo temporal por IP
- Passwords hasheados con bcrypt (10 rounds)

### ✅ DDoS (Distributed Denial of Service)

**Método de Ataque:**
```
Miles de requests simultáneos para saturar el servidor
```

**Protección:**
- Rate limiting general: 100 req / 15 min
- Nginx como buffer
- Límites específicos por endpoint

### ✅ Clickjacking

**Método de Ataque:**
```html
<iframe src="https://djconnect.com/admin"></iframe>
```

**Protección:**
- X-Frame-Options: SAMEORIGIN
- CSP frame-ancestors 'self'

### ✅ Man-in-the-Middle (MITM)

**Método de Ataque:**
```
Interceptar tráfico HTTP para robar datos
```

**Protección:**
- HTTPS obligatorio (puerto 443)
- HSTS fuerza HTTPS siempre
- Certificado SSL válido

### ✅ File Upload Exploits

**Método de Ataque:**
```php
<?php system($_GET['cmd']); ?>
```

Disfrazado como imagen.

**Protección:**
- Validación de magic numbers
- Solo imágenes permitidas
- No ejecución de archivos subidos
- Rate limiting en uploads

## Buenas Prácticas Implementadas

### Passwords

- ✅ **Hashing con bcrypt** (10 rounds)
- ✅ **Salt automático** por password
- ✅ **Validación de longitud mínima** (6 caracteres)
- ✅ **No se almacenan en texto plano**

### JWT Tokens

- ✅ **Expiración de 2 horas**
- ✅ **Secret en variable de entorno**
- ✅ **Verificación en cada request**
- ✅ **No se almacenan en localStorage** (se pasan por headers)

### Base de Datos

- ✅ **Queries sanitizadas**
- ✅ **Operadores $ bloqueados**
- ✅ **Conexión con URI en .env**
- ✅ **No se expone en logs**

### Variables de Entorno

- ✅ **Archivo .env** para secretos
- ✅ **.env en .gitignore**
- ✅ **.env.example** como plantilla
- ✅ **Nunca en código fuente**

## Configuración de Nginx

Headers de seguridad en proxy reverso:

```nginx
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000" always;

# Proxy Headers para Rate Limiting
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# Preservar headers del backend
proxy_pass_header Content-Security-Policy;
proxy_pass_header X-Frame-Options;
proxy_pass_header Strict-Transport-Security;
```

## Auditoría y Logs

### Eventos Registrados

```javascript
// Intentos de subida inválidos
console.warn('Intento de subida inválido:', error);

// Validación exitosa
console.log('Imagen validada: tipo=PNG, tamaño=2MB');
```

### Logs de Nginx

```bash
# Logs de acceso
/var/log/nginx/djapp_access.log

# Logs de errores
/var/log/nginx/djapp_error.log
```

### Monitoreo Recomendado

- **Rate Limit Hits**: Cuántas veces se bloqueó por límite
- **Failed Login Attempts**: Intentos fallidos por IP
- **Upload Rejections**: Archivos rechazados y razón
- **JWT Expirations**: Tokens expirados

## Testing de Seguridad

### Tests Automatizados

```bash
# Test rate limiting
for i in {1..6}; do
  curl -X POST https://app.com/login \
    -d '{"username":"test","password":"wrong"}'
done
# Intento 6 debe ser 429 Too Many Requests
```

### Herramientas Recomendadas

- **OWASP ZAP**: Escáner de vulnerabilidades
- **Burp Suite**: Testing de seguridad
- **Lighthouse**: Auditoría de seguridad PWA
- **Observatory by Mozilla**: Headers y SSL

### Checklist de Seguridad

✅ HTTPS configurado con certificado válido  
✅ HSTS habilitado (max-age 1 año)  
✅ CSP configurado correctamente  
✅ Rate limiting en endpoints críticos  
✅ Validación de inputs en todos los forms  
✅ NoSQL injection bloqueada  
✅ Upload de archivos validado con magic numbers  
✅ JWT con expiración < 24h  
✅ Passwords hasheados con bcrypt  
✅ Variables de entorno protegidas  
✅ .env en .gitignore  
✅ CORS configurado correctamente  
✅ Headers X-Frame-Options, X-Content-Type-Options  

## Futuras Mejoras

### v2.3
- [ ] Refresh Tokens (para evitar re-login frecuente)
- [ ] 2FA para admin (autenticación de dos factores)
- [ ] Logging centralizado con Winston

### v3.0
- [ ] WAF (Web Application Firewall)
- [ ] Backups automáticos encriptados
- [ ] Auditoría de seguridad automática con Snyk

### v4.0
- [ ] Rate limiting por usuario (no solo por IP)
- [ ] Análisis de comportamiento anómalo
- [ ] Alertas en tiempo real de intentos de ataque

## Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO la hagas pública** (no abras issue público)
2. Contacta via GitHub Issues con etiqueta `[SECURITY]`
3. Describe el problema en detalle
4. Proporciona pasos para reproducir
5. Recibirás respuesta en 48-72 horas

---

> **🔒 Nota**: La seguridad es un proceso continuo. Esta documentación refleja el estado actual de las medidas implementadas y se actualiza regularmente.
