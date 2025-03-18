
// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const { allowedFileTypes, maxFileSize } = require('../config/config');
const { ApiError } = require('./errorHandler');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new ApiError(`Unsupported file type: ${ext}. Allowed types: ${allowedFileTypes.join(', ')}`, 400), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: maxFileSize },
    fileFilter: fileFilter
});

module.exports = upload;
