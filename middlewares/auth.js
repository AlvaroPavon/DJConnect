/**
 * =========================================================================
 * MIDDLEWARES DE AUTENTICACIÓN (auth.js)
 * Función: Extrae el JWT (JSON Web Token) de los headers HTTP de las 
 * peticiones y verifica si es auténtico.
 * Permite bloquear recursos a invitados o a roles equivocados.
 * =========================================================================
 */

const jwt = require('jsonwebtoken');
const DJ = require('../djModel.js'); // Importamos el modelo para consultas extra de roles.

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware: authenticateToken
 * Valida un JWT normal. Útil para acciones base (entrar a paneles de DJ, etc).
 */
const authenticateToken = (req, res, next) => {
    // Busca "Bearer <TOKEN>" en el header.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Si no mandaron token, corta la request con un 401 (Unauthorized)
    if (token == null) return res.sendStatus(401);
    
    // Verifica si la firma criptográfica es correcta respecto a nuestra semilla (SECRET)
    jwt.verify(token, JWT_SECRET, (err, user) => {
        // Token caducado o malformado, cortamos con 403 (Forbidden)
        if (err) return res.sendStatus(403);
        
        // Adjuntamos el usuario decodificado a `req.user` para el siguiente middleware.
        req.user = user;
        next();
    });
};

/**
 * Middleware: authenticateAdmin
 * Equivalente a authenticateToken pero con un bloqueo explícito si el 
 * `role` no es "admin" en la Base de Datos.
 */
const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Si no mandaron token, corta la request.
    if (token == null) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) return res.sendStatus(403);
        
        // Vamos extra hasta Mongo para revisar si de verdad es Admin (por seguridad)
        const dj = await DJ.findById(user.id);
        if (!dj || dj.role !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado. Solo roles administrativos.' });
        }
        
        // Si todo coincide, inyectamos en `req.user` y pasamos al siguiente handler
        req.user = user;
        next();
    });
};

module.exports = {
    authenticateToken,
    authenticateAdmin
};
