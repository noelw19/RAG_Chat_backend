// src/routes/chat.js
const express = require('express');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const { chatValidator, chatDeleteValidator } = require('../utils/validators');

const router = express.Router();

router.post('/', auth, chatValidator, chatController.chat);
router.post('/delete', auth, chatDeleteValidator, chatController.deleteChat);

module.exports = router;
