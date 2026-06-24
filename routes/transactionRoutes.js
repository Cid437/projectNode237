const express = require('express');
const router = express.Router();
const {
    getAllTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
} = require('../controllers/transaction');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.get('/transactions', isAuthenticatedUser, authorizeRoles('admin'), getAllTransactions);
router.post('/transactions', isAuthenticatedUser, createTransaction);
router.put('/transactions/:id', isAuthenticatedUser, authorizeRoles('admin'), updateTransaction);
router.delete('/transactions/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteTransaction);

module.exports = router;
