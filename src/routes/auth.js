
// src/routes/auth.js
const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../utils/validators');

const router = express.Router();

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/profile', auth, authController.getProfile);
router.post('/logout', auth, (req, res) => {
    res.cookie('jwt', '', { maxAge: 0, httpOnly: true });
    res.json({ status: 'success', message: 'Logged out' });
});

module.exports = router;

