const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware - Security Guard
const protect = async (req, res, next) => {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // No token = not allowed
    if (!token) {
        return res.json({ 
            success: false, 
            message: 'Not authorized. Please login.' 
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database (without password)
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        next(); // Allow access
    } catch (error) {
        return res.json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

module.exports = { protect };