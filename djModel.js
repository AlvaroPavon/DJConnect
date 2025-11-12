// djModel.js
const mongoose = require('mongoose');

const djSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // Nuevo campo para roles
    role: { type: String, enum: ['dj', 'admin'], default: 'dj' },
    
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    
    partyCount: { type: Number, default: 0 },
    ratings: [{
        value: Number,
        date: { type: Date, default: Date.now }
    }],
    
    // Cambiado de activePartyId (string) a activePartyIds (array de strings)
    activePartyIds: { type: [String], default: [] },
    
    // Límite de fiestas simultáneas
    maxSimultaneousParties: { type: Number, default: 3 }
});

module.exports = mongoose.model('DJ', djSchema);
