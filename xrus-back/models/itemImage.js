module.exports = (sequelize, DataTypes) => {
    const ItemImage = sequelize.define('ItemImage', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        item_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        image_path: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        tableName: 'item_images',
        timestamps: true,
        underscored: true
    });

    return ItemImage;
};