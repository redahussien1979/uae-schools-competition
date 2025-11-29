const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        enum: ['math', 'science', 'english', 'arabic']
    },
    grades: {
        type: [Number],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0 && v.every(g => [4, 5, 6, 7, 8, 9].includes(g));
            },
            message: 'Must have at least one grade, and all grades must be between 4-9'
        }
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
      // Image position (above or below question text)
    imagePosition: {
        type: String,
        enum: ['above', 'below'],
        default: 'below'
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
QuestionSchema.index({ subject: 1, grades: 1 });

module.exports = mongoose.model('Question', QuestionSchema);
