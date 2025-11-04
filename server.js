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
const Wishlist = require('./wishlistModel.js');

// --- 2. CONFIGURACIÓN INICIAL ---
const app = express();
const server = http.createServer(app);

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
    methods: ["GET", "POST"],
    credentials: true
};
app.use(cors(corsOptions));
const io = new Server(server, {
  cors: corsOptions
});

app.use(express.static('public'));
app.use(express.json());

// --- LÍNEA MODIFICADA ---
// La ruta raíz ahora siempre redirige a la página de login dentro de la carpeta html.
app.get('/', (req, res) => {
    res.redirect('/html/login.html');
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
        const resetUrl = `${process.env.APP_BASE_URL}/html/reset-password.html?token=${resetToken}`;
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
        const dj = await DJ.findById(req.user.id);
        if (!dj || !dj.activePartyId) {
            return res.status(400).json({ message: 'No hay una fiesta activa.' });
        }
        
        const party = await Party.findOne({ partyId: dj.activePartyId });
        if (party) {
            // Calcular estadísticas
            const totalSongs = party.songRequests.length;
            
            // Calcular género más pedido
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
            
            // Calcular valoración media de esta fiesta específica
            const partyRatings = dj.ratings.filter(r => 
                r.date >= party.createdAt && (!party.endDate || r.date <= party.endDate)
            );
            const averageRating = partyRatings.length > 0 
                ? partyRatings.reduce((acc, r) => acc + r.value, 0) / partyRatings.length 
                : 0;
            
            // Actualizar la fiesta con las estadísticas
            party.isActive = false;
            party.endDate = new Date();
            party.totalSongs = totalSongs;
            party.topGenre = topGenre;
            party.averageRating = parseFloat(averageRating.toFixed(2));
            await party.save();
        }
        
        await DJ.updateOne({ _id: req.user.id }, { activePartyId: null });
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

// Crear nueva wishlist
app.post('/api/wishlists', authenticateToken, async (req, res) => {
    try {
        const { name, description, eventDate } = req.body;
        
        // Generar ID único para la wishlist
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
        
        res.status(201).json(newSong);
    } catch (error) {
        console.error('Error al agregar canción:', error);
        res.status(500).json({ message: 'Error al agregar canción.' });
    }
});

// Eliminar canción de wishlist (solo DJ)
app.delete('/api/wishlists/:wishlistId/songs/:songId', authenticateToken, async (req, res) => {
    try {
        const { wishlistId, songId } = req.params;
        
        const wishlist = await Wishlist.findOne({ 
            wishlistId,
            djUsername: req.user.username 
        });
        
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist no encontrada.' });
        }
        
        wishlist.songs = wishlist.songs.filter(song => song._id.toString() !== songId);
        await wishlist.save();
        
        res.json({ message: 'Canción eliminada.' });
    } catch (error) {
        console.error('Error al eliminar canción:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Cerrar/Activar wishlist (solo DJ)
app.patch('/api/wishlists/:wishlistId/toggle', authenticateToken, async (req, res) => {
    try {
        const { wishlistId } = req.params;
        
        const wishlist = await Wishlist.findOne({ 
            wishlistId,
            djUsername: req.user.username 
        });
        
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist no encontrada.' });
        }
        
        wishlist.isActive = !wishlist.isActive;
        await wishlist.save();
        
        res.json(wishlist);
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Eliminar wishlist (solo DJ)
app.delete('/api/wishlists/:wishlistId', authenticateToken, async (req, res) => {
    try {
        const { wishlistId } = req.params;
        
        const result = await Wishlist.deleteOne({ 
            wishlistId,
            djUsername: req.user.username 
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Wishlist no encontrada.' });
        }
        
        res.json({ message: 'Wishlist eliminada.' });
    } catch (error) {
        console.error('Error al eliminar wishlist:', error);
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

// --- 7. INICIAR EL SERVIDOR Y SERVICIOS ---
const PORT = process.env.PORT || 8001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor listo y escuchando en http://0.0.0.0:${PORT}`);
    getSpotifyToken();
    setInterval(getSpotifyToken, 1000 * 60 * 50);
});