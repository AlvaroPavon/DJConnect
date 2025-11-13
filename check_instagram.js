const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/djapp');

const djSchema = new mongoose.Schema({}, { strict: false });
const DJ = mongoose.model('DJ', djSchema, 'djs');

async function checkInstagram() {
    try {
        const dj = await DJ.findOne({ username: 'testdj' });
        if (dj) {
            console.log('✅ DJ encontrado:');
            console.log('  Username:', dj.username);
            console.log('  Instagram:', dj.instagram || '(vacío)');
        } else {
            console.log('❌ DJ no encontrado');
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkInstagram();
