module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        order_number: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true
        },
        subtotal: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        shipping_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        discount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        total_amount: {
            type: DataTypes.VIRTUAL,
            get() {
                const subtotal = parseFloat(this.getDataValue('subtotal') || 0);
                const shippingFee = parseFloat(this.getDataValue('shipping_fee') || 0);
                const discount = parseFloat(this.getDataValue('discount') || 0);
                return (subtotal + shippingFee - discount).toFixed(2);
            }
        },
        payment_method: {
            type: DataTypes.ENUM('Cash', 'GCash', 'Card'),
            allowNull: false
        },
        payment_status: {
            type: DataTypes.ENUM('Pending', 'Paid', 'Refunded'),
            defaultValue: 'Pending'
        },
        order_status: {
            type: DataTypes.ENUM('Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'),
            defaultValue: 'Pending'
        },
        shipping_address: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'orders',
        timestamps: true,
        underscored: true
    });

    return Order;
};