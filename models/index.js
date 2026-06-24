const sequelize = require('../config/database');
const DataTypes = require('sequelize').DataTypes;

const db = {};

db.User = require('./user')(sequelize, DataTypes);
db.Item = require('./item')(sequelize, DataTypes);
db.File = require('./file')(sequelize, DataTypes);
db.Transaction = require('./transaction')(sequelize, DataTypes);
db.Token = require('./token')(sequelize, DataTypes);

db.User.hasMany(db.Transaction, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Transaction.belongsTo(db.User, { foreignKey: 'user_id' });

db.Item.hasMany(db.File, { foreignKey: 'item_id', onDelete: 'CASCADE' });
db.File.belongsTo(db.Item, { foreignKey: 'item_id' });

db.User.hasMany(db.Token, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Token.belongsTo(db.User, { foreignKey: 'user_id' });

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;
