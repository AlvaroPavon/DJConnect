const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/dj-connect');

const djSchema = new mongoose.Schema({
    username: String,
    password: String
});

const DJ = mongoose.model('DJ', djSchema, 'djs');

async function testLogin() {
    try {
        const username = 'testdj';
        const password = 'test123';
        
        console.log('Buscando DJ con username:', username);
        const dj = await DJ.findOne({ username: username });
        
        if (!dj) {
            console.log('❌ DJ no encontrado');
            process.exit(1);
        }
        
        console.log('✅ DJ encontrado:', dj.username);
        
        const isMatch = await bcrypt.compare(password, dj.password);
        console.log('Password match:', isMatch);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testLogin();
