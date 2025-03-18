
// src/models/document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vectorStoreId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['processing', 'ready', 'error'],
        default: 'processing'
    },
    errorMessage: {
        type: String
    },
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
