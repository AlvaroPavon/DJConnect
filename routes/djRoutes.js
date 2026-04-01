/**
 * =========================================================================
 * ENRUTADOR DE DJ Y PARTY (djRoutes.js)
 * Función: Agrupa los endpoints que un DJ autenticado usa:
 * (perfil, su fiesta activa, ranking) y búsqueda de canciones (público).
 * =========================================================================
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const DJ = require('../djModel.js');
const Party = require('../partyModel.js');
const { authenticateToken } = require('../middlewares/auth');
const { guestLimiter } = require('../middlewares/rateLimiter');

/**
 * [GET] /api/search (Invitados buscando canciones)
 * Límite permisivo (guestLimiter). Conecta con Spotify si hay Token activo o devuelve fallback.
 */
router.get('/search', guestLimiter, async (req, res) => {
    const query = req.query.q;
    // req.app.get('spotifyToken') se injecta en server.js 
    const spotifyToken = req.app.get('spotifyToken'); 

    // MOCK DATA si Spotify no está online
    if (!spotifyToken) {
        console.log('⚠️ Spotify no disponible, usando datos simulados');
        return res.json([
            { titulo: `${query} - Rock`, artista: 'Banda Local', genre: 'rock' },
            { titulo: `${query} ` + req.app.get('mockSuffix', 'Pop'), artista: 'Pop Star', genre: 'pop' }
        ]);
    }
    
    try {
        const response = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        
        // Mapeamos los resultados (con Promesas para obtener el género del artista base)
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
            } catch (ignore) {} // Fallo silencioso del género (la UI admite unknown)
            
            return {
                titulo: track.name,
                artista: track.artists.map(artist => artist.name).join(', '),
                genre: genre
            };
        }));
        
        res.json(tracksWithGenres);
    } catch (error) {
        console.error('Error Spotify API API:', error.message);
        res.status(500).json([{ titulo: `${query} - Mix Local`, artista: 'DJ Anónimo', genre: 'electronic' }]);
    }
});

/**
 * [GET] /api/ranking
 * Obtener lista de DJs organizados por valoración (Stars)
 */
router.get('/ranking', authenticateToken, async (req, res) => {
    try {
        const djs = await DJ.find({ $or: [{ role: 'dj' }, { role: { $exists: false } }] }, 'username partyCount ratings');
        const ranking = djs.map(dj => {
            const tRatings = dj.ratings ? dj.ratings.length : 0;
            const sumStars = dj.ratings ? dj.ratings.reduce((a, r) => a + r.value, 0) : 0;
            const avg = tRatings > 0 ? (sumStars / tRatings).toFixed(2) : 'Sin valoraciones';
            return {
                username: dj.username,
                partyCount: dj.partyCount || 0,
                averageRating: avg,
                totalRatings: tRatings
            };
        }).sort((a, b) => {
            if (a.averageRating === 'Sin valoraciones') return 1;
            if (b.averageRating === 'Sin valoraciones') return -1;
            return b.averageRating - a.averageRating;
        });
        res.json(ranking);
    } catch (e) {
        res.status(500).send('Error Ranking');
    }
});

/**
 * [GET] Perfil propio del DJ / Instagram
 */
router.get('/dj/profile', authenticateToken, async (req, res) => {
    try {
        const dj = await DJ.findById(req.user.id).select('-password');
        res.json(dj);
    } catch (e) {
        res.status(500).json({ message: 'Error server' });
    }
});

router.patch('/dj/instagram', authenticateToken, async (req, res) => {
    try {
        const { instagram } = req.body;
        const cleanInstagram = instagram.trim().replace('@', '');
        await DJ.updateOne({ _id: req.user.id }, { instagram: cleanInstagram });
        res.json({ message: 'Instagram OK', instagram: cleanInstagram });
    } catch (e) {
        res.status(500).json({ message: 'Error update IG' });
    }
});

/**
 * [GET] Historial de Fiestas y Fiestas Activas
 */
router.get('/active-party', authenticateToken, async (req, res) => {
    try {
        const dj = await DJ.findById(req.user.id);
        res.json({ activePartyIds: dj ? (dj.activePartyIds || []) : [] });
    } catch (e) {
        res.status(500).json({ message: 'Error Server' });
    }
});

router.get('/party-history', authenticateToken, async (req, res) => {
    try {
        const parties = await Party.find({ djUsername: req.user.username, isActive: false }).sort({ endDate: -1 });
        res.json(parties);
    } catch (e) {
        res.status(500).json({ message: 'Error Server' });
    }
});

/**
 * [POST] Cierre de fiesta por el DJ
 */
router.post('/end-party', authenticateToken, async (req, res) => {
    try {
        const { partyId } = req.body;
        const dj = await DJ.findById(req.user.id);
        
        if (!dj || !dj.activePartyIds || !dj.activePartyIds.includes(partyId)) {
            return res.status(400).json({ message: 'Denegado' });
        }
        
        const party = await Party.findOne({ partyId });
        if (party) {
            party.isActive = false;
            party.endDate = new Date();
            await party.save();
        }
        
        await DJ.updateOne({ _id: req.user.id }, { $pull: { activePartyIds: partyId } });
        res.json({ message: 'Fiesta cerrada.' });
    } catch (e) {
        res.status(500).json({ message: 'Fallo al finalizar.' });
    }
});

module.exports = router;
