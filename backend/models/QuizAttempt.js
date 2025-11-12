const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        enum: ['math', 'science', 'english', 'arabic']
    },
    grade: {
        type: Number,
        required: true
    },
    // Questions asked in this attempt
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    // User's answers
    answers: {
        type: Map,
        of: String
    },
    // Score achieved
    score: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        default: 10
    },
    // Time taken in seconds
    timeTaken: {
        type: Number
    },
    // Is this the user's best score?
    isBestScore: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);