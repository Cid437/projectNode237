const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getAllUsers,
    updateUserRole,
    deactivateUser
} = require('../controllers/users');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', isAuthenticatedUser, authorizeRoles('admin'), getAllUsers);
router.put('/users/:id/role', isAuthenticatedUser, authorizeRoles('admin'), updateUserRole);
router.delete('/users/:id/deactivate', isAuthenticatedUser, authorizeRoles('admin'), deactivateUser);

module.exports = router;
