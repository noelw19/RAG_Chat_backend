
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');
const { ApiError } = require('./errorHandler');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new ApiError('Authentication required', 401);
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new ApiError('User not found', 401);
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new ApiError('Invalid token', 401));
        } else {
            next(error);
        }
    }
};

module.exports = auth;
