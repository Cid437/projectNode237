const sequelize = require('../config/database');
const sendEmail = require('../utils/sendEmail');
const db = require('../models');
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');
const { Order, OrderItem, Item, User } = db;

const formatMoney = (value) => `PHP ${Number(value || 0).toFixed(2)}`;

// Generates a real PDF receipt (previously this was plain text wrapped in a
// Buffer and saved as .pdf, so it failed to open in any PDF viewer).
// pdfkit streams pages, so we collect the chunks and resolve a Buffer once
// the document is done writing.
const buildReceiptPdf = (order, items) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(22).fillColor('#212529').text('Xrus Shop', { align: 'left' });
            doc.fontSize(10).fillColor('#6c757d').text('Official Receipt', { align: 'left' });
            doc.moveDown(0.7);

            doc.fontSize(10).fillColor('#212529');
            doc.text(`Order Number: ${order.order_number || ''}`);
            doc.text(`Customer: ${order.customer_name || 'Guest'}`);
            doc.text(`Payment Method: ${order.payment_method || 'Cash'}`);
            doc.text(`Status: ${order.order_status || 'Pending'}`);
            doc.text(`Date: ${order.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString()}`);
            if (order.shipping_address) {
                doc.text(`Shipping Address: ${order.shipping_address}`);
            }

            doc.moveDown(1);

            const left = 40;
            const width = 515;
            const col = { item: left + 8, qty: left + 300, price: left + 360, subtotal: left + 430 };

            let y = doc.y;
            doc.rect(left, y, width, 24).fill('#343a40');
            doc.fillColor('#ffffff').fontSize(10);
            doc.text('Item', col.item, y + 6);
            doc.text('Qty', col.qty, y + 6);
            doc.text('Price', col.price, y + 6);
            doc.text('Subtotal', col.subtotal, y + 6);
            y += 24;

            doc.fontSize(9);
            items.forEach((item, idx) => {
                if (idx % 2 === 0) {
                    doc.rect(left, y, width, 20).fill('#f8f9fa');
                }
                doc.fillColor('#212529');
                doc.text(item.name || '', col.item, y + 5, { width: 280 });
                doc.text(String(item.quantity || 0), col.qty, y + 5);
                doc.text(formatMoney(item.price || 0), col.price, y + 5);
                doc.text(formatMoney(item.subtotal || 0), col.subtotal, y + 5);
                y += 20;
            });

            doc.moveDown(2);
            doc.fontSize(10).fillColor('#212529');
            doc.text(`Subtotal: ${formatMoney(order.subtotal || 0)}`, { align: 'right' });
            if (order.shipping_fee) {
                doc.text(`Shipping Fee: ${formatMoney(order.shipping_fee || 0)}`, { align: 'right' });
            }
            if (order.discount) {
                doc.text(`Discount: -${formatMoney(order.discount || 0)}`, { align: 'right' });
            }
            doc.fontSize(12).fillColor('#111827').text(`Total: ${formatMoney(order.total_amount || 0)}`, { align: 'right' });

            doc.moveDown(2);
            doc.fontSize(9).fillColor('#6c757d').text('Thank you for shopping with Xrus Shop!', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const buildReceiptEmailHtml = (heading, order, items, downloadUrl) => {
    const rows = items.map((item) => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #e9ecef;">${item.name || ''}</td>
            <td style="padding:8px;border-bottom:1px solid #e9ecef;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #e9ecef;text-align:right;">${formatMoney(item.subtotal || 0)}</td>
        </tr>
    `).join('');

    return `
        <div style="font-family:Arial,sans-serif;background:#f8f9fa;padding:24px;">
            <div style="max-width:680px;margin:auto;background:#ffffff;border:1px solid #e9ecef;border-radius:10px;overflow:hidden;">
                <div style="background:#343a40;color:#ffffff;padding:24px;">
                    <h2 style="margin:0;">Xrus Shop</h2>
                    <p style="margin:6px 0 0;color:#dee2e6;">${heading}</p>
                </div>
                <div style="padding:24px;">
                    <p style="margin:0 0 6px;"><strong>Order Number:</strong> ${order.order_number}</p>
                    <p style="margin:0 0 6px;"><strong>Customer:</strong> ${order.customer_name || 'Guest'}</p>
                    <p style="margin:0 0 6px;"><strong>Status:</strong> ${order.order_status}</p>
                    <p style="margin:0 0 6px;"><strong>Payment Method:</strong> ${order.payment_method || 'Cash'}</p>
                    <p style="margin:0 0 16px;"><strong>Total:</strong> ${formatMoney(order.total_amount || 0)}</p>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                        <thead>
                            <tr style="background:#f1f3f5;">
                                <th style="padding:8px;text-align:left;">Item</th>
                                <th style="padding:8px;text-align:center;">Qty</th>
                                <th style="padding:8px;text-align:right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div style="margin-top:16px;text-align:right;font-size:14px;">
                        <p style="margin:4px 0;">Subtotal: ${formatMoney(order.subtotal || 0)}</p>
                        ${order.shipping_fee ? `<p style="margin:4px 0;">Shipping Fee: ${formatMoney(order.shipping_fee || 0)}</p>` : ''}
                        ${order.discount ? `<p style="margin:4px 0;">Discount: -${formatMoney(order.discount || 0)}</p>` : ''}
                        <p style="margin:8px 0 0;font-weight:bold;">Total: ${formatMoney(order.total_amount || 0)}</p>
                    </div>
                    ${downloadUrl ? `<div style="margin-top:20px;"><a href="${downloadUrl}" style="background:#007bff;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;display:inline-block;">Download PDF Receipt</a></div>` : ''}
                    <p style="margin-top:16px;color:#868e96;font-size:12px;">Your receipt is attached as a PDF for easy download.</p>
                </div>
            </div>
        </div>
    `;
};

const buildReceiptDownloadUrl = (orderId, userId) => {
    const token = jwt.sign({ orderId, userId, type: 'receipt' }, process.env.JWT_SECRET || 'xrus-secret', { expiresIn: '7d' });
    return `${process.env.APP_URL || 'http://localhost:4000'}/api/v1/orders/receipt/${token}`;
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
                const receiptOrder = {
                    order_number: orderNumber,
                    order_status: 'Pending',
                    subtotal: subtotal.toFixed(2),
                    shipping_fee: parseFloat(shipping_fee || 0),
                    discount: parseFloat(discount || 0),
                    total_amount: totalAmount.toFixed(2),
                    payment_method,
                    shipping_address,
                    customer_name: `${userRow.first_name || ''} ${userRow.last_name || ''}`.trim(),
                    created_at: new Date()
                };
                const receiptDownloadUrl = buildReceiptDownloadUrl(order.id, userId);

                console.log('createOrder: sending order placed email to', userRow.email);
                try {
                    const pdfContent = await buildReceiptPdf(receiptOrder, receiptItems);
                    const info = await sendEmail({
                        email: userRow.email,
                        subject: 'Order placed successfully',
                        message: `Your order ${orderNumber} is being processed.`,
                        html: buildReceiptEmailHtml('Order placed successfully', receiptOrder, receiptItems, receiptDownloadUrl),
                        attachment: {
                            filename: `${orderNumber}.pdf`,
                            content: pdfContent
                        }
                    });
                    console.log('createOrder: sendEmail result', info && info.messageId ? info.messageId : info);
                } catch (emailError) {
                    console.error('createOrder: sendEmail failed', emailError);
                }
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
                'id',
                'order_number',
                'payment_status',
                'order_status',
                'created_at',
                [sequelize.literal('subtotal + shipping_fee - discount'), 'total_amount'],
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
        return res.status(500).json({
            error: 'Error fetching orders',
            details: error.message
        });
    }
};

// Customer-facing: only that user's own orders, so it's scoped to
// req.user.id instead of taking an id from the request (no admin check,
// any logged-in user can see their own order history/status).
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.findAll({
            where: { user_id: userId },
            attributes: [
                'id',
                'order_number',
                'payment_method',
                'payment_status',
                'order_status',
                'created_at',
                [sequelize.literal('subtotal + shipping_fee - discount'), 'total_amount']
            ],
            order: [['id', 'DESC']],
            raw: true
        });

        return res.status(200).json({ rows: orders });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: 'Error fetching your orders',
            details: error.message
        });
    }
};

exports.getSingleOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id },
            include: [{ model: User, attributes: [] }],
            attributes: [
                'id',
                'order_number',
                'payment_status',
                'order_status',
                'shipping_address',
                'created_at',
                [sequelize.literal('subtotal + shipping_fee - discount'), 'total_amount'],
                [sequelize.col('User.first_name'), 'first_name'],
                [sequelize.col('User.last_name'), 'last_name'],
                [sequelize.col('User.email'), 'email']
            ],
            raw: true
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const items = await OrderItem.findAll({
            where: { order_id: req.params.id },
            include: [{ model: Item, attributes: [] }],
            attributes: [
                'quantity',
                'price',
                'subtotal',
                [sequelize.col('Item.name'), 'name']
            ],
            raw: true
        });

        return res.status(200).json({
            success: true,
            result: {
                ...order,
                items
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: 'Error fetching order',
            details: error.message
        });
    }
};

exports.getOrderReceipt = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const order = await Order.findOne({
            where: { id, user_id: userId },
            attributes: [
                'id',
                'order_number',
                'order_status',
                'created_at',
                [sequelize.literal('subtotal + shipping_fee - discount'), 'total_amount']
            ],
            raw: true
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.order_status !== 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Receipt is only available for completed orders'
            });
        }

        const items = await OrderItem.findAll({
            where: { order_id: id },
            include: [{ model: Item, attributes: [] }],
            attributes: [
                'quantity',
                'price',
                'subtotal',
                [sequelize.col('Item.name'), 'name']
            ],
            raw: true
        });

        const userRow = await User.findOne({
            where: { id: userId },
            attributes: ['first_name', 'last_name'],
            raw: true
        });

        const receiptPdf = await buildReceiptPdf({
            order_number: order.order_number,
            order_status: order.order_status,
            total_amount: order.total_amount,
            customer_name: `${userRow?.first_name || ''} ${userRow?.last_name || ''}`.trim(),
            created_at: order.created_at
        }, items);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${order.order_number}.pdf"`
        );

        return res.send(receiptPdf);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: 'Error generating receipt',
            details: error.message
        });
    }
};

exports.getReceiptByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'xrus-secret'
        );

        if (decoded.type !== 'receipt') {
            return res.status(401).json({
                success: false,
                message: 'Invalid receipt link'
            });
        }

        const order = await Order.findOne({
            where: {
                id: decoded.orderId,
                user_id: decoded.userId
            },
            attributes: [
                'id',
                'order_number',
                'order_status',
                'created_at',
                [sequelize.literal('subtotal + shipping_fee - discount'), 'total_amount']
            ],
            raw: true
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.order_status !== 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Receipt is only available for completed orders'
            });
        }

        const items = await OrderItem.findAll({
            where: { order_id: order.id },
            include: [{ model: Item, attributes: [] }],
            attributes: [
                'quantity',
                'price',
                'subtotal',
                [sequelize.col('Item.name'), 'name']
            ],
            raw: true
        });

        const userRow = await User.findOne({
            where: { id: decoded.userId },
            attributes: ['first_name', 'last_name'],
            raw: true
        });

        const receiptPdf = await buildReceiptPdf({
            order_number: order.order_number,
            order_status: order.order_status,
            total_amount: order.total_amount,
            customer_name: `${userRow?.first_name || ''} ${userRow?.last_name || ''}`.trim(),
            created_at: order.created_at
        }, items);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${order.order_number}.pdf"`
        );

        return res.send(receiptPdf);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Receipt link has expired'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid receipt link'
        });
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
                'id',
                'user_id',
                'order_number',
                'order_status',
                'payment_method',
                'shipping_address',
                'subtotal',
                'shipping_fee',
                'discount',
                [sequelize.literal('subtotal + shipping_fee - discount'), 'total_amount'],
                [sequelize.col('User.email'), 'email'],
                [sequelize.col('User.first_name'), 'first_name'],
                [sequelize.col('User.last_name'), 'last_name']
            ],
            raw: true
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const previousStatus = order.order_status;
        const nextStatus = order_status || previousStatus;

        await Order.update(
            {
                order_status: nextStatus,
                payment_status: payment_status || 'Pending'
            },
            { where: { id } }
        );

        const items = await OrderItem.findAll({
            where: { order_id: id },
            include: [{ model: Item, attributes: [] }],
            attributes: [
                'item_id',
                'quantity',
                'price',
                'subtotal',
                [sequelize.col('Item.name'), 'name']
            ],
            raw: true
        });

        if (nextStatus === 'Cancelled' && previousStatus !== 'Cancelled') {
            for (const item of items) {
                await Item.update(
                    { stock: sequelize.literal(`stock + ${item.quantity}`) },
                    { where: { id: item.item_id } }
                );
            }
        }

        const receiptOrder = {
            order_number: order.order_number,
            order_status: nextStatus,
            subtotal: order.subtotal,
            shipping_fee: order.shipping_fee,
            discount: order.discount,
            total_amount: order.total_amount,
            payment_method: order.payment_method,
            shipping_address: order.shipping_address,
            customer_name: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
            created_at: order.created_at
        };

        const receiptDownloadUrl = buildReceiptDownloadUrl(order.id, order.user_id);

        console.log('updateOrder: sending update email to', order.email, 'status:', nextStatus);

        try {
            const pdfBuf = await buildReceiptPdf(receiptOrder, items);

            const info = await sendEmail({
                email: order.email,
                subject: 'Order updated',
                message: `Your order ${order.order_number} has been updated to ${nextStatus}.`,
                html: buildReceiptEmailHtml(
                    'Your order has been updated',
                    receiptOrder,
                    items,
                    receiptDownloadUrl
                ),
                attachment: {
                    filename: `${order.order_number}.pdf`,
                    content: pdfBuf
                }
            });

            console.log(
                'updateOrder: sendEmail result',
                info && info.messageId ? info.messageId : info
            );
        } catch (emailErr) {
            console.error('updateOrder: sendEmail failed', emailErr);
        }

        return res.status(200).json({
            success: true,
            message: 'Order updated successfully'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: 'Error updating order',
            details: error.message
        });
    }
};

exports.createReceiptToken = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const order = await Order.findOne({ where: { id, user_id: userId }, attributes: ['id'], raw: true });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const token = jwt.sign({ orderId: order.id, userId, type: 'receipt' }, process.env.JWT_SECRET || 'xrus-secret', { expiresIn: '10m' });
        const url = `${process.env.APP_URL || 'http://localhost:4000'}/api/v1/orders/receipt/${token}`;
        return res.status(200).json({ success: true, url });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error creating receipt token', details: error.message });
    }
};

// Public test endpoint to send a sample receipt email to a specified address.
exports.createTestEmail = async (req, res) => {
    try {
        const { email, orderId } = req.body || req.query || {};

        let receiptOrder;
        let items = [];

        if (orderId) {
            const order = await Order.findOne({
                where: { id: orderId },
                include: [{ model: User, attributes: [] }],
                attributes: [
                    'id',
                    'order_number',
                    'order_status',
                    'subtotal',
                    'shipping_fee',
                    'discount',
                    'payment_method',
                    'shipping_address',
                    'created_at',
                    [sequelize.literal('subtotal + shipping_fee - discount'), 'total_amount'],
                    [sequelize.col('User.first_name'), 'first_name'],
                    [sequelize.col('User.last_name'), 'last_name']
                ],
                raw: true
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            items = await OrderItem.findAll({
                where: { order_id: orderId },
                include: [{ model: Item, attributes: [] }],
                attributes: [
                    'quantity',
                    'price',
                    'subtotal',
                    [sequelize.col('Item.name'), 'name']
                ],
                raw: true
            });

            receiptOrder = {
                order_number: order.order_number,
                order_status: order.order_status,
                subtotal: order.subtotal,
                shipping_fee: order.shipping_fee,
                discount: order.discount,
                total_amount: order.total_amount,
                payment_method: order.payment_method,
                shipping_address: order.shipping_address,
                customer_name: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
                created_at: order.created_at
            };

        } else {
            // Dummy data
            receiptOrder = {
                order_number: `TEST-${Date.now()}`,
                order_status: 'Completed',
                subtotal: 100.00,
                shipping_fee: 0,
                discount: 0,
                total_amount: 100.00,
                payment_method: 'Card',
                shipping_address: '123 Test St',
                customer_name: 'Test User',
                created_at: new Date()
            };

            items = [
                {
                    name: 'Test Item',
                    quantity: 1,
                    price: 100.00,
                    subtotal: 100.00
                }
            ];
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        console.log('createTestEmail: sending test email to', email);

        try {
            const pdf = await buildReceiptPdf(receiptOrder, items);

            const info = await sendEmail({
                email,
                subject: `Test receipt ${receiptOrder.order_number}`,
                message: 'This is a test receipt',
                html: buildReceiptEmailHtml(
                    'Test receipt',
                    receiptOrder,
                    items,
                    null
                ),
                attachment: {
                    filename: `${receiptOrder.order_number}.pdf`,
                    content: pdf
                }
            });

            console.log(
                'createTestEmail: sendEmail result',
                info && info.messageId ? info.messageId : info
            );

            return res.status(200).json({
                success: true,
                info
            });

        } catch (err) {
            console.error('createTestEmail: sendEmail failed', err);

            return res.status(500).json({
                success: false,
                error: err.message || err
            });
        }

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: 'Error sending test email',
            details: error.message
        });
    }
};

exports.cancelMyOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const order = await Order.findOne({
            where: { id, user_id: userId },
            attributes: ['id', 'order_status'],
            raw: true
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (['Shipped', 'Completed', 'Cancelled'].includes(order.order_status)) {
            return res.status(400).json({ error: `Order cannot be cancelled once it is ${order.order_status.toLowerCase()}` });
        }

        const items = await OrderItem.findAll({
            where: { order_id: id },
            attributes: ['item_id', 'quantity'],
            raw: true
        });

        for (const item of items) {
            await Item.update(
                { stock: sequelize.literal(`stock + ${item.quantity}`) },
                { where: { id: item.item_id } }
            );
        }

        await Order.update({ order_status: 'Cancelled' }, { where: { id } });

        return res.status(200).json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error cancelling order', details: error.message });
    }
};

// Allow customers to cancel their own orders (returns items to stock)
exports.cancelOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const order = await Order.findOne({ where: { id, user_id: userId } });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.order_status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Order already cancelled' });
        }

        // Update status
        await Order.update({ order_status: 'Cancelled' }, { where: { id } });

        // Restock items
        const items = await OrderItem.findAll({ where: { order_id: id }, raw: true });
        for (const it of items) {
            await Item.update({ stock: sequelize.literal(`stock + ${it.quantity}`) }, { where: { id: it.item_id } });
        }

        return res.status(200).json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error cancelling order', details: error.message });
    }
};