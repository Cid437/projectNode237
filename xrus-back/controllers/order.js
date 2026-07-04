const sequelize = require('../config/database');
const sendEmail = require('../utils/sendEmail');

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

        const transaction = await sequelize.transaction();

        try {
            const [userRows] = await sequelize.query('SELECT id, email, first_name, last_name FROM users WHERE id = ? LIMIT 1', {
                replacements: [userId],
                transaction
            });

            if (!userRows.length) {
                await transaction.rollback();
                return res.status(404).json({ error: 'User not found' });
            }

            const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0);
            const totalAmount = subtotal + parseFloat(shipping_fee || 0) - parseFloat(discount || 0);
            const orderNumber = `ORD-${Date.now()}`;

            const [orderResult] = await sequelize.query(
                'INSERT INTO orders (user_id, order_number, subtotal, shipping_fee, discount, total_amount, payment_method, payment_status, order_status, shipping_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                {
                    replacements: [userId, orderNumber, subtotal.toFixed(2), shipping_fee, discount, totalAmount.toFixed(2), payment_method, 'Pending', 'Pending', shipping_address],
                    transaction
                }
            );

            const orderId = orderResult.insertId;
            const receiptItems = [];

            for (const item of cart) {
                const [itemRows] = await sequelize.query('SELECT id, sell_price, stock FROM items WHERE id = ? LIMIT 1', {
                    replacements: [item.item_id],
                    transaction
                });

                if (!itemRows.length) {
                    await transaction.rollback();
                    return res.status(404).json({ error: `Item ${item.item_id} not found` });
                }

                const unitPrice = parseFloat(item.price || itemRows[0].sell_price || 0);
                const quantity = parseInt(item.quantity || 1);
                const lineSubtotal = (unitPrice * quantity).toFixed(2);

                await sequelize.query(
                    'INSERT INTO order_items (order_id, item_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
                    {
                        replacements: [orderId, item.item_id, quantity, unitPrice.toFixed(2), lineSubtotal],
                        transaction
                    }
                );

                await sequelize.query('UPDATE items SET stock = stock - ? WHERE id = ?', {
                    replacements: [quantity, item.item_id],
                    transaction
                });

                receiptItems.push({
                    name: item.description || item.name || `Item ${item.item_id}`,
                    quantity,
                    subtotal: lineSubtotal
                });
            }

            await transaction.commit();

            try {
                await sendEmail({
                    email: userRows[0].email,
                    subject: 'Order placed successfully',
                    message: `Your order ${orderNumber} is being processed.`,
                    attachment: {
                        filename: `${orderNumber}.pdf`,
                        content: buildReceiptPdf(orderNumber, {
                            customer_name: `${userRows[0].first_name || ''} ${userRows[0].last_name || ''}`.trim(),
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
                order_id: orderId,
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
        const [rows] = await sequelize.query(
            'SELECT o.id, o.order_number, o.total_amount, o.payment_status, o.order_status, o.created_at, u.first_name, u.last_name, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.id DESC'
        );
        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching orders', details: error.message });
    }
};

exports.getSingleOrder = async (req, res) => {
    try {
        const [orders] = await sequelize.query(
            'SELECT o.id, o.order_number, o.total_amount, o.payment_status, o.order_status, o.shipping_address, o.created_at, u.first_name, u.last_name, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ? LIMIT 1',
            { replacements: [req.params.id] }
        );

        if (!orders.length) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const [items] = await sequelize.query(
            'SELECT oi.quantity, oi.price, oi.subtotal, i.name FROM order_items oi LEFT JOIN items i ON oi.item_id = i.id WHERE oi.order_id = ?',
            { replacements: [req.params.id] }
        );

        return res.status(200).json({ success: true, result: { ...orders[0], items } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching order', details: error.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { order_status, payment_status } = req.body;

        const [orders] = await sequelize.query('SELECT o.id, o.order_number, o.total_amount, o.order_status, u.email, u.first_name, u.last_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ? LIMIT 1', { replacements: [id] });

        if (!orders.length) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await sequelize.query(
            'UPDATE orders SET order_status = ?, payment_status = ? WHERE id = ?',
            { replacements: [order_status || orders[0].order_status, payment_status || 'Pending', id] }
        );

        await sendEmail({
            email: orders[0].email,
            subject: 'Order updated',
            message: `Your order ${orders[0].order_number} has been updated to ${order_status || orders[0].order_status}.`,
            attachment: {
                filename: `${orders[0].order_number}.pdf`,
                content: buildReceiptPdf(orders[0].order_number, {
                    customer_name: `${orders[0].first_name || ''} ${orders[0].last_name || ''}`.trim(),
                    order_status: order_status || orders[0].order_status,
                    total_amount: orders[0].total_amount
                }, [])
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
        await sequelize.query('DELETE FROM order_items WHERE order_id = ?', { replacements: [id] });
        await sequelize.query('DELETE FROM orders WHERE id = ?', { replacements: [id] });
        return res.status(200).json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deleting order', details: error.message });
    }
};
