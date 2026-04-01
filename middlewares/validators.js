/**
 * =========================================================================
 * MIDDLEWARES DE VALIDACIÓN (validators.js)
 * Función: Extrae los chequeos de `express-validator` para sanear y
 * prevenir inputs maliciosos o malformados en los endpoints clave (login/registro).
 * =========================================================================
 */

// Importamos desestructurado paramétricas de validación
const { body, validationResult } = require('express-validator');

/**
 * Array de reglas para registrar a un DJ
 * Verifica longitud, sanidad (escape XSS) y consistencia de email/password.
 */
const registerValidator = [
    // Recorta espacios al inicio/fin previendo que un usuario pulse "espacio"
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('El nombre debe tener entre 3 y 30 caracteres')
        .escape(),
    
    // Un email tiene que ser válido a nivel formato SMTP 
    body('email')
        .isEmail()
        .withMessage('Formato de correo electrónico inválido')
        .normalizeEmail(),
    
    // Forzamos un password decente
    body('password')
        .isLength({ min: 6, max: 100 })
        .withMessage('La contraseña debe tener más de 6 caracteres')
];

/**
 * Validaciones al intentar loguearse.
 */
const loginValidator = [
    body('username').trim().notEmpty().withMessage('El usuario es requerido'),
    body('password').notEmpty().withMessage('La contraseña no puede estar vacía')
];

/**
 * Validaciones para el olvido de contraseña.
 */
const forgotPasswordValidator = [
    body('email').isEmail().normalizeEmail().withMessage('Requerimos un email válido')
];

/**
 * Validaciones para efectuar el cambio de contraseña (reset)
 */
const resetPasswordValidator = [
    body('token').trim().notEmpty().withMessage('Falta el token de seguridad'),
    body('password').isLength({ min: 6, max: 100 }).withMessage('El nuevo password debe tener 6+ caracteres')
];

/**
 * Función central de evaluación. Recibe el Request, si `express-validator` 
 * detectó errores tras pasar por el array (ej `registerValidator`), frena 
 * el request y contesta al cliente con status 400.
 */
const validateResults = (req, res, next) => {
    // Escaner del log de errores dentro de este ciclo 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Falló validación
        return res.status(400).json({ 
            message: 'Datos inválidos detectados por el sistema', 
            errors: errors.array() 
        });
    }
    // Paso seguro 
    next();
};

module.exports = {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    validateResults
};
