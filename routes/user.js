const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  listUsers,
  updateUserRole,
  deactivateUser,
} = require('../controllers/users');
const auth = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', auth.protect, getProfile);
router.get('/', auth.protect, auth.adminOnly, listUsers);
router.patch('/:id/role', auth.protect, auth.adminOnly, updateUserRole);
router.patch('/:id/status', auth.protect, auth.adminOnly, deactivateUser);

module.exports = router;
