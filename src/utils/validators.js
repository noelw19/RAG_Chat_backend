
// src/utils/validators.js
const { body, param, query } = require('express-validator');

const registerValidator = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];

const loginValidator = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required')
];

const documentValidator = [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional()
];

const chatValidator = [
    body('query').notEmpty().withMessage('Query is required'),
    body('documentId').isMongoId().withMessage('Valid document ID is required')
];

module.exports = {
    registerValidator,
    loginValidator,
    documentValidator,
    chatValidator
};
