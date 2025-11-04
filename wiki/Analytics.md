# 📊 Analytics y Estadísticas

DJConnect v2.0 incluye un sistema completo de analytics para que los DJs puedan tomar decisiones informadas basadas en datos reales de sus eventos.

## 🎯 Funcionalidades de Analytics

### 1. **Estadísticas en Tiempo Real**

Durante una fiesta activa, el panel del DJ muestra:

#### Total de Peticiones
- Contador en vivo de canciones solicitadas
- Se actualiza instantáneamente con cada nueva petición
- No incluye canciones ocultas

#### Género Más Pedido
- Detección automática de géneros desde Spotify API
- Destacado con badge especial
- Actualización en tiempo real

#### Distribución de Géneros
- Badges para todos los géneros pedidos
- Contador individual por género
- Colores distintivos para mejor visualización

---

## 📈 Panel de Estadísticas en Vivo

### Ubicación

El panel de estadísticas está ubicado en la parte superior del Dashboard del DJ, justo debajo de la navegación.

### Componentes

```
┌──────────────────────────────────────┐
│  📊 Estadísticas en Vivo             │
├──────────────────────────────────────┤
│  Total de peticiones: 42             │
│  Género más pedido: Reggaeton        │
│                                      │
│  [Reggaeton: 15] [Pop: 12]          │
│  [Rock: 8] [Electronic: 5]          │
│  [Hip Hop: 2]                        │
└──────────────────────────────────────┘
```

### Interpretación

- **Total**: Todas las peticiones visibles (no ocultas)
- **Género más pedido**: El género con mayor número de solicitudes
- **Badges**: Lista completa con contadores individuales

---

## 📚 Historial de Fiestas

### Acceso

**Panel del DJ** → **Historial de Fiestas**

### Información Guardada

Cada fiesta finalizada guarda automáticamente:

#### Datos Básicos
- **ID de la Fiesta**: Identificador único
- **Fecha de Finalización**: Timestamp completo
- **DJ Username**: Quién organizó el evento

#### Métricas Clave
- **Total de Canciones**: Todas las peticiones recibidas
- **Género Más Pedido**: Género con más solicitudes
- **Valoración Media**: Promedio de todas las valoraciones (1-5 estrellas)

#### Lista Completa de Canciones
- Título y artista de cada canción
- Género musical
- Estado: Puesta / No puesta / Oculta
- Hora de solicitud

---

## 🎵 Análisis de Géneros Musicales

### Fuente de Datos

Los géneros se obtienen automáticamente de la **Spotify API**:

1. Usuario busca una canción
2. Se obtiene el artista de la canción
3. Se consulta el género del artista en Spotify
4. Se guarda con la petición

### Géneros Disponibles

La API de Spotify incluye cientos de géneros, algunos ejemplos:

**Principales:**
- Pop
- Rock
- Hip Hop
- Electronic
- Reggaeton
- R&B
- Country
- Jazz
- Metal
- Latin

**Subgéneros:**
- Indie Pop
- Progressive Rock
- Trap
- House
- Techno
- Bachata
- Salsa
- etc.

### Géneros "Desconocido"

Si no se puede determinar el género:
- Se asigna "Desconocido" por defecto
- Aparece en las estadísticas igual que otros géneros
- No afecta el cálculo del género más pedido

---

## 📊 Casos de Uso de Analytics

### 1. **Planificación de Setlist**

**Problema:** ¿Qué géneros tocar en mi próximo evento?

**Solución:**
1. Revisa el historial de fiestas similares
2. Identifica los géneros más pedidos
3. Prepara más canciones de esos géneros

### 2. **Adaptación en Tiempo Real**

**Problema:** El ambiente de la fiesta no está funcionando.

**Solución:**
1. Revisa las estadísticas en vivo
2. Observa qué géneros se están pidiendo
3. Ajusta tu set hacia esos géneros

### 3. **Marketing y Promoción**

**Problema:** ¿Cómo promocionar mis servicios?

**Solución:**
1. Usa las valoraciones medias de tus fiestas
2. Muestra las estadísticas de canciones tocadas
3. Destaca los géneros en los que eres especialista

### 4. **Mejora Continua**

**Problema:** ¿Cómo mejorar mi rendimiento?

**Solución:**
1. Compara valoraciones entre eventos
2. Identifica patrones de éxito
3. Ajusta tu estilo según feedback

---

## 🔍 Análisis Detallado de Fiestas

### Ver Detalles de una Fiesta

En el historial, cada fiesta tiene un desplegable **"Ver todas las canciones"**:

```
📊 Fiesta: boda-ana-luis-abc123
├─ 📅 31 de enero de 2025, 23:45
├─ 🎵 Total: 87 canciones
├─ 🎸 Género: Reggaeton
├─ ⭐ Valoración: 4.7 / 5
└─ 📜 Lista completa ▼
    ├─ "Despechá" - Rosalía (Reggaeton) ✓
    ├─ "As It Was" - Harry Styles (Pop) ✓
    ├─ "Tití Me Preguntó" - Bad Bunny (Reggaeton) ✓
    └─ ... (84 más)
```

### Indicadores de Estado

- **✓ Puesta**: Canción marcada como tocada
- **🚫 Oculta**: Canción eliminada de la vista
- **Sin marca**: Petición no atendida

---

## 📉 Exportación de Datos

### Versión Actual (v2.0)

Los datos se pueden visualizar en:
- Dashboard en tiempo real
- Historial de fiestas en la web

### Próximamente (v2.1)

Planeamos agregar:
- ✅ Exportación a PDF
- ✅ Exportación a CSV
- ✅ Gráficos visuales
- ✅ Comparativas entre eventos

---

## 💡 Tips para Mejores Analytics

### 1. **Configurar Spotify Correctamente**

Sin credenciales de Spotify reales, los géneros serán limitados. 

**Recomendación:** Configura tu API de Spotify para géneros precisos.

### 2. **No Ocultar Sin Motivo**

Las canciones ocultas aún cuentan en el historial pero no en estadísticas en vivo.

**Recomendación:** Solo oculta canciones inapropiadas o duplicadas.

### 3. **Finalizar Fiestas Correctamente**

Usa el botón "Finalizar Fiesta" para guardar todas las estadísticas.

**Recomendación:** No cierres el navegador sin finalizar.

### 4. **Pedir Valoraciones**

Recuerda a los invitados valorar tu actuación.

**Recomendación:** Menciona la valoración al final del evento.

---

## 🎯 Interpretación de Valoraciones

### Escala de Valoración

- **5 estrellas** ⭐⭐⭐⭐⭐ - Excelente
- **4 estrellas** ⭐⭐⭐⭐ - Muy bueno
- **3 estrellas** ⭐⭐⭐ - Bueno
- **2 estrellas** ⭐⭐ - Mejorable
- **1 estrella** ⭐ - Necesita mejora

### Promedios de Referencia

- **4.5 - 5.0**: Rendimiento excepcional
- **4.0 - 4.4**: Muy buen rendimiento
- **3.5 - 3.9**: Buen rendimiento
- **3.0 - 3.4**: Rendimiento aceptable
- **< 3.0**: Necesita revisión

### Factores que Afectan la Valoración

✅ **Positivos:**
- Tocar canciones pedidas
- Responder rápido a peticiones
- Leer el ambiente
- Variedad musical

❌ **Negativos:**
- Ignorar peticiones
- Géneros muy repetitivos
- Volumen inadecuado
- Transiciones bruscas

---

## 🔮 Futuro de Analytics (Roadmap)

### v2.1 (Q2 2025)
- Gráficos de géneros con Chart.js
- Exportación PDF/CSV
- Comparativas entre eventos

### v3.0 (Q3 2025)
- Predicción de hits con IA
- Sugerencias de setlist
- Analytics predictivos

### v4.0 (2026)
- Dashboard de analytics avanzado
- Machine learning para recomendaciones
- Integración con redes sociales

---

## 📚 Recursos Relacionados

- [Panel del DJ](./Panel-DJ.md)
- [Historial de Fiestas](./Historial.md)
- [Spotify Integration](./Spotify-Integration.md)
- [API Reference](./API-Reference.md)

---

**¿Preguntas sobre analytics?** [Abre una Discussion](https://github.com/tu-usuario/djconnect/discussions)
