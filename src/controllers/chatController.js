
// src/controllers/chatController.js
const { validationResult } = require('express-validator');
const Document = require('../models/document');
const chatService = require('../services/chatService');
const { ApiError } = require('../middleware/errorHandler');
const User = require('../models/user');

const chat = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(errors.array()[0].msg, 400);
        }

        const { query, documentId, chatHistory = [] } = req.body;

        // Check if document exists and is ready
        const document = await Document.findById(documentId);

        if (!document) {
            throw new ApiError('Document not found', 404);
        }

        if (document.status !== 'ready') {
            throw new ApiError('Document is not ready for chat', 400);
        }
            // Process chat with AI
            const response = await chatService.processChat(documentId, chatHistory[chatHistory.length -1], chatHistory);
        
            // Get the current user
            let currentUser = await User.findOne({ name: req.user.name });
        
            if (!currentUser) {
                return res.status(404).json({ status: "error", message: "User not found" });
            }
        
            // Extract the first value of chatHistory to check if it matches an existing message name
            const chatName = chatHistory[0];
        
            // Find if a conversation with this name already exists
            let existingMessage = currentUser.messages.find(msg => msg.name === chatName);
        
            if (existingMessage) {
                // Append the new query & response to the existing conversation as a string
                existingMessage.messages += `\n${query}\n${response}`;
                console.log("Updated existing conversation:", existingMessage);
            } else {
                // Create a new conversation entry with chatHistory[0] as the name
                let newMessage = {
                    name: chatName, // Use the first chatHistory value as the name
                    messages: `${query}\n${response}`
                };
                currentUser.messages.push(newMessage);
                console.log("Added a new conversation:", newMessage);
            }
        
            // Save the updated messages to the database
            await currentUser.save();
        
            // Send response
            res.status(200).json({
                status: "success",
                data: { query, response, documentId }
            });
        } catch (error) {
            next(error);
        }
           
};

module.exports = {
    chat
};
