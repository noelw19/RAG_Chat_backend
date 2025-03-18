
// src/services/vectorStore.js
const { OpenAIEmbeddings } = require("@langchain/openai");
const { HNSWLib } = require("@langchain/community/vectorstores/hnswlib");
const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const fs = require('fs').promises;
const path = require('path');
const { openaiApiKey, models, vectorDbPath } = require('../config/config');
const logger = require('../utils/logger');

class VectorStoreService {
    constructor() {
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: openaiApiKey,
            model: models.embedding
        });
    }

    async createVectorStore(documents, documentId) {
        try {
            const vectorStorePath = path.join(vectorDbPath, documentId);

            // Create directory if it doesn't exist
            await fs.mkdir(vectorStorePath, { recursive: true });

            // Create vector store
            const vectorStore = await HNSWLib.fromDocuments(documents, this.embeddings);

            // Save vector store to disk
            await vectorStore.save(vectorStorePath);

            return {
                success: true,
                path: vectorStorePath
            };
        } catch (error) {
            logger.error(`Error creating vector store: ${error.message}`, { documentId, error });
            throw error;
        }
    }

    async loadVectorStore(documentId) {
        try {
            const vectorStorePath = path.join(vectorDbPath, documentId);

            // Load vector store from disk
            const vectorStore = await HNSWLib.load(vectorStorePath, this.embeddings);

            return vectorStore;
        } catch (error) {
            logger.error(`Error loading vector store: ${error.message}`, { documentId, error });
            throw error;
        }
    }

    async deleteVectorStore(documentId) {
        try {
            const vectorStorePath = path.join(vectorDbPath, documentId);

            // Delete vector store directory
            await fs.rm(vectorStorePath, { recursive: true, force: true });

            return {
                success: true
            };
        } catch (error) {
            logger.error(`Error deleting vector store: ${error.message}`, { documentId, error });
            throw error;
        }
    }
}

module.exports = new VectorStoreService();
