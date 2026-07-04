const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const items = require('./routes/item');
const users = require('./routes/user');
const orders = require('./routes/order');
const dashboard = require('./routes/dashboard');

app.use(cors());
app.use(express.json());

const imagesDir = path.join(__dirname, 'images');
fs.mkdirSync(imagesDir, { recursive: true });

// Serve the frontend folder
app.use(express.static(path.join(__dirname, '../xrus-front')));
app.use('/images', express.static(imagesDir));

// API routes
app.use('/api/v1', items);
app.use('/api/v1', users);
app.use('/api/v1', orders);
app.use('/api/v1', dashboard);

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../xrus-front/home.html'));
});

module.exports = app;