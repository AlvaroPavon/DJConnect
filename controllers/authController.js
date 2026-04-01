/**
 * =========================================================================
 * CONTROLADOR DE AUTENTICACIÓN (authController.js)
 * Función: Agrupa la lógica de negocio para crear usuarios (registro),
 * verificarlos (login) y manejar resets de contraseña.
 * =========================================================================
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const DJ = require('../djModel.js');

const JWT_SECRET = process.env.JWT_SECRET;

// --- CONFIGURACIÓN DEL SERVICIO DE CORREO ---
const mailerConfig = {
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
    }
};
const transporter = nodemailer.createTransport(mailerConfig);

// === SEGURIDAD: Función de sanitización básica ===
function sanitizeInput(input) {
    if (typeof input === 'string') {
        return input.replace(/[<>"']/g, ''); // Evitar XSS en textos planos
    }
    return input;
}

/**
 * Registra un nuevo DJ
 */
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Sanitizar inputs
        const sanitizedUsername = sanitizeInput(username);
        const sanitizedEmail = sanitizeInput(email);
        
        // Chequeo de duplicados cruzado (Mismo email o username)
        const existingUser = await DJ.findOne({ 
            $or: [{ username: sanitizedUsername }, { email: sanitizedEmail }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario o el email ya están en uso.' });
        }
        
        // Hashing del password para seguridad DB
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newDJ = new DJ({ 
            username: sanitizedUsername, 
            email: sanitizedEmail, 
            password: hashedPassword 
        });
        await newDJ.save();
        
        res.status(201).json({ message: '¡Registro exitoso! Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error Registration:', error);
        res.status(500).json({ message: 'Error en el servidor al registrar.' });
    }
};

/**
 * Autentica y genera un token JWT para un DJ/Admin
 */
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const sanitizedUsername = sanitizeInput(username);
        
        // 1. Buscamos al DJ
        const dj = await DJ.findOne({ username: sanitizedUsername });
        if (!dj) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
        }
        
        // 2. Comparamos los hashes
        const isMatch = await bcrypt.compare(password, dj.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
        }
        
        // 3. Generamos el Token de Sesión (Expira en 2 horas por seguridad)
        const token = jwt.sign(
            { id: dj._id, username: dj.username, role: dj.role }, 
            JWT_SECRET, 
            { expiresIn: '2h' }
        );
        
        res.json({ token, role: dj.role });
    } catch (error) {
        console.error('Error Login:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

/**
 * Solicita el reseteo de password vía correo
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const sanitizedEmail = sanitizeInput(email);
        
        const dj = await DJ.findOne({ email: sanitizedEmail });
        if (!dj) {
            // No revelamos si el correo existe o no al cliente real, evitamos enumeración de emails
            return res.json({ message: 'Si tu email está registrado, recibirás un enlace de recuperación.' });
        }
        
        // Token temporal para reset (vence en 1h)
        const resetToken = crypto.randomBytes(32).toString('hex');
        dj.passwordResetToken = resetToken;
        dj.passwordResetExpires = Date.now() + 3600000;
        await dj.save();
        
        const resetUrl = `${process.env.APP_BASE_URL}/html/reset-password.html?token=${resetToken}`;
        await transporter.sendMail({
            from: '"DJ Connect App" <alvaropavonmartinez7@gmail.com>',
            to: dj.email,
            subject: 'Recuperación de Contraseña',
            html: `<h1>Recuperación de Contraseña</h1><p>Haz clic en el enlace adjunto para cambiar la password:</p><a href="${resetUrl}">${resetUrl}</a><p>Si no fuiste tú, ignora esto.</p>`
        });
        
        res.json({ message: 'Si tu email está registrado, recibirás un enlace de recuperación.' });
    } catch (error) {
        console.error('Error Forgot Pwd:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

/**
 * Valida el token temporal y aplica el nuevo password
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const sanitizedToken = sanitizeInput(token);
        
        const dj = await DJ.findOne({
            passwordResetToken: sanitizedToken,
            passwordResetExpires: { $gt: Date.now() } // Verifica que no expiró
        });
        
        if (!dj) {
            return res.status(400).json({ message: 'El token no es válido o ha expirado.' });
        }
        
        // Hashing nuevo
        dj.password = await bcrypt.hash(password, 10);
        
        // Limpiamos los tokens residuales
        dj.passwordResetToken = undefined;
        dj.passwordResetExpires = undefined;
        await dj.save();
        
        res.json({ message: '¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error Reset Pwd:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};
