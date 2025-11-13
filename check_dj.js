const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/dj-connect');

const djSchema = new mongoose.Schema({
    username: String,
    email: String,
    instagram: String
});

const DJ = mongoose.model('DJ', djSchema, 'djs');

async function checkDJ() {
    try {
        const dj = await DJ.findOne({ username: 'testdj' });
        console.log('DJ encontrado:', dj);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkDJ();
