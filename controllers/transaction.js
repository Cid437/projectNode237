const db = require('../models');
const Transaction = db.Transaction;
const User = db.User;
const sendEmail = require('../utils/sendEmail');
const generateReceipt = require('../utils/pdf');

exports.getAllTransactions = async (req, res) => {
    try {
        const rows = await Transaction.findAll({
            include: [{ model: User, attributes: ['id', 'name', 'email'] }],
            order: [['id', 'DESC']]
        });
        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching transactions' });
    }
};

exports.createTransaction = async (req, res) => {
    try {
        const { amount, status } = req.body;
        const user_id = req.body.user_id || req.user.id;
        const transaction = await Transaction.create({ user_id, amount, status: status || 'pending' });
        return res.status(201).json({ success: true, transaction });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error creating transaction', details: error.message });
    }
};

exports.updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id, {
            include: [{ model: User }]
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        await transaction.update({
            amount: req.body.amount || transaction.amount,
            status: req.body.status || transaction.status
        });

        const receiptPath = await generateReceipt(transaction, transaction.User);
        await transaction.update({ receipt_path: receiptPath });

        try {
            await sendEmail({
                email: transaction.User.email,
                subject: 'Transaction Updated',
                message: `Your transaction #${transaction.id} was updated to ${transaction.status}.`,
                attachments: [{
                    filename: `receipt-${transaction.id}.pdf`,
                    path: `public${receiptPath}`
                }]
            });
        } catch (emailErr) {
            console.log('Email error:', emailErr);
        }

        return res.status(200).json({
            success: true,
            message: 'Transaction updated',
            transaction
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating transaction', details: error.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        await Transaction.destroy({ where: { id: req.params.id } });
        return res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deleting transaction', details: error.message });
    }
};
