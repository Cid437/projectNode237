const sequelize = require('../config/database');
const Item = require('./item');
const ItemImage = require('./itemImage');
const Category = require('./category');
const User = require('./user');

// Initialize models
const db = {};
db.Item = Item(sequelize, require('sequelize').DataTypes);
db.ItemImage = ItemImage(sequelize, require('sequelize').DataTypes);
db.Category = Category(sequelize, require('sequelize').DataTypes);
db.User = User(sequelize, require('sequelize').DataTypes);

// Define associations
db.Item.belongsTo(db.Category, {
    foreignKey: 'category_id'
});
db.Category.hasMany(db.Item, {
    foreignKey: 'category_id'
});

db.Item.hasMany(db.ItemImage, {
    foreignKey: 'item_id',
    onDelete: 'CASCADE'
});
db.ItemImage.belongsTo(db.Item, {
    foreignKey: 'item_id'
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;