
// src/services/documentProcessor.js
const fs = require('fs').promises;
const path = require('path');
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { DocxLoader } = require("langchain/document_loaders/fs/docx");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Document } = require("langchain/document");
const logger = require('../utils/logger');

class DocumentProcessor {
    static async loadDocument(filePath) {
        const extension = path.extname(filePath).toLowerCase();
        let docs = [];

        try {
            switch (extension) {
                case '.pdf':
                    const pdfLoader = new PDFLoader(filePath);
                    docs = await pdfLoader.load();
                    break;
                case '.docx':
                    const docxLoader = new DocxLoader(filePath);
                    docs = await docxLoader.load();
                    break;
                case '.txt':
                case '.md':
                    const textLoader = new TextLoader(filePath);
                    docs = await textLoader.load();
                    break;
                case '.html':
                    const htmlContent = await fs.readFile(filePath, 'utf-8');
                    // Simple HTML parsing to extract text

                    const strippedHtml = htmlContent.replace(/<[^>]+>/g, ' ');
                    docs = [new Document({ pageContent: strippedHtml })];
                    break;
                default:
                    throw new Error(`Unsupported file type: ${extension}`);
            }

            // Split documents into smaller chunks
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200
            });

            const splitDocs = await textSplitter.splitDocuments(docs);

            return splitDocs;
        } catch (error) {
            logger.error(`Error processing document: ${error.message}`, { filePath, error });
            throw error;
        }
    }
}

module.exports = DocumentProcessor;
