const bcrypt = require('bcryptjs');

const password = 'test123';
const hash = '$2b$10$.CMDTYC18waNVkH3pRS.i.IyTg5f87NP/o074Spek/G8nkFvS9z3S';

bcrypt.compare(password, hash).then(result => {
    console.log('Match:', result);
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
