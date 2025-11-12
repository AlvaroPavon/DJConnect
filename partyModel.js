// partyModel.js
const mongoose = require('mongoose');

const songRequestSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    artista: { type: String, required: true },
    hora: { type: String, required: true },
    played: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    genre: { type: String, default: 'Desconocido' }
});

const partySchema = new mongoose.Schema({
    partyId: { type: String, required: true, unique: true, index: true },
    djUsername: { type: String, required: true },
    songRequests: [songRequestSchema],
    isActive: { type: Boolean, default: true },
    endDate: { type: Date },
    totalSongs: { type: Number, default: 0 },
    topGenre: { type: String },
    averageRating: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema, 'parties');