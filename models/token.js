module.exports = (sequelize, DataTypes) => {
    const Token = sequelize.define('Token', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        token_value: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        expiry_date: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'tokens',
        timestamps: false
    });

    return Token;
};
