// wishlistModel.js
const mongoose = require('mongoose');

const wishlistSongSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    artista: { type: String, required: true },
    genre: { type: String, default: 'Desconocido' },
    addedBy: { type: String, default: 'Invitado' },
    timestamp: { type: Date, default: Date.now }
});

const wishlistSchema = new mongoose.Schema({
    wishlistId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    djUsername: { type: String, required: true },
    description: { type: String, default: '' },
    songs: [wishlistSongSchema],
    isActive: { type: Boolean, default: true },
    eventDate: { type: Date },
    maxSongsPerUser: { type: Number, default: 3 }
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
