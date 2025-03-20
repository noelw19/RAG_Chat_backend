
// src/controllers/chatController.js
const { validationResult } = require('express-validator');
const Document = require('../models/document');
const chatService = require('../services/chatService');
const { ApiError } = require('../middleware/errorHandler');
const User = require('../models/user');
const {ObjectId} = require('mongoose');

const deleteChat = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        console.log(req.body)
        if (!errors.isEmpty()) {
            throw new ApiError(errors.array()[0].msg, 400);
        }

        const { threadId } = req.body;

        let currentUser = await User.findOne({ name: req.user.name });

        if (!currentUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        let messages = currentUser.messages;
        let cleaned = messages.filter(msg => {
            console.log(msg._id.toString() !== threadId, msg._id.toString(), threadId)
            return msg._id.toString() !== threadId
        });
        currentUser.messages = cleaned
        console.log("validated : : ", cleaned)

        await currentUser.save();

        res.status(200).json({
            status: "success",
            data: {}
        });

    } catch (error) {
        next(error)
    }
}

const chat = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(errors.array()[0].msg, 400);
        }

        const { query, documentId, chatHistory = [] } = req.body;

        console.log(documentId, typeof documentId)

        const document = await Document.findById(documentId);

        if (!document) {
            throw new ApiError('Document not found', 404);
        }

        if (document.status !== 'ready') {
            throw new ApiError('Document is not ready for chat', 400);
        }
        console.log("Last one: ", chatHistory[chatHistory.length - 1])
        const response = await chatService.processChat(documentId, query.text, chatHistory);

        let currentUser = await User.findOne({ name: req.user.name });

        if (!currentUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        const chatName = chatHistory.length > 0 ? chatHistory[0].text : query.text;

        let aiMessage = {
            role: "ai",
            text: response
        }

        let existingMessage = currentUser.messages.find(msg => msg.name === chatName);
        if (existingMessage) {
            console.log(existingMessage.messages)
            let newMessagesArr = JSON.parse(existingMessage.messages);
            newMessagesArr.push(query)
            newMessagesArr.push(aiMessage)
            existingMessage.messages = JSON.stringify(newMessagesArr);
            console.log("Updated existing conversation:", existingMessage);
        } else {
            // Create a new conversation entry with chatHistory[0] as the name
            let newMessage = {
                name: chatName,
                messages: JSON.stringify([query, aiMessage]),
                documentId: documentId
            };
            currentUser.messages.push(newMessage);
            console.log("Added a new conversation:", newMessage);
        }

        await currentUser.save();

        res.status(200).json({
            status: "success",
            data: { query, response: { role: "ai", text: response }, documentId }
        });
    } catch (error) {
        next(error);
    }

};

module.exports = {
    chat,
    deleteChat
};
