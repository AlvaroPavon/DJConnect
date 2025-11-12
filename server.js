require('dotenv').config();
// --- 1. IMPORTACIONES ---
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');

// SEGURIDAD: Nuevas importaciones
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Modelos de la base de datos
const DJ = require('./djModel.js');
const Party = require('./partyModel.js');
const Wishlist = require('./wishlistModel.js');
const Config = require('./configModel.js');

// --- 2. CONFIGURACIÓN INICIAL ---
const app = express();
const server = http.createServer(app);

// === SEGURIDAD: Confiar en proxy (nginx) ===
// Esto permite que Express lea la IP real del cliente desde X-Forwarded-For
// CRÍTICO para que funcione el rate limiting con nginx como proxy
app.set('trust proxy', 1);

// === SEGURIDAD: Headers HTTP con Helmet ===
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.spotify.com", "https://accounts.spotify.com", "wss://djapp.duckdns.org", "ws://localhost:*"],
            frameSrc: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// === SEGURIDAD: Sanitización contra NoSQL Injection ===
// Middleware personalizado para prevenir NoSQL injection
app.use((req, res, next) => {
    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        for (let key in obj) {
            if (key.startsWith('$')) {
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                sanitizeObject(obj[key]);
            }
        }
        return obj;
    };
    
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
    
    next();
});

// Aumentar límite de body size para subir imágenes (máximo 5MB por seguridad)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// === SEGURIDAD: Rate Limiters ===
// Rate limiter MUY PERMISIVO para invitados (muchos en misma IP en eventos)
const guestLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 500, // 500 requests por IP (para eventos grandes)
    message: 'Demasiadas peticiones. Por favor, espera un momento.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // No limitar páginas estáticas
        return req.path.endsWith('.html') || 
               req.path.endsWith('.css') || 
               req.path.endsWith('.js') ||
               req.path.endsWith('.png') ||
               req.path.endsWith('.jpg');
    }
});

// Rate limiter moderado para operaciones normales
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // aumentado a 200 para eventos
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter estricto para login (prevenir fuerza bruta)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // aumentado a 10 intentos (para no bloquear DJs legítimos)
    message: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.',
    skipSuccessfulRequests: true
});

// Rate limiter para registro
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 registros por hora
    message: 'Demasiados registros desde esta IP. Por favor, intenta de nuevo más tarde.'
});

// Rate limiter para reset de contraseña
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 intentos de reset por hora
    message: 'Demasiadas solicitudes de recuperación de contraseña. Intenta de nuevo en 1 hora.'
});

// Rate limiter para subida de archivos
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 subidas
    message: 'Demasiadas subidas de archivos. Por favor, intenta de nuevo más tarde.'
});

// Aplicar rate limiters selectivos
// Para rutas de invitados (peticiones), usar limiter permisivo
app.use('/api/party', guestLimiter);
app.use('/api/wishlist', guestLimiter);

// Para rutas administrativas y de DJ, usar limiter general
app.use('/api/admin', generalLimiter);
app.use('/api/dj', generalLimiter);

// Para el resto, limiter permisivo (páginas estáticas, etc.)
app.use(guestLimiter);

// Opciones de CORS
const allowedOrigins = [
    "http://localhost:3000", 
    "http://localhost:8001",
    "https://localhost", 
    "https://djapp.duckdns.org", 
    "http://localhost:5173"
];

// Agregar FRONTEND_URL del entorno si existe
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (como mobile apps o curl)
        if (!origin) return callback(null, true);
        
        // Permitir dominios en la lista
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        
        // Permitir cualquier dominio emergent.host para producción
        if (origin.includes('.emergent.host') || origin.includes('emergent.host')) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
};
app.use(cors(corsOptions));
const io = new Server(server, {
  cors: corsOptions
});

app.use(express.static('public'));

// --- LÍNEA MODIFICADA ---
// La ruta raíz ahora siempre redirige a la página de login dentro de la carpeta html.
app.get('/', (req, res) => {
    res.redirect('/welcome.html');
});


// --- 3. CONFIGURACIÓN DE CLAVES Y CONSTANTES ---
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
let spotifyToken = null;

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

// --- 4. CONEXIÓN A LA BASE DE DATOS ---
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Conectado a la base de datos');
        initializeAdminUser();
    })
    .catch(err => console.error('❌ Error al conectar a la base de datos:', err));

// Inicializar usuario admin si no existe
async function initializeAdminUser() {
    try {
        const adminExists = await DJ.findOne({ role: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = new DJ({
                username: 'admin',
                email: 'admin@djapp.com',
                password: hashedPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('✅ Usuario administrador creado: username=admin, password=admin123');
        }
    } catch (error) {
        console.error('Error al crear usuario admin:', error);
    }
}

// === SEGURIDAD: Función de validación de imágenes Base64 ===
function validateBase64Image(base64String) {
    try {
        // Verificar que es un string válido
        if (!base64String || typeof base64String !== 'string') {
            return { valid: false, error: 'Formato de imagen inválido' };
        }

        // Verificar formato data:image
        const matches = base64String.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
        if (!matches) {
            return { valid: false, error: 'Tipo de imagen no permitido. Solo PNG, JPEG, JPG o WebP.' };
        }

        const imageType = matches[1];
        const base64Data = matches[2];

        // Decodificar el base64
        const buffer = Buffer.from(base64Data, 'base64');

        // Verificar tamaño (máximo 3MB)
        const maxSize = 3 * 1024 * 1024;
        if (buffer.length > maxSize) {
            return { valid: false, error: 'La imagen excede el tamaño máximo de 3MB' };
        }

        // Verificar magic numbers (firmas de archivo) para prevenir uploads maliciosos
        const magicNumbers = {
            'png': [0x89, 0x50, 0x4E, 0x47],
            'jpeg': [0xFF, 0xD8, 0xFF],
            'jpg': [0xFF, 0xD8, 0xFF],
            'webp': [0x52, 0x49, 0x46, 0x46]
        };

        const signature = magicNumbers[imageType];
        if (!signature) {
            return { valid: false, error: 'Tipo de imagen no soportado' };
        }

        // Verificar los primeros bytes del buffer
        for (let i = 0; i < signature.length; i++) {
            if (buffer[i] !== signature[i]) {
                return { valid: false, error: 'El archivo no corresponde al tipo de imagen declarado' };
            }
        }

        // Todo OK
        return { valid: true, imageType, size: buffer.length };

    } catch (error) {
        console.error('Error validando imagen:', error);
        return { valid: false, error: 'Error al procesar la imagen' };
    }
}

// === SEGURIDAD: Función de sanitización de inputs ===
function sanitizeInput(input) {
    if (typeof input === 'string') {
        // Remover caracteres peligrosos
        return input.replace(/[<>\"']/g, '');
    }
    return input;
}


// --- 5. MIDDLEWARES DE AUTENTICACIÓN ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) return res.sendStatus(403);
        
        // Verificar que el usuario sea admin
        const dj = await DJ.findById(user.id);
        if (!dj || dj.role !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
        }
        
        req.user = user;
        next();
    });
};

// --- 6. RUTAS PÚBLICAS ---
app.post('/register', 
    registerLimiter,
    [
        body('username').trim().isLength({ min: 3, max: 30 }).escape(),
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6, max: 100 })
    ],
    async (req, res) => {
        try {
            // Validar inputs
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'Datos inválidos', errors: errors.array() });
            }

            const { username, email, password } = req.body;
            
            // Sanitizar inputs adicionales
            const sanitizedUsername = sanitizeInput(username);
            const sanitizedEmail = sanitizeInput(email);
            
            const existingUser = await DJ.findOne({ $or: [{ username: sanitizedUsername }, { email: sanitizedEmail }] });
            if (existingUser) {
                return res.status(400).json({ message: 'El nombre de usuario o el email ya están en uso.' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const newDJ = new DJ({ 
                username: sanitizedUsername, 
                email: sanitizedEmail, 
                password: hashedPassword 
            });
            await newDJ.save();
            res.status(201).json({ message: '¡Registro exitoso! Ya puedes iniciar sesión.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error en el servidor al registrar.' });
        }
});

app.post('/login', 
    loginLimiter,
    [
        body('username').trim().notEmpty().escape(),
        body('password').notEmpty()
    ],
    async (req, res) => {
        try {
            // Validar inputs
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'Datos inválidos' });
            }

            const { username, password } = req.body;
            const sanitizedUsername = sanitizeInput(username);
            
            const dj = await DJ.findOne({ username: sanitizedUsername });
            if (!dj) {
                return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
            }
            
            const isMatch = await bcrypt.compare(password, dj.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
            }
            
            // SEGURIDAD: Token con expiración reducida a 2 horas
            const token = jwt.sign(
                { id: dj._id, username: dj.username, role: dj.role }, 
                JWT_SECRET, 
                { expiresIn: '2h' }
            );
            
            res.json({ token, role: dj.role });
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ message: 'Error en el servidor.' });
        }
});

app.post('/forgot-password', 
    passwordResetLimiter,
    [
        body('email').isEmail().normalizeEmail()
    ],
    async (req, res) => {
        try {
            // Validar inputs
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'Email inválido' });
            }

            const { email } = req.body;
            const sanitizedEmail = sanitizeInput(email);
            
            const dj = await DJ.findOne({ email: sanitizedEmail });
            if (!dj) {
                return res.json({ message: 'Si tu email está registrado, recibirás un enlace de recuperación.' });
            }
            
            const resetToken = crypto.randomBytes(32).toString('hex');
            dj.passwordResetToken = resetToken;
            dj.passwordResetExpires = Date.now() + 3600000;
            await dj.save();
            
            const resetUrl = `${process.env.APP_BASE_URL}/html/reset-password.html?token=${resetToken}`;
            await transporter.sendMail({
                from: '"DJ Connect App" <alvaropavonmartinez7@gmail.com>',
                to: dj.email,
                subject: 'Recuperación de Contraseña',
                html: `<h1>Recuperación de Contraseña</h1><p>Haz clic en el siguiente enlace para continuar:</p><a href="${resetUrl}">${resetUrl}</a><p>Si no has sido tú, ignora este correo.</p>`
            });
            res.json({ message: 'Si tu email está registrado, recibirás un enlace de recuperación.' });
        } catch (error) {
            console.error('Error en forgot-password:', error);
            res.status(500).json({ message: 'Error en el servidor.' });
        }
});

app.post('/reset-password', 
    passwordResetLimiter,
    [
        body('token').trim().notEmpty(),
        body('password').isLength({ min: 6, max: 100 })
    ],
    async (req, res) => {
        try {
            // Validar inputs
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'Datos inválidos' });
            }

            const { token, password } = req.body;
            const sanitizedToken = sanitizeInput(token);
            
            const dj = await DJ.findOne({
                passwordResetToken: sanitizedToken,
                passwordResetExpires: { $gt: Date.now() }
            });
            
            if (!dj) {
                return res.status(400).json({ message: 'El token no es válido o ha expirado.' });
            }
            
            dj.password = await bcrypt.hash(password, 10);
            dj.passwordResetToken = undefined;
            dj.passwordResetExpires = undefined;
            await dj.save();
            
            res.json({ message: '¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.' });
        } catch (error) {
            console.error('Error en reset-password:', error);
            res.status(500).json({ message: 'Error en el servidor.' });
        }
});

const getSpotifyToken = async () => {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
            }
        });
        spotifyToken = response.data.access_token;
        console.log('✅ Token de Spotify obtenido con éxito.');
    } catch (error) {
        console.error('❌ Error al obtener el token de Spotify:', error.message);
    }
};

app.get('/search', async (req, res) => {
    const query = req.query.q;
    
    // Si Spotify no está disponible, usar datos de ejemplo
    if (!spotifyToken) {
        console.log('⚠️ Spotify no disponible, usando datos de ejemplo');
        const mockSongs = [
            { titulo: `${query} - Canción Rock`, artista: 'Artista Rock', genre: 'rock' },
            { titulo: `${query} - Canción Pop`, artista: 'Artista Pop', genre: 'pop' },
            { titulo: `${query} - Canción Reggaeton`, artista: 'Artista Latino', genre: 'reggaeton' },
            { titulo: `${query} - Canción Electrónica`, artista: 'DJ Electronic', genre: 'electronic' },
            { titulo: `${query} - Canción Hip Hop`, artista: 'MC Rapper', genre: 'hip hop' }
        ];
        return res.json(mockSongs);
    }
    
    try {
        const response = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        
        const tracksWithGenres = await Promise.all(response.data.tracks.items.map(async track => {
            let genre = 'Desconocido';
            try {
                if (track.artists && track.artists.length > 0) {
                    const artistId = track.artists[0].id;
                    const artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
                        headers: { 'Authorization': `Bearer ${spotifyToken}` }
                    });
                    if (artistResponse.data.genres && artistResponse.data.genres.length > 0) {
                        genre = artistResponse.data.genres[0];
                    }
                }
            } catch (err) {
                console.error('Error obteniendo género:', err.message);
            }
            
            return {
                titulo: track.name,
                artista: track.artists.map(artist => artist.name).join(', '),
                genre: genre
            };
        }));
        
        res.json(tracksWithGenres);
    } catch (error) {
        console.error('Error al buscar en Spotify:', error.message);
        // Fallback a datos de ejemplo
        const mockSongs = [
            { titulo: `${query} - Canción Rock`, artista: 'Artista Rock', genre: 'rock' },
            { titulo: `${query} - Canción Pop`, artista: 'Artista Pop', genre: 'pop' },
            { titulo: `${query} - Canción Reggaeton`, artista: 'Artista Latino', genre: 'reggaeton' }
        ];
        res.json(mockSongs);
    }
});

// --- 7. RUTAS DE CONFIGURACIÓN (LOGO) ---
app.get('/api/config/logo', async (req, res) => {
    try {
        const logoConfig = await Config.findOne({ key: 'companyLogo' });
        if (logoConfig && logoConfig.value) {
            res.json({ logoUrl: logoConfig.value });
        } else {
            res.json({ logoUrl: null });
        }
    } catch (error) {
        console.error('Error al obtener logo:', error);
        res.status(500).json({ message: 'Error al obtener logo' });
    }
});

// --- 8. RUTAS DE ADMINISTRADOR ---
app.get('/api/verify-admin', authenticateAdmin, (req, res) => {
    res.json({ message: 'Acceso autorizado' });
});

app.get('/api/admin/me', authenticateAdmin, async (req, res) => {
    try {
        const dj = await DJ.findById(req.user.id).select('-password');
        res.json(dj);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        // Contar DJs (excluyendo admins explícitamente)
        const totalDJs = await DJ.countDocuments({ 
            $or: [
                { role: 'dj' },
                { role: { $exists: false } } // Incluir DJs sin campo role (creados antes)
            ]
        });
        
        const activeParties = await Party.countDocuments({ isActive: true });
        const totalWishlists = await Wishlist.countDocuments({ isActive: true });
        
        console.log('Stats:', { totalDJs, activeParties, totalWishlists });
        
        res.json({
            totalDJs,
            activeParties,
            totalWishlists
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
});

// Gestión de DJs
app.get('/api/admin/djs', authenticateAdmin, async (req, res) => {
    try {
        const djs = await DJ.find({}).select('-password').sort({ createdAt: -1 });
        res.json(djs);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener DJs' });
    }
});

app.post('/api/admin/djs', authenticateAdmin, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const existingUser = await DJ.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario o el email ya están en uso.' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newDJ = new DJ({ username, email, password: hashedPassword, role: 'dj' });
        await newDJ.save();
        
        res.status(201).json({ message: 'DJ creado exitosamente', dj: newDJ });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al crear DJ' });
    }
});

app.patch('/api/admin/djs/:id/password', authenticateAdmin, async (req, res) => {
    try {
        const { password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await DJ.updateOne({ _id: req.params.id }, { password: hashedPassword });
        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al actualizar contraseña' });
    }
});

app.delete('/api/admin/djs/:id', authenticateAdmin, async (req, res) => {
    try {
        const dj = await DJ.findById(req.params.id);
        if (!dj) {
            return res.status(404).json({ message: 'DJ no encontrado' });
        }
        
        if (dj.role === 'admin') {
            return res.status(403).json({ message: 'No se puede eliminar un administrador' });
        }
        
        await DJ.deleteOne({ _id: req.params.id });
        res.json({ message: 'DJ eliminado exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al eliminar DJ' });
    }
});

// Gestión de Fiestas por Admin
app.get('/api/admin/parties', authenticateAdmin, async (req, res) => {
    try {
        const parties = await Party.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(parties);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener fiestas' });
    }
});

app.post('/api/admin/parties', authenticateAdmin, async (req, res) => {
    try {
        const { partyName, djUsername } = req.body;
        
        console.log('Buscando DJ:', djUsername);
        
        // Buscar DJ sin filtro de role primero
        let dj = await DJ.findOne({ username: djUsername });
        
        if (!dj) {
            console.log('DJ no encontrado con username:', djUsername);
            // Listar todos los DJs para debug
            const allDJs = await DJ.find({}).select('username role');
            console.log('DJs disponibles:', allDJs);
            return res.status(404).json({ message: 'DJ no encontrado. Verifica el nombre de usuario.' });
        }
        
        console.log('DJ encontrado:', dj.username, 'role:', dj.role);
        
        // Verificar que no sea admin
        if (dj.role === 'admin') {
            return res.status(400).json({ message: 'No se pueden asignar fiestas a administradores' });
        }
        
        // Verificar límite de fiestas
        if (dj.activePartyIds && dj.activePartyIds.length >= 3) {
            return res.status(400).json({ message: 'Este DJ ya tiene el máximo de 3 fiestas activas' });
        }
        
        // Generar partyId limpio
        const cleanName = partyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const randomString = Math.random().toString(36).substring(2, 8);
        const partyId = `${cleanName}-${randomString}`;
        
        // Crear la fiesta
        const newParty = new Party({
            partyId,
            djUsername,
            songRequests: []
        });
        await newParty.save();
        
        // Agregar a las fiestas activas del DJ
        await DJ.updateOne(
            { _id: dj._id },
            { $push: { activePartyIds: partyId }, $inc: { partyCount: 1 } }
        );
        
        res.status(201).json({ message: 'Fiesta creada y asignada exitosamente', party: newParty });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al crear fiesta' });
    }
});

app.post('/api/admin/parties/:partyId/end', authenticateAdmin, async (req, res) => {
    try {
        const { partyId } = req.params;
        const { djUsername } = req.body;
        
        const party = await Party.findOne({ partyId });
        if (!party) {
            return res.status(404).json({ message: 'Fiesta no encontrada' });
        }
        
        // Calcular estadísticas
        const totalSongs = party.songRequests.length;
        
        const genreCounts = {};
        party.songRequests.forEach(song => {
            const genre = song.genre || 'Desconocido';
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
        
        let topGenre = 'Desconocido';
        let maxCount = 0;
        for (const [genre, count] of Object.entries(genreCounts)) {
            if (count > maxCount) {
                maxCount = count;
                topGenre = genre;
            }
        }
        
        party.isActive = false;
        party.endDate = new Date();
        party.totalSongs = totalSongs;
        party.topGenre = topGenre;
        await party.save();
        
        // Remover de las fiestas activas del DJ
        await DJ.updateOne(
            { username: djUsername },
            { $pull: { activePartyIds: partyId } }
        );
        
        res.json({ message: 'Fiesta finalizada exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al finalizar fiesta' });
    }
});

// Gestión de Wishlists por Admin
app.get('/api/admin/wishlists', authenticateAdmin, async (req, res) => {
    try {
        const wishlists = await Wishlist.find({}).sort({ createdAt: -1 });
        res.json(wishlists);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener wishlists' });
    }
});

app.post('/api/admin/wishlists', authenticateAdmin, async (req, res) => {
    try {
        const { name, description, eventDate, djUsername } = req.body;
        
        console.log('Buscando DJ para wishlist:', djUsername);
        
        // Buscar DJ sin filtro de role primero
        const dj = await DJ.findOne({ username: djUsername });
        
        if (!dj) {
            console.log('DJ no encontrado con username:', djUsername);
            return res.status(404).json({ message: 'DJ no encontrado. Verifica el nombre de usuario.' });
        }
        
        console.log('DJ encontrado para wishlist:', dj.username, 'role:', dj.role);
        
        // Verificar que no sea admin
        if (dj.role === 'admin') {
            return res.status(400).json({ message: 'No se pueden asignar wishlists a administradores' });
        }
        
        const cleanName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const randomString = Math.random().toString(36).substring(2, 8);
        const wishlistId = `wish-${cleanName}-${randomString}`;
        
        const newWishlist = new Wishlist({
            wishlistId,
            name,
            description: description || '',
            djUsername,
            eventDate: eventDate ? new Date(eventDate) : null
        });
        
        await newWishlist.save();
        res.status(201).json(newWishlist);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al crear wishlist' });
    }
});

// === SEGURIDAD: Subir logo con validación estricta ===
app.post('/api/admin/config/logo', 
    authenticateAdmin,
    uploadLimiter,
    [
        body('logoData').notEmpty()
    ],
    async (req, res) => {
        try {
            // Validar inputs
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'No se proporcionó imagen' });
            }

            const { logoData } = req.body;
            
            // SEGURIDAD: Validar que sea una imagen base64 válida y segura
            const validation = validateBase64Image(logoData);
            if (!validation.valid) {
                console.warn('Intento de subida de archivo inválido:', validation.error);
                return res.status(400).json({ message: validation.error });
            }
            
            console.log(`✅ Imagen validada: tipo=${validation.imageType}, tamaño=${validation.size} bytes`);
            
            // Guardar en la base de datos
            await Config.findOneAndUpdate(
                { key: 'companyLogo' },
                { key: 'companyLogo', value: logoData, updatedAt: new Date() },
                { upsert: true, new: true }
            );
            
            res.json({ message: 'Logo actualizado exitosamente', logoUrl: logoData });
        } catch (error) {
            console.error('Error al guardar logo:', error);
            res.status(500).json({ message: 'Error al guardar logo' });
        }
});

// --- 9. RUTAS DE DJ ---
app.get('/api/ranking', authenticateToken, async (req, res) => {
    try {
        // Buscar DJs (excluir admins explícitamente)
        const djs = await DJ.find({ 
            $or: [
                { role: 'dj' },
                { role: { $exists: false } }
            ]
        }, 'username partyCount ratings');
        
        console.log(`Ranking: encontrados ${djs.length} DJs`);
        
        const ranking = djs.map(dj => {
            const totalRatings = dj.ratings ? dj.ratings.length : 0;
            const sumOfRatings = dj.ratings ? dj.ratings.reduce((acc, r) => acc + r.value, 0) : 0;
            const averageRating = totalRatings > 0 ? (sumOfRatings / totalRatings).toFixed(2) : 'Sin valoraciones';
            
            return {
                username: dj.username,
                partyCount: dj.partyCount || 0,
                averageRating: averageRating,
                totalRatings: totalRatings
            };
        }).sort((a, b) => {
            if (a.averageRating === 'Sin valoraciones') return 1;
            if (b.averageRating === 'Sin valoraciones') return -1;
            return b.averageRating - a.averageRating;
        });
        res.json(ranking);
    } catch (error) {
        res.status(500).send('Error al obtener el ranking');
    }
});

app.get('/api/active-party', authenticateToken, async (req, res) => {
    try {
        const dj = await DJ.findById(req.user.id);
        if (!dj) {
            return res.status(404).json({ message: 'DJ no encontrado.' });
        }
        res.json({ activePartyIds: dj.activePartyIds || [] });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Obtener perfil del DJ
app.get('/api/dj/profile', authenticateToken, async (req, res) => {
    try {
        const dj = await DJ.findById(req.user.id).select('-password');
        if (!dj) {
            return res.status(404).json({ message: 'DJ no encontrado.' });
        }
        res.json(dj);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Actualizar Instagram del DJ
app.patch('/api/dj/instagram', authenticateToken, async (req, res) => {
    try {
        const { instagram } = req.body;
        
        // Validar formato de Instagram (opcional)
        const cleanInstagram = instagram.trim().replace('@', '');
        
        await DJ.updateOne(
            { _id: req.user.id },
            { instagram: cleanInstagram }
        );
        
        res.json({ message: 'Instagram actualizado exitosamente', instagram: cleanInstagram });
    } catch (error) {
        console.error('Error al actualizar Instagram:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

app.post('/api/end-party', authenticateToken, async (req, res) => {
    try {
        const { partyId } = req.body;
        
        const dj = await DJ.findById(req.user.id);
        if (!dj || !dj.activePartyIds || !dj.activePartyIds.includes(partyId)) {
            return res.status(400).json({ message: 'No tienes acceso a esta fiesta.' });
        }
        
        const party = await Party.findOne({ partyId });
        if (party) {
            const totalSongs = party.songRequests.length;
            
            const genreCounts = {};
            party.songRequests.forEach(song => {
                const genre = song.genre || 'Desconocido';
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
            let topGenre = 'Desconocido';
            let maxCount = 0;
            for (const [genre, count] of Object.entries(genreCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    topGenre = genre;
                }
            }
            
            const partyRatings = dj.ratings.filter(r => 
                r.date >= party.createdAt && (!party.endDate || r.date <= party.endDate)
            );
            const averageRating = partyRatings.length > 0 
                ? partyRatings.reduce((acc, r) => acc + r.value, 0) / partyRatings.length 
                : 0;
            
            party.isActive = false;
            party.endDate = new Date();
            party.totalSongs = totalSongs;
            party.topGenre = topGenre;
            party.averageRating = parseFloat(averageRating.toFixed(2));
            await party.save();
        }
        
        await DJ.updateOne({ _id: req.user.id }, { $pull: { activePartyIds: partyId } });
        res.json({ message: 'Fiesta finalizada con éxito.' });
    } catch (error) {
        console.error('Error al finalizar fiesta:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

app.get('/api/party-history', authenticateToken, async (req, res) => {
    try {
        const parties = await Party.find({ 
            djUsername: req.user.username,
            isActive: false 
        }).sort({ endDate: -1 });
        
        res.json(parties);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// ===== RUTAS DE WISHLISTS PRE-EVENTO =====

// Crear nueva wishlist (DJ)
app.post('/api/wishlists', authenticateToken, async (req, res) => {
    try {
        const { name, description, eventDate } = req.body;
        
        const cleanName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const randomString = Math.random().toString(36).substring(2, 8);
        const wishlistId = `wish-${cleanName}-${randomString}`;
        
        const newWishlist = new Wishlist({
            wishlistId,
            name,
            description: description || '',
            djUsername: req.user.username,
            eventDate: eventDate ? new Date(eventDate) : null
        });
        
        await newWishlist.save();
        res.status(201).json(newWishlist);
    } catch (error) {
        console.error('Error al crear wishlist:', error);
        res.status(500).json({ message: 'Error al crear wishlist.' });
    }
});

// Obtener wishlists del DJ
app.get('/api/wishlists', authenticateToken, async (req, res) => {
    try {
        const wishlists = await Wishlist.find({ 
            djUsername: req.user.username 
        }).sort({ createdAt: -1 });
        
        res.json(wishlists);
    } catch (error) {
        console.error('Error al obtener wishlists:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Obtener una wishlist específica (público para invitados)
app.get('/api/wishlists/:wishlistId', async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ 
            wishlistId: req.params.wishlistId,
            isActive: true 
        });
        
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist no encontrada o cerrada.' });
        }
        
        res.json(wishlist);
    } catch (error) {
        console.error('Error al obtener wishlist:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Agregar canción a wishlist (público para invitados)
app.post('/api/wishlists/:wishlistId/songs', async (req, res) => {
    try {
        const { titulo, artista, genre, addedBy } = req.body;
        const { wishlistId } = req.params;
        
        const wishlist = await Wishlist.findOne({ 
            wishlistId,
            isActive: true 
        });
        
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist no encontrada o cerrada.' });
        }
        
        const newSong = {
            _id: new mongoose.Types.ObjectId(),
            titulo,
            artista,
            genre: genre || 'Desconocido',
            addedBy: addedBy || 'Invitado',
            timestamp: new Date()
        };
        
        wishlist.songs.push(newSong);
        await wishlist.save();
        
        // Emitir evento Socket.IO para actualización en tiempo real
        io.to(`wishlist-${wishlistId}`).emit('wishlist-song-added', newSong);
        console.log(`🎵 Nueva canción añadida a wishlist [${wishlistId}]: ${titulo}`);
        
        res.status(201).json(newSong);
    } catch (error) {
        console.error('Error al agregar canción:', error);
        res.status(500).json({ message: 'Error al agregar canción.' });
    }
});

// Eliminar canción de wishlist (solo DJ o Admin)
app.delete('/api/wishlists/:wishlistId/songs/:songId', authenticateToken, async (req, res) => {
    try {
        const { wishlistId, songId } = req.params;
        
        const wishlist = await Wishlist.findOne({ wishlistId });
        
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist no encontrada.' });
        }
        
        // Verificar permisos (DJ dueño o admin)
        const user = await DJ.findById(req.user.id);
        if (wishlist.djUsername !== req.user.username && user.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permiso para editar esta wishlist.' });
        }
        
        wishlist.songs = wishlist.songs.filter(song => song._id.toString() !== songId);
        await wishlist.save();
        
        // Emitir evento Socket.IO para actualización en tiempo real
        io.to(`wishlist-${wishlistId}`).emit('wishlist-song-deleted', songId);
        console.log(`🗑️ Canción eliminada de wishlist [${wishlistId}]: ${songId}`);
        
        res.json({ message: 'Canción eliminada.' });
    } catch (error) {
        console.error('Error al eliminar canción:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Cerrar/Activar wishlist (solo DJ o Admin)
app.patch('/api/wishlists/:wishlistId/toggle', authenticateToken, async (req, res) => {
    try {
        const { wishlistId } = req.params;
        
        const wishlist = await Wishlist.findOne({ wishlistId });
        
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist no encontrada.' });
        }
        
        // Verificar permisos
        const user = await DJ.findById(req.user.id);
        if (wishlist.djUsername !== req.user.username && user.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permiso para editar esta wishlist.' });
        }
        
        wishlist.isActive = !wishlist.isActive;
        await wishlist.save();
        
        res.json(wishlist);
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Eliminar wishlist (solo DJ o Admin)
app.delete('/api/wishlists/:wishlistId', authenticateToken, async (req, res) => {
    try {
        const { wishlistId } = req.params;
        
        const wishlist = await Wishlist.findOne({ wishlistId });
        
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist no encontrada.' });
        }
        
        // Verificar permisos
        const user = await DJ.findById(req.user.id);
        if (wishlist.djUsername !== req.user.username && user.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permiso para eliminar esta wishlist.' });
        }
        
        await Wishlist.deleteOne({ wishlistId });
        
        res.json({ message: 'Wishlist eliminada.' });
    } catch (error) {
        console.error('Error al eliminar wishlist:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// --- 10. LÓGICA DE SOCKET.IO ---
io.on('connection', (socket) => {
    console.log(`🔌 Un cliente se ha conectado: ${socket.id}`);

    // Unirse a una sala de wishlist (público)
    socket.on('join-wishlist-room', (wishlistId) => {
        socket.join(`wishlist-${wishlistId}`);
        console.log(`📋 Cliente ${socket.id} se unió a la sala de wishlist: ${wishlistId}`);
    });

    // Salir de una sala de wishlist
    socket.on('leave-wishlist-room', (wishlistId) => {
        socket.leave(`wishlist-${wishlistId}`);
        console.log(`📋 Cliente ${socket.id} salió de la sala de wishlist: ${wishlistId}`);
    });

    socket.on('join-dj-room', async (partyId) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return console.error(`Intento de unión a la sala ${partyId} sin token.`);
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const djUsername = decoded.username;
            socket.join(partyId);
            console.log(`🎧 DJ ${djUsername} se ha unido a su sala: ${partyId}`);
            
            // Verificar si el DJ tiene esta fiesta activa, si no, agregarla
            const dj = await DJ.findOne({ username: djUsername });
            if (!dj.activePartyIds || !dj.activePartyIds.includes(partyId)) {
                // Verificar límite
                if (dj.activePartyIds && dj.activePartyIds.length >= 3) {
                    socket.emit('error', 'Has alcanzado el límite de 3 fiestas simultáneas.');
                    return;
                }
                await DJ.updateOne({ username: djUsername }, { $push: { activePartyIds: partyId } });
            }
    
            const party = await Party.findOneAndUpdate(
                { partyId: partyId },
                { $setOnInsert: { partyId: partyId, djUsername: djUsername } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            
            if (party.songRequests.length === 0) {
                await DJ.findOneAndUpdate({ username: djUsername }, { $inc: { partyCount: 1 } });
            }
            
            socket.emit('load-initial-songs', party.songRequests);
        } catch (err) {
            console.error(`Error de autenticación o DB para la sala ${partyId}:`, err.message);
            socket.emit('auth_error', 'Tu sesión no es válida.');
        }
    });

    socket.on('nueva-cancion', async (peticion) => {
        const { salaId, titulo, artista, genre } = peticion;
        const songId = new mongoose.Types.ObjectId();
        const cancionConHora = {
            _id: songId,
            titulo: titulo,
            artista: artista,
            hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            genre: genre || 'Desconocido',
            hidden: false
        };
        try {
            await Party.updateOne({ partyId: salaId }, { $push: { songRequests: cancionConHora } });
            console.log(`🎵 Nueva petición para la sala [${salaId}]: ${titulo} - Género: ${genre}`);
            io.to(salaId).emit('recibir-cancion', cancionConHora);
        } catch (error) {
            console.error('Error al guardar la canción:', error);
        }
    });

    socket.on('submit-rating', async (data) => {
        try {
            const { partyId, rating } = data;
            const party = await Party.findOne({ partyId: partyId });
            if (party) {
                const djUsername = party.djUsername;
                await DJ.findOneAndUpdate(
                    { username: djUsername },
                    { $push: { ratings: { value: rating } } }
                );
                console.log(`⭐ Puntuación de [${rating}] recibida para el DJ [${djUsername}]`);
            }
        } catch (error) {
            console.error('Error al guardar la puntuación:', error);
        }
    });
    
    socket.on('mark-song-as-played', async (data) => {
        const { partyId, songId } = data;
        try {
            await Party.updateOne(
                { "partyId": partyId, "songRequests._id": songId },
                { "$set": { "songRequests.$.played": true } }
            );
            console.log(`✅ Canción ${songId} marcada como puesta en la fiesta ${partyId}`);
            io.to(partyId).emit('song-was-played', songId);
        } catch (error) {
            console.error('Error al marcar la canción como puesta:', error);
        }
    });

    socket.on('hide-song', async (data) => {
        const { partyId, songId } = data;
        try {
            await Party.updateOne(
                { "partyId": partyId, "songRequests._id": songId },
                { "$set": { "songRequests.$.hidden": true } }
            );
            console.log(`🚫 Canción ${songId} ocultada en la fiesta ${partyId}`);
            io.to(partyId).emit('song-was-hidden', songId);
        } catch (error) {
            console.error('Error al ocultar la canción:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Un cliente se ha desconectado: ${socket.id}`);
    });
});

// --- 11. INICIAR EL SERVIDOR Y SERVICIOS ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor listo y escuchando en http://0.0.0.0:${PORT}`);
    getSpotifyToken();
    setInterval(getSpotifyToken, 1000 * 60 * 50);
});
