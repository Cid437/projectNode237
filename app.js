const express = require('express');
const app = express();
const cors = require('cors')
const path = require('path');

// app.get('/', (req, res) => {
//     res.send('Hello from nodejs!')
// })
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public'), { index: 'home.html' }));
// app.use(express.urlencoded({ extended: true }));

module.exports = app