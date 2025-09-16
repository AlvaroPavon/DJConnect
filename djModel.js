// djModel.js
const mongoose = require('mongoose');

const djSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    
    partyCount: { type: Number, default: 0 },
    ratings: [{
        value: Number,
        date: { type: Date, default: Date.now }
    }],
    
    // --- CAMPO NUEVO ---
    // Guardará el ID de la fiesta que está activa en este momento.
    activePartyId: { type: String, default: null }
});

module.exports = mongoose.model('DJ', djSchema);
