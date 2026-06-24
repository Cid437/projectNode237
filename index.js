const app = require('./app')
const db = require('./models')

require('dotenv').config()

const PORT = process.env.PORT || 3000

db.sequelize.authenticate()
    .then(() => {
        console.log('MySQL Connected')
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    })
    .catch(error => {
        console.log(error)
    })
