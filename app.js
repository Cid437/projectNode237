const express = require('express');
const app = express();
const cors = require('cors')
const path = require('path');
const users = require('./routes/userRoutes');
const products = require('./routes/productRoutes');
const transactions = require('./routes/transactionRoutes');
const dashboard = require('./routes/dashboard');

// app.get('/', (req, res) => {
//     res.send('Hello from nodejs!')
// })
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public'), { index: 'home.html' }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/receipts', express.static(path.join(__dirname, 'public', 'receipts')));
// app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', users);
app.use('/api/v1', products);
app.use('/api/v1', transactions);
app.use('/api/v1', dashboard);

module.exports = app
