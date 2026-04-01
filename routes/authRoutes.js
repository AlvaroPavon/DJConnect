/**
 * =========================================================================
 * ENRUTADOR DE AUTENTICACIÓN (authRoutes.js)
 * Función: Mapear los endpoints (/login, /register, etc) a sus respectivos
 * middlewares de seguridad (Rate Limits, Validaciones) y finalmente al Controller.
 * =========================================================================
 */

const express = require('express');
const router = express.Router();

// Importamos el Controlador con la lógica de base de datos
const authController = require('../controllers/authController');

// Importar Middlewares de Seguridad y Rate Limits
const { 
    registerLimiter, 
    loginLimiter, 
    passwordResetLimiter 
} = require('../middlewares/rateLimiter');

const { 
    registerValidator, 
    loginValidator, 
    forgotPasswordValidator, 
    resetPasswordValidator,
    validateResults 
} = require('../middlewares/validators');

/**
 * [POST] /register
 * Límite: 3 registros por hora / 1 IP
 * Params Express-validator: Validación de username, email, password largos.
 */
router.post('/register', 
    registerLimiter, 
    registerValidator, 
    validateResults, 
    authController.register
);

/**
 * [POST] /login
 * Límite: 10 errores por 15 minutos / 1 IP
 */
router.post('/login', 
    loginLimiter, 
    loginValidator, 
    validateResults, 
    authController.login
);

/**
 * [POST] /forgot-password
 * Solicita reseteo por email.
 */
router.post('/forgot-password', 
    passwordResetLimiter, 
    forgotPasswordValidator, 
    validateResults, 
    authController.forgotPassword
);

/**
 * [POST] /reset-password
 * Sella la nueva contraseña enviando el Token seguro.
 */
router.post('/reset-password', 
    passwordResetLimiter, 
    resetPasswordValidator, 
    validateResults, 
    authController.resetPassword
);

module.exports = router;
