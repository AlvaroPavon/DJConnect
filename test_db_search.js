const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/dj-connect');

const djSchema = new mongoose.Schema({}, { strict: false });
const DJ = mongoose.model('DJ', djSchema, 'djs');

async function test() {
    try {
        console.log('1. Listando todos los DJs:');
        const allDJs = await DJ.find({});
        console.log('Total DJs:', allDJs.length);
        allDJs.forEach(dj => {
            console.log(`  - username: "${dj.username}" (tipo: ${typeof dj.username})`);
        });
        
        console.log('\n2. Buscando por username "testdj":');
        const dj1 = await DJ.findOne({ username: 'testdj' });
        console.log('Resultado:', dj1 ? dj1.username : 'No encontrado');
        
        console.log('\n3. Buscando case-insensitive:');
        const dj2 = await DJ.findOne({ username: /^testdj$/i });
        console.log('Resultado:', dj2 ? dj2.username : 'No encontrado');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

test();
