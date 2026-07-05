const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');

const { registerUser, loginUser, updateUser, deactivateUser, updateUserStatus, createUser, getAllUsers, updateUserByAdmin, deleteUserByAdmin, updateUserRole, getProfile } = require('../controllers/user');
const { isAuthenticatedUser } = require('../middlewares/auth');
const { isAdminUser } = require('../middlewares/admin');

router.get('/profile', isAuthenticatedUser, getProfile);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/update-profile', isAuthenticatedUser, upload.single('image'), updateUser);
router.delete('/deactivate', isAuthenticatedUser, deactivateUser);
router.post('/users', isAuthenticatedUser, isAdminUser, createUser);
router.get('/users', isAuthenticatedUser, isAdminUser, getAllUsers);
router.put('/users/:id', isAuthenticatedUser, isAdminUser, updateUserByAdmin);
router.delete('/users/:id', isAuthenticatedUser, isAdminUser, deleteUserByAdmin);
router.put('/users/:id/status', isAuthenticatedUser, isAdminUser, updateUserStatus);
router.put('/users/:id/role', isAuthenticatedUser, isAdminUser, updateUserRole);

module.exports = router;