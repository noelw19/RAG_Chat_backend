// src/routes/chat.js
const express = require('express');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const { chatValidator } = require('../utils/validators');

const router = express.Router();

router.post('/', auth, chatValidator, chatController.chat);

module.exports = router;
