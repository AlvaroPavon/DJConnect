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

// Modelos de la base de datos
const DJ = require('./djModel.js');
const Party = require('./partyModel.js');

// --- 2. CONFIGURACIÓN INICIAL ---
const app = express();
const server = http.createServer(app);

// Opciones de CORS
const corsOptions = {
    origin: ["http://localhost:3000", "https://localhost", "https://djapp.duckdns.org", "http://localhost:5173"],
    methods: ["GET", "POST"]
};
app.use(cors(corsOptions));
const io = new Server(server, {
  cors: corsOptions
});

app.use(express.static('public'));
app.use(express.json());

// --- LÍNEA MODIFICADA ---
// La ruta raíz ahora siempre redirige a la página de login.
app.get('/', (req, res) => {
    res.redirect('/login.html');
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
    .then(() => console.log('✅ Conectado a la base de datos'))
    .catch(err => console.error('❌ Error al conectar a la base de datos:', err));

// --- 5. RUTAS Y LÓGICA DE LA API ---
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await DJ.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario o el email ya están en uso.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newDJ = new DJ({ username, email, password: hashedPassword });
        await newDJ.save();
        res.status(201).json({ message: '¡Registro exitoso! Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al registrar.' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const dj = await DJ.findOne({ username });
        if (!dj) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
        }
        const isMatch = await bcrypt.compare(password, dj.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
        }
        const token = jwt.sign({ id: dj._id, username: dj.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const dj = await DJ.findOne({ email });
        if (!dj) {
            return res.json({ message: 'Si tu email está registrado, recibirás un enlace de recuperación.' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        dj.passwordResetToken = resetToken;
        dj.passwordResetExpires = Date.now() + 3600000;
        await dj.save();
        const resetUrl = `${process.env.APP_BASE_URL}/reset-password.html?token=${resetToken}`;
        await transporter.sendMail({
            from: '"DJ Connect App" <alvaropavonmartinez7@gmail.com>',
            to: dj.email,
            subject: 'Recuperación de Contraseña',
            html: `<h1>Recuperación de Contraseña</h1><p>Haz clic en el siguiente enlace para continuar:</p><a href="${resetUrl}">${resetUrl}</a><p>Si no has sido tú, ignora este correo.</p>`
        });
        res.json({ message: 'Si tu email está registrado, recibirás un enlace de recuperación.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

app.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const dj = await DJ.findOne({
            passwordResetToken: token,
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
    if (!spotifyToken) {
        return res.status(503).json({ error: 'Servicio de búsqueda no disponible.' });
    }
    const query = req.query.q;
    try {
        const response = await axios.get(`https://api.spotify.com/v1/search?q=$${encodeURIComponent(query)}&type=track&limit=10`, {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        const tracks = response.data.tracks.items.map(track => ({
            titulo: track.name,
            artista: track.artists.map(artist => artist.name).join(', ')
        }));
        res.json(tracks);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar en Spotify.' });
    }
});

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

app.get('/ranking', authenticateToken, async (req, res) => {
    try {
        const djs = await DJ.find({}, 'username partyCount ratings');
        const ranking = djs.map(dj => {
            const totalRatings = dj.ratings.length;
            const sumOfRatings = dj.ratings.reduce((acc, r) => acc + r.value, 0);
            const averageRating = totalRatings > 0 ? (sumOfRatings / totalRatings).toFixed(2) : 'Sin valoraciones';
            
            return {
                username: dj.username,
                partyCount: dj.partyCount,
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
        res.json({ activePartyId: dj.activePartyId });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

app.post('/api/end-party', authenticateToken, async (req, res) => {
    try {
        await DJ.updateOne({ _id: req.user.id }, { activePartyId: null });
        res.json({ message: 'Fiesta finalizada con éxito.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// --- 6. LÓGICA DE SOCKET.IO ---
io.on('connection', (socket) => {
    console.log(`🔌 Un cliente se ha conectado: ${socket.id}`);

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
            
            await DJ.updateOne({ username: djUsername }, { activePartyId: partyId });
    
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
        const { salaId, titulo, artista } = peticion;
        const songId = new mongoose.Types.ObjectId();
        const cancionConHora = {
            _id: songId,
            titulo: titulo,
            artista: artista,
            hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };
        try {
            await Party.updateOne({ partyId: salaId }, { $push: { songRequests: cancionConHora } });
            console.log(`🎵 Nueva petición para la sala [${salaId}]: ${titulo}`);
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

    socket.on('disconnect', () => {
        console.log(`🔌 Un cliente se ha desconectado: ${socket.id}`);
    });
});

// --- 7. INICIAR EL SERVIDOR Y SERVICIOS ---
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor listo y escuchando en http://localhost:${PORT}`);
    getSpotifyToken();
    setInterval(getSpotifyToken, 1000 * 60 * 50);
});
