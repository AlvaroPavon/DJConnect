const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Conectar a la BD correcta según .env
mongoose.connect('mongodb://localhost:27017/djapp');

const djSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['dj', 'admin'], default: 'dj' },
    instagram: { type: String, default: '' },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    partyCount: { type: Number, default: 0 },
    ratings: [{
        value: Number,
        date: { type: Date, default: Date.now }
    }],
    activePartyIds: { type: [String], default: [] },
    maxSimultaneousParties: { type: Number, default: 3 }
});

const DJ = mongoose.model('DJ', djSchema, 'djs');

async function createTestDJ() {
    try {
        // Verificar si ya existe
        const existing = await DJ.findOne({ username: 'testdj' });
        if (existing) {
            console.log('✅ DJ de prueba ya existe: username=testdj, password=test123');
            process.exit(0);
        }

        // Crear DJ de prueba
        const hashedPassword = await bcrypt.hash('test123', 10);
        const testDJ = new DJ({
            username: 'testdj',
            email: 'test@test.com',
            password: hashedPassword,
            role: 'dj',
            instagram: ''
        });

        await testDJ.save();
        console.log('✅ DJ de prueba creado: username=testdj, password=test123');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestDJ();
