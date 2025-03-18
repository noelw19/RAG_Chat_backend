// src/routes/documents.js
const express = require('express');
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { documentValidator } = require('../utils/validators');

const router = express.Router();

router.post('/',
    auth,
    upload.single('file'),
    documentValidator,
    documentController.uploadDocument
);

router.get('/', auth, documentController.getDocuments);
router.get('/:id', auth, documentController.getDocument);
router.delete('/:id', auth, documentController.deleteDocument);

module.exports = router;
