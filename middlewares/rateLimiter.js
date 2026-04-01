/**
 * =========================================================================
 * MIDDLEWARES DE LÍMITES DE TASA (Rate Limiters)
 * Función: Protegen la aplicación contra ataques de fuerza bruta, denegación 
 * de servicio (DDoS) y abuso de subida de archivos garantizando que un mismo
 * origen (IP) no sature el servidor con miles de peticiones.
 * =========================================================================
 */

const rateLimit = require('express-rate-limit');

// Limiter MUY PERMISIVO para invitados (muchos usuarios usarán el mismo WiFi en eventos)
const guestLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // Ventana de 5 minutos
    max: 500, // Máximo 500 peticiones por IP en esos 5 min
    message: 'Demasiadas peticiones. Por favor, espera un momento.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Excluimos las peticiones por assets estáticos de este límite
        return req.path.endsWith('.html') || 
               req.path.endsWith('.css') || 
               req.path.endsWith('.js') ||
               req.path.endsWith('.png') ||
               req.path.endsWith('.jpg');
    }
});

// Limiter MODERADO para operaciones comunes (API DJ/Admin)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, 
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter ESTRICTO para login (prevenir bots adivinando contraseñas)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos de bloqueo
    max: 10, // Acepta máximo 10 errores antes de bloquear la IP
    message: 'Demasiados intentos de inicio de sesión fallidos. Por favor, intenta en 15 minutos.',
    skipSuccessfulRequests: true // Si acierta, reseteamos el contador
});

// Limiter para evitar creación masiva de cuentas falsas
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, 
    message: 'Demasiados registros desde esta IP. Por favor, intenta de nuevo más tarde.'
});

// Limiter para proteger correos de recuperación masivos
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3,
    message: 'Demasiadas solicitudes de recuperación de contraseña. Intenta de nuevo en 1 hora.'
});

// Limiter para subida de logos/archivos (evita llenado de base de datos rápido)
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Demasiadas subidas de archivos. Por favor, intenta de nuevo.'
});

module.exports = {
    guestLimiter,
    generalLimiter,
    loginLimiter,
    registerLimiter,
    passwordResetLimiter,
    uploadLimiter
};
