
// src/models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    messages: {
        type: [{
            name: String,
            messages: String,
            documentId: String,
        }],
        default: []
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }

    next();
});

// Method to generate auth token
userSchema.methods.generateAuthToken = function () {
    const user = this;
    const token = jwt.sign({ id: user._id.toString() }, jwtSecret, {
        expiresIn: '24h'
    });

    return token;
};

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
