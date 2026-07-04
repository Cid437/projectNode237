const app = require('./app');
const sequelize = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

// Test DB connection first
sequelize.authenticate()
    .then(() => {
        console.log('Database connected');

        // Start server ONLY after DB is ready
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection failed');
        console.error(err);
    });