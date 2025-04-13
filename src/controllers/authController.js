
// src/controllers/authController.js
const { validationResult } = require('express-validator');
const User = require('../models/user');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(errors.array()[0].msg, 400);
        }

        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError('Email already in use', 400);
        }

        // Create new user
        const user = new User({ name, email, password });
        await user.save();

        // Generate token
        const token = user.generateAuthToken();

        res.cookie('jwt', token, {
            httpOnly: true, // Prevents client-side access to the cookie
            secure: process.env.NODE_ENV === 'production', // Ensures it's sent over HTTPS in production
            sameSite: 'Strict', // Helps prevent CSRF attacks
            maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
        });

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(errors.array()[0].msg, 400);
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError('Invalid credentials', 401);
        }

        const logging = {
            user: user.name,
            ip: request.socket.remoteAddress
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logging = JSON.stringify(logging)
            throw new ApiError(`Invalid credentials: ${logging}`, 401);
        }

        // Generate token
        const token = user.generateAuthToken();

        res.cookie('jwt', token, {
            httpOnly: true, // Prevents client-side access to the cookie
            secure: process.env.NODE_ENV === 'production', // Ensures it's sent over HTTPS in production
            sameSite: 'Strict', // Helps prevent CSRF attacks
            maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
        });

        logger.info(`Successful credentials: ${logging}`)

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    role: req.user.role,
                    messages: req.user?.messages
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile
};
