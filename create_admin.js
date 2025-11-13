const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/djapp');

const djSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['dj', 'admin'], default: 'dj' },
    instagram: { type: String, default: '' },
    partyCount: { type: Number, default: 0 },
    ratings: [],
    activePartyIds: { type: [String], default: [] },
    maxSimultaneousParties: { type: Number, default: 3 }
});

const DJ = mongoose.model('DJ', djSchema, 'djs');

async function createAdmin() {
    try {
        const existing = await DJ.findOne({ username: 'admin' });
        if (existing) {
            console.log('✅ Admin ya existe: username=admin, password=admin123');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new DJ({
            username: 'admin',
            email: 'admin@test.com',
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin creado: username=admin, password=admin123');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdmin();
