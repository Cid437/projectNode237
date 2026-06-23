const express = require('express');
const router = express.Router();
const { listUsers, updateUserRole, deactivateUser } = require('../controllers/users');
const auth = require('../middleware/auth');

router.get('/', auth.protect, auth.adminOnly, listUsers);
router.patch('/:id/role', auth.protect, auth.adminOnly, updateUserRole);
router.patch('/:id/status', auth.protect, auth.adminOnly, deactivateUser);

module.exports = router;
