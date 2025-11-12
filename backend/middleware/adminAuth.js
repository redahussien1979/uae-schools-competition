const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Protect admin routes
exports.protectAdmin = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.json({ 
            success: false, 
            message: 'Not authorized. Admin access only.' 
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get admin from database
        req.admin = await Admin.findById(decoded.id).select('-password');
        
        if (!req.admin) {
            return res.json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }

        next();
    } catch (error) {
        return res.json({ 
            success: false, 
            message: 'Invalid admin token' 
        });
    }
};