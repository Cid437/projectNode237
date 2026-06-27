const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  registerUser,
  loginUser,
  getProfile,
  listUsers,
  updateUser,
  updateUserRole,
  deactivateUser,
  deactivateUserAccount,
} = require('../controllers/users');
const auth = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', auth.protect, getProfile);
router.patch('/profile', auth.protect, upload.single('image'), updateUser);
router.patch('/deactivate', auth.protect, deactivateUserAccount);
router.get('/', auth.protect, auth.adminOnly, listUsers);
router.patch('/:id/role', auth.protect, auth.adminOnly, updateUserRole);
router.patch('/:id/status', auth.protect, auth.adminOnly, deactivateUser);

module.exports = router;
