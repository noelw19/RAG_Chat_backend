
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');
const { ApiError } = require('./errorHandler');
const User = require('../models/user');

const auth = async(req, res, next) => {
    const token = req.cookies.jwt; // Read token from HTTP-only cookie
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new ApiError('User not found', 401);
        }
        req.user = user; // Attach user info to request
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid token' });
    }
};

module.exports = auth;
