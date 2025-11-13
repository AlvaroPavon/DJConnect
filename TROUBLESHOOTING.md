# 🔧 Guía de Solución de Problemas - DJConnect

## 🚨 Error 400 al Subir Logo en Panel de Admin

### Síntoma
Al intentar subir un logo en el panel de administrador, aparece el error:
```
POST https://djapp.duckdns.org/api/admin/config/logo 400 (Bad Request)
Error: Error al subir logo
```

### Causas Posibles

#### 1. Límite de Tamaño en NGINX ⚠️ (Más Común)

NGINX tiene un límite predeterminado muy pequeño (1MB) para el tamaño del body de las peticiones.

**Solución:**

1. Conecta a tu VPS por SSH:
```bash
ssh tu-usuario@djapp.duckdns.org
```

2. Edita la configuración de NGINX:
```bash
sudo nano /etc/nginx/sites-available/djapp
# O el archivo donde tengas tu configuración
```

3. Busca el bloque `server` y agrega o modifica:
```nginx
server {
    listen 80;
    server_name djapp.duckdns.org;
    
    # IMPORTANTE: Agregar esta línea
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:3000;
        # ... resto de la configuración
    }
}
```

4. Verifica la configuración:
```bash
sudo nginx -t
```

5. Si no hay errores, recarga NGINX:
```bash
sudo systemctl reload nginx
```

6. Intenta subir el logo nuevamente.

---

#### 2. Imagen Demasiado Grande

El sistema acepta imágenes de hasta **3MB** después de la conversión a base64.

**Solución:**

1. Reduce el tamaño de tu imagen antes de subirla
2. Usa herramientas como:
   - [TinyPNG](https://tinypng.com/) para comprimir PNG
   - [Squoosh](https://squoosh.app/) para cualquier formato
3. Recomendación: **500KB o menos**

---

#### 3. Rate Limiting (Menos Común)

Si intentaste subir muchas veces en poco tiempo, podrías haber alcanzado el límite.

**Solución:**
- Espera 15 minutos antes de intentar nuevamente
- El límite es de 10 subidas cada 15 minutos

---

#### 4. Formato de Imagen Incorrecto

Solo se aceptan: **PNG, JPEG, JPG, WebP**

**Solución:**
- Convierte tu imagen a uno de estos formatos
- Verifica que la extensión del archivo sea correcta

---

## 🔍 Verificar Logs del Servidor

Si el problema persiste, revisa los logs del servidor:

```bash
# En tu VPS
pm2 logs dj-app

# O si usas otro gestor de procesos
tail -f /var/log/dj-app.log
```

Busca líneas que contengan `[LOGO UPLOAD]` para ver detalles del error.

---

## 📞 Más Ayuda

Si ninguna de estas soluciones funciona:

1. Verifica que el servidor Node.js esté corriendo:
```bash
pm2 status
# O
ps aux | grep node
```

2. Verifica que NGINX esté corriendo:
```bash
sudo systemctl status nginx
```

3. Prueba la subida con una imagen muy pequeña (menos de 100KB) para descartar problemas de tamaño.
