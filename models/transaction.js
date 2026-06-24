module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define('Transaction', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
            defaultValue: 'pending'
        },
        receipt_path: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'transactions',
        timestamps: true,
        createdAt: 'transaction_date',
        updatedAt: false
    });

    return Transaction;
};
