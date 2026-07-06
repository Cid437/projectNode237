const sequelize = require('../config/database');
const sendEmail = require('../utils/sendEmail');
const db = require('../models');
const { Order, OrderItem, Item, User } = db;

const buildReceiptPdf = (orderNumber, order, items) => {
    const lines = [
        `Receipt for ${orderNumber}`,
        `Customer: ${order.customer_name}`,
        `Status: ${order.order_status}`,
        `Total: ${order.total_amount}`,
        '',
        'Items:'
    ];

    items.forEach((item) => {
        lines.push(`${item.name} x ${item.quantity} = ${item.subtotal}`);
    });

    return Buffer.from(lines.join('\n'));
};

exports.createOrder = async (req, res) => {
    try {
        const cart = req.body.cart || [];
        const userId = req.body.user?.id || req.body.userId;
        const { payment_method = 'Cash', shipping_address = '', shipping_fee = 0, discount = 0 } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (!cart.length) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Validate every cart item up front, outside the transaction, so we
        // can tell the frontend exactly which item(s) are the problem
        // instead of failing the whole checkout with no way to recover.
        const unavailableItems = [];
        const insufficientItems = [];
        const itemsSnapshot = {};

        for (const cartItem of cart) {
            const itemRow = await Item.findOne({
                where: { id: cartItem.item_id },
                attributes: ['id', 'sell_price', 'stock']
            });

            if (!itemRow) {
                unavailableItems.push(cartItem.item_id);
                continue;
            }

            const quantity = parseInt(cartItem.quantity || 1, 10);
            if (itemRow.stock < quantity) {
                insufficientItems.push({ item_id: cartItem.item_id, available: itemRow.stock });
                continue;
            }

            itemsSnapshot[cartItem.item_id] = itemRow;
        }

        if (unavailableItems.length || insufficientItems.length) {
            return res.status(409).json({
                error: 'Some items in your cart are no longer available',
                unavailable_items: unavailableItems,
                insufficient_items: insufficientItems
            });
        }

        const transaction = await sequelize.transaction();

        try {
            const userRow = await User.findOne({
                where: { id: userId },
                attributes: ['id', 'email', 'first_name', 'last_name'],
                transaction
            });

            if (!userRow) {
                await transaction.rollback();
                return res.status(404).json({ error: 'User not found' });
            }

            const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0, 10)), 0);
            const totalAmount = subtotal + parseFloat(shipping_fee || 0) - parseFloat(discount || 0);
            const orderNumber = `ORD-${Date.now()}`;

            const order = await Order.create({
                user_id: userId,
                order_number: orderNumber,
                subtotal: subtotal.toFixed(2),
                shipping_fee,
                discount,
                total_amount: totalAmount.toFixed(2),
                payment_method,
                payment_status: 'Pending',
                order_status: 'Pending',
                shipping_address
            }, { transaction });

            const receiptItems = [];

            for (const item of cart) {
                const quantity = parseInt(item.quantity || 1, 10);
                const unitPrice = parseFloat(item.price || itemsSnapshot[item.item_id].sell_price || 0);
                const lineSubtotal = (unitPrice * quantity).toFixed(2);

                await OrderItem.create({
                    order_id: order.id,
                    item_id: item.item_id,
                    quantity,
                    price: unitPrice.toFixed(2),
                    subtotal: lineSubtotal
                }, { transaction });

                await Item.update(
                    { stock: sequelize.literal(`stock - ${quantity}`) },
                    { where: { id: item.item_id }, transaction }
                );

                receiptItems.push({
                    name: item.description || item.name || `Item ${item.item_id}`,
                    quantity,
                    subtotal: lineSubtotal
                });
            }

            await transaction.commit();

            try {
                await sendEmail({
                    email: userRow.email,
                    subject: 'Order placed successfully',
                    message: `Your order ${orderNumber} is being processed.`,
                    attachment: {
                        filename: `${orderNumber}.pdf`,
                        content: buildReceiptPdf(orderNumber, {
                            customer_name: `${userRow.first_name || ''} ${userRow.last_name || ''}`.trim(),
                            order_status: 'Pending',
                            total_amount: totalAmount.toFixed(2)
                        }, receiptItems)
                    }
                });
            } catch (emailError) {
                console.log(emailError);
            }

            return res.status(201).json({
                success: true,
                order_id: order.id,
                order_number: orderNumber,
                message: 'Order created successfully',
                cart
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error creating order', details: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [{ model: User, attributes: [] }],
            attributes: [
                'id', 'order_number', 'total_amount', 'payment_status', 'order_status', 'created_at',
                [sequelize.col('User.first_name'), 'first_name'],
                [sequelize.col('User.last_name'), 'last_name'],
                [sequelize.col('User.email'), 'email']
            ],
            order: [['id', 'DESC']],
            raw: true
        });
        return res.status(200).json({ rows: orders });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching orders', details: error.message });
    }
};

exports.getSingleOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id },
            include: [{ model: User, attributes: [] }],
            attributes: [
                'id', 'order_number', 'total_amount', 'payment_status', 'order_status', 'shipping_address', 'created_at',
                [sequelize.col('User.first_name'), 'first_name'],
                [sequelize.col('User.last_name'), 'last_name'],
                [sequelize.col('User.email'), 'email']
            ],
            raw: true
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const items = await OrderItem.findAll({
            where: { order_id: req.params.id },
            include: [{ model: Item, attributes: [] }],
            attributes: ['quantity', 'price', 'subtotal', [sequelize.col('Item.name'), 'name']],
            raw: true
        });

        return res.status(200).json({ success: true, result: { ...order, items } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching order', details: error.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { order_status, payment_status } = req.body;

        const order = await Order.findOne({
            where: { id },
            include: [{ model: User, attributes: [] }],
            attributes: [
                'id', 'order_number', 'total_amount', 'order_status',
                [sequelize.col('User.email'), 'email'],
                [sequelize.col('User.first_name'), 'first_name'],
                [sequelize.col('User.last_name'), 'last_name']
            ],
            raw: true
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await Order.update(
            { order_status: order_status || order.order_status, payment_status: payment_status || 'Pending' },
            { where: { id } }
        );

        // Fixed: previously always sent an empty items array on update emails.
        // Now pulls the real order lines so the PDF receipt matches the order.
        const items = await OrderItem.findAll({
            where: { order_id: id },
            include: [{ model: Item, attributes: [] }],
            attributes: ['quantity', 'price', 'subtotal', [sequelize.col('Item.name'), 'name']],
            raw: true
        });

        await sendEmail({
            email: order.email,
            subject: 'Order updated',
            message: `Your order ${order.order_number} has been updated to ${order_status || order.order_status}.`,
            attachment: {
                filename: `${order.order_number}.pdf`,
                content: buildReceiptPdf(order.order_number, {
                    customer_name: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
                    order_status: order_status || order.order_status,
                    total_amount: order.total_amount
                }, items)
            }
        });

        return res.status(200).json({ success: true, message: 'Order updated successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating order', details: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        await OrderItem.destroy({ where: { order_id: id } });
        await Order.destroy({ where: { id } });
        return res.status(200).json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deleting order', details: error.message });
    }
};