const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        enum: ['math', 'science', 'english', 'arabic']
    },
    grade: {
        type: Number,
        required: true,
        enum: [4, 5, 6, 7, 8, 9]
    },
    questionType: {
        type: String,
        required: true,
        enum: ['multiple_choice', 'true_false', 'text_input']
    },
    // Question text in both languages
    questionTextEn: {
        type: String,
        required: true
    },
    questionTextAr: {
        type: String,
        required: true
    },
    // Image URL (optional)
    imageUrl: {
        type: String,
        default: null
    },
    // For multiple choice questions
    options: {
        type: [String],
        default: []
    },
    // Correct answer
    correctAnswer: {
        type: String,
        required: true
    },
    // Alternative correct answers (for text input with multiple valid answers)
    alternativeAnswers: {
        type: [String],
        default: []
    },
    // Points for this question
    points: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
    
});

// Index for faster queries
QuestionSchema.index({ subject: 1, grade: 1 });

module.exports = mongoose.model('Question', QuestionSchema);