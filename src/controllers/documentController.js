
// src/controllers/documentController.js
const { validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const Document = require('../models/document');
const DocumentProcessor = require('../services/documentProcessor');
const vectorStoreService = require('../services/vectorStore');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const uploadDocument = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(errors.array()[0].msg, 400);
        }

        // Check if file was uploaded
        if (!req.file) {
            throw new ApiError('No file uploaded', 400);
        }

        const { title, description } = req.body;
        const file = req.file;

        // Create document in database
        const document = new Document({
            title,
            description,
            fileUrl: file.path,
            fileType: path.extname(file.originalname).toLowerCase(),
            uploadedBy: req.user._id,
            vectorStoreId: file.filename,
            status: 'processing'
        });

        await document.save();

        // Process document asynchronously
        processDocumentAsync(document._id, file.path);

        res.status(201).json({
            status: 'success',
            data: {
                document: {
                    id: document._id,
                    title: document.title,
                    description: document.description,
                    status: document.status
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

const processDocumentAsync = async (documentId, filePath) => {
    try {
        // Load and process document
        const docs = await DocumentProcessor.loadDocument(filePath);

        // Create vector store
        const vectorStore = await vectorStoreService.createVectorStore(docs, documentId.toString());

        // Update document status
        await Document.findByIdAndUpdate(documentId, {
            status: 'ready',
            metadata: {
                chunks: docs.length,
                vectorStorePath: vectorStore.path
            }
        });

        logger.info(`Document processed successfully: ${documentId}`);
    } catch (error) {
        logger.error(`Error processing document: ${error.message}`, { documentId, error });

        // Update document with error status
        await Document.findByIdAndUpdate(documentId, {
            status: 'error',
            errorMessage: error.message
        });
    }
};

const getDocuments = async (req, res, next) => {
    try {
        const documents = await Document.find({ uploadedBy: req.user._id })
            .select('title description status createdAt')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            data: {
                documents
            }
        });
    } catch (error) {
        next(error);
    }
};

const getDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            uploadedBy: req.user._id
        });

        if (!document) {
            throw new ApiError('Document not found', 404);
        }

        res.status(200).json({
            status: 'success',
            data: {
                document
            }
        });
    } catch (error) {
        next(error);
    }
};

const deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            uploadedBy: req.user._id
        });

        if (!document) {
            throw new ApiError('Document not found', 404);
        }

        // Delete file
        try {
            await fs.unlink(document.fileUrl);
        } catch (fileError) {
            logger.error(`Error deleting file: ${fileError.message}`, { documentId: document._id, path: document.fileUrl });
        }

        // Delete vector store
        try {
            await vectorStoreService.deleteVectorStore(document._id.toString());
        } catch (vectorStoreError) {
            logger.error(`Error deleting vector store: ${vectorStoreError.message}`, { documentId: document._id });
        }

        // Delete document from database
        await document.deleteOne();

        res.status(200).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument
};
