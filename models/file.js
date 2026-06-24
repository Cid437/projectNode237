module.exports = (sequelize, DataTypes) => {
    const File = sequelize.define('File', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        item_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        filename: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        filepath: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        filetype: {
            type: DataTypes.ENUM('png', 'jpg', 'jpeg', 'gif'),
            defaultValue: 'png'
        }
    }, {
        tableName: 'files',
        timestamps: true,
        createdAt: 'uploaded_at',
        updatedAt: false
    });

    return File;
};
