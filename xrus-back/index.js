const app = require('./app');
const sequelize = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

// Test DB connection first
sequelize.authenticate()
    .then(() => {
        console.log('Database connected');

        return sequelize.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) NULL")
            .catch((err) => {
                console.log('Image column check skipped or failed:', err.message);
            });
    })
    .then(() => {
        // Start server ONLY after DB is ready
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection failed');
        console.error(err);
    });