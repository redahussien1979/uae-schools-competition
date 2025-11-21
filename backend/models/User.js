const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema - Database Structure
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    grade: {
        type: Number,
        required: true,
        enum: [4, 5, 6, 7, 8, 9]
    },
    school: {
        type: String,
        required: true
    },
    // Best scores for each subject
    bestScores: {
        math: { type: Number, default: 0 },
        science: { type: Number, default: 0 },
        english: { type: Number, default: 0 },
        arabic: { type: Number, default: 0 }
    },
    // Track attempts for each subject
    subjectAttempts: {
        math: { type: Number, default: 0 },
        science: { type: Number, default: 0 },
        english: { type: Number, default: 0 },
        arabic: { type: Number, default: 0 }
    },
    // Stars earned per subject (cumulative from all attempts)
    starsPerSubject: {
        math: { type: Number, default: 0 },
        science: { type: Number, default: 0 },
        english: { type: Number, default: 0 },
        arabic: { type: Number, default: 0 }
    },
    // Total stars (sum of all subjects)
    totalStars: {
        type: Number,
        default: 0
    },
    // Total statistics
    totalBestScore: {
        type: Number,
        default: 0
    },
    totalAttempts: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate total best score and total stars automatically
UserSchema.pre('save', function(next) {
    this.totalBestScore =
        this.bestScores.math +
        this.bestScores.science +
        this.bestScores.english +
        this.bestScores.arabic;

    this.totalStars =
        this.starsPerSubject.math +
        this.starsPerSubject.science +
        this.starsPerSubject.english +
        this.starsPerSubject.arabic;
    next();
});

module.exports = mongoose.model('User', UserSchema);
