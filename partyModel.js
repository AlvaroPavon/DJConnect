// partyModel.js
const mongoose = require('mongoose');

const songRequestSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    artista: { type: String, required: true },
    hora: { type: String, required: true },
    played: { type: Boolean, default: false }
});

const partySchema = new mongoose.Schema({
    partyId: { type: String, required: true, unique: true, index: true },
    djUsername: { type: String, required: true },
    songRequests: [songRequestSchema]
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);