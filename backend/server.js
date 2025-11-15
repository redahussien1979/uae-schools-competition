const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');

// Import User model and middleware
const User = require('./models/User');
const { protect } = require('./middleware/auth');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// ========================================
// ROUTES
// ========================================

// Root route
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'UAE Schools Competition API',
        version: '1.0.0'
    });
});

// ========================================
// REGISTER - Create new account
// ========================================
app.post('/register', async (req, res) => {
    try {
        const { username, password, fullName, grade, school } = req.body;
        
        // Validation
        if (!username || !password || !fullName || !grade || !school) {
            return res.json({ 
                success: false, 
                message: 'Please provide all fields' 
            });
        }

        if (password.length < 6) {
            return res.json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }
        
        // Check if username already exists
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.json({ 
                success: false, 
                message: 'Username already taken' 
            });
        }
        
        // Create new user (password will be hashed automatically)
        const user = await User.create({ 
            username: username.toLowerCase(),
            password,
            fullName,
            grade: parseInt(grade),
            school
        });
        
        // Generate token
        const token = generateToken(user._id);
        
        res.json({ 
            success: true, 
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                grade: user.grade,
                school: user.school
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.json({ 
            success: false, 
            message: 'Registration failed. Please try again.' 
        });
    }
});

// ========================================
// LOGIN - Sign in to account
// ========================================
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validation
        if (!username || !password) {
            return res.json({ 
                success: false, 
                message: 'Please provide username and password' 
            });
        }
        
        // Find user (include password for comparison)
        const user = await User.findOne({ username: username.toLowerCase() });
        
        if (!user) {
            return res.json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
        
        // Check password
        const isPasswordCorrect = await user.comparePassword(password);
        
        if (!isPasswordCorrect) {
            return res.json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
        
        // Update last login
        user.lastLogin = Date.now();
        await user.save();
        
        // Generate token
        const token = generateToken(user._id);
        
        res.json({ 
            success: true,
            message: 'Login successful',
            token,
            user: { 
                id: user._id,
                username: user.username, 
                fullName: user.fullName,
                grade: user.grade,
                school: user.school,
                bestScores: user.bestScores,
                totalBestScore: user.totalBestScore,
                totalAttempts: user.totalAttempts
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.json({ 
            success: false, 
            message: 'Login failed. Please try again.' 
        });
    }
});

// ========================================
// GET /me - Get current user info (PROTECTED)
// ========================================
app.get('/me', protect, async (req, res) => {
    try {
        // req.user is set by the protect middleware
        const user = req.user;
        
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                grade: user.grade,
                school: user.school,
                bestScores: user.bestScores,
                subjectAttempts: user.subjectAttempts,
                totalBestScore: user.totalBestScore,
                totalAttempts: user.totalAttempts,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.json({ 
            success: false, 
            message: 'Failed to get user info' 
        });
    }
});






// Import Question model at the top
const Question = require('./models/Question');
const QuizAttempt = require('./models/QuizAttempt');

// ========================================
// GET RANDOM QUIZ QUESTIONS (PROTECTED)
// ========================================
app.get('/quiz/start/:subject', protect, async (req, res) => {
    try {
        const { subject } = req.params;
        const userId = req.user._id;
        const userGrade = req.user.grade;
        
        // Validate subject
        const validSubjects = ['math', 'science', 'english', 'arabic'];
        if (!validSubjects.includes(subject)) {
            return res.json({ 
                success: false, 
                message: 'Invalid subject' 
            });
        }
        
        // Get 10 random questions for this subject and grade
        const questions = await Question.aggregate([
            { 
                $match: { 
                    subject: subject,
                    grade: userGrade
                } 
            },
            { $sample: { size: 10 } }
        ]);
        
        if (questions.length === 0) {
            return res.json({ 
                success: false, 
                message: 'No questions available for this subject and grade' 
            });
        }
        
        // Format questions (remove correct answers)
        const formattedQuestions = questions.map(q => ({
            id: q._id,
            questionType: q.questionType,
            questionTextEn: q.questionTextEn,
            questionTextAr: q.questionTextAr,
            imageUrl: q.imageUrl,
            options: q.options
        }));
        
        res.json({
            success: true,
            questions: formattedQuestions,
            subject: subject,
            totalQuestions: formattedQuestions.length,
            timeLimit: 900 // 15 minutes in seconds
        });
        
    } catch (error) {
        console.error('Get quiz error:', error);
        res.json({ 
            success: false, 
            message: 'Failed to load quiz' 
        });
    }
});

// ========================================
// SUBMIT QUIZ ANSWERS (PROTECTED)
// ========================================
app.post('/quiz/submit', protect, async (req, res) => {
    try {
        const { subject, answers, timeTaken } = req.body;
                console.log('Submit quiz - Subject:', subject);  // ← ADD THIS LINE FOR DEBUGGING

        const userId = req.user._id;
        
        // Validation
        if (!subject || !answers) {
            return res.json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }
        
        // Get the questions
        const questionIds = Object.keys(answers);
        const questions = await Question.find({ 
            _id: { $in: questionIds } 
        });
        
        // Calculate score
        let correctCount = 0;
        
        questions.forEach(question => {
            const userAnswer = answers[question._id.toString()];
            
            if (!userAnswer) return;
            
            // Check if answer is correct
            const isCorrect = checkAnswer(
                question.questionType,
                userAnswer,
                question.correctAnswer,
                question.alternativeAnswers
            );
            
            if (isCorrect) {
                correctCount++;
            }
        });
        
      //  const totalQuestions = questions.length;
                const totalQuestions = 10;

        const score = correctCount;
        const percentage = Math.round((score / totalQuestions) * 100);

        // Get user's current best score
        const user = await User.findById(userId);
        const currentBest = user.bestScores[subject] || 0;
        const isNewBest = score > currentBest;
        
        // Update user's best score if this is better
        if (isNewBest) {
            user.bestScores[subject] = score;
            await user.save();
        }
        
        // Increment attempts
        user.subjectAttempts[subject] = (user.subjectAttempts[subject] || 0) + 1;
        user.totalAttempts += 1;
        await user.save();
        
        // Save quiz attempt
        const quizAttempt = await QuizAttempt.create({
            user: userId,
            subject: subject,
            grade: user.grade,
            questions: questionIds,
            answers: answers,
            score: score,
            totalQuestions: totalQuestions,
            timeTaken: timeTaken || 0,
            isBestScore: isNewBest
        });
        
        res.json({
            success: true,
            score: score,
            totalQuestions: totalQuestions,
           // percentage: Math.round((score / totalQuestions) * 100),
               percentage: percentage,  // ← Use the variable we calculated above

           isNewBest: isNewBest,
            previousBest: currentBest,
            timeTaken: timeTaken,
            totalBestScore: user.totalBestScore,
            attemptId: quizAttempt._id
        });
        
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.json({ 
            success: false, 
            message: 'Failed to submit quiz' 
        });
    }
});

// Helper function to check if answer is correct
function checkAnswer(questionType, userAnswer, correctAnswer, alternativeAnswers = []) {
    // Normalize answers (trim, lowercase)
    const normalizedUserAnswer = userAnswer.toString().trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.toString().trim().toLowerCase();
    
    // Check main correct answer
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
        return true;
    }
    
    // Check alternative answers (for text input questions)
    if (alternativeAnswers && alternativeAnswers.length > 0) {
        return alternativeAnswers.some(alt => 
            alt.toString().trim().toLowerCase() === normalizedUserAnswer
        );
    }
    
    return false;
}

// ========================================
// ADD SAMPLE QUESTIONS (FOR TESTING)
// ========================================
app.get('/quiz/add-sample-questions', async (req, res) => {
    try {
        // Sample questions for testing
        const sampleQuestions = [
            // Grade 4 - Math
            {
                subject: 'math',
                grade: 4,
                questionType: 'multiple_choice',
                questionTextEn: 'What is 5 + 3?',
                questionTextAr: 'ما هو 5 + 3؟',
                options: ['6', '7', '8', '9'],
                correctAnswer: '8'
            },
            {
                subject: 'math',
                grade: 4,
                questionType: 'multiple_choice',
                questionTextEn: 'What is 10 - 4?',
                questionTextAr: 'ما هو 10 - 4؟',
                options: ['4', '5', '6', '7'],
                correctAnswer: '6'
            },
            // Add more sample questions for each subject/grade
            {
                subject: 'science',
                grade: 4,
                questionType: 'multiple_choice',
                questionTextEn: 'What do plants need to grow?',
                questionTextAr: 'ماذا تحتاج النباتات لتنمو؟',
                options: ['Water and sunlight', 'Only water', 'Only sunlight', 'Nothing'],
                correctAnswer: 'Water and sunlight'
            },
            {
                subject: 'english',
                grade: 4,
                questionType: 'multiple_choice',
                questionTextEn: 'What is the plural of "child"?',
                questionTextAr: 'ما هو جمع "child"؟',
                options: ['Childs', 'Children', 'Childes', 'Childer'],
                correctAnswer: 'Children'
            },
            {
                subject: 'arabic',
                grade: 4,
                questionType: 'multiple_choice',
                questionTextEn: 'What is the Arabic word for "book"?',
                questionTextAr: 'ما هي الكلمة العربية لـ "book"؟',
                options: ['كتاب', 'قلم', 'باب', 'كرسي'],
                correctAnswer: 'كتاب'
            }
        ];
        
        // Clear existing questions
        await Question.deleteMany({});
        
        // Insert sample questions
        await Question.insertMany(sampleQuestions);
        
        res.json({
            success: true,
            message: `Added ${sampleQuestions.length} sample questions`,
            count: sampleQuestions.length
        });
        
    } catch (error) {
        console.error('Add questions error:', error);
        res.json({ 
            success: false, 
            message: 'Failed to add questions' 
        });
    }
});








// ========================================
// POST /logout - Logout (PROTECTED)
// ========================================
app.post('/logout', protect, (req, res) => {
    // In a real app, you might want to blacklist the token
    // For now, just confirm logout
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// ========================================
// UPDATE SCORE - After quiz completion (PROTECTED)
// ========================================
app.post('/update-score', protect, async (req, res) => {
    try {
        const { subject, score } = req.body;
        const userId = req.user._id;
        
        // Validation
        if (!subject || score === undefined) {
            return res.json({ 
                success: false, 
                message: 'Please provide subject and score' 
            });
        }

        const validSubjects = ['math', 'science', 'english', 'arabic'];
        if (!validSubjects.includes(subject)) {
            return res.json({ 
                success: false, 
                message: 'Invalid subject' 
            });
        }
        
        const user = await User.findById(userId);
        
        // Increment attempts for this subject
        user.subjectAttempts[subject] += 1;
        user.totalAttempts += 1;
        
        // Update best score if new score is better
        if (score > user.bestScores[subject]) {
            user.bestScores[subject] = score;
        }
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Score updated successfully',
            newBestScore: user.bestScores[subject],
            totalBestScore: user.totalBestScore,
            isNewRecord: score > user.bestScores[subject]
        });
    } catch (error) {
        console.error('Update score error:', error);
        res.json({ 
            success: false, 
            message: 'Failed to update score' 
        });
    }
});



// ========================================
// GET TOP 5 LEADERBOARDS (PUBLIC)
// ========================================
app.get('/leaderboard/top5', async (req, res) => {
    try {
        // Get Top 5 Students (by total best score)
        const topStudents = await User.find()
            .select('fullName grade school totalBestScore')
            .sort({ totalBestScore: -1, createdAt: 1 })
            .limit(5);
        
        // Get Top 5 Schools (by average score)
        const schoolStats = await User.aggregate([
            {
                $group: {
                    _id: '$school',
                    averageScore: { $avg: '$totalBestScore' },
                    studentCount: { $sum: 1 },
                    totalScore: { $sum: '$totalBestScore' }
                }
            },
            { $sort: { averageScore: -1 } },
            { $limit: 5 }
        ]);
        
        // Format response
        const formattedStudents = topStudents.map((student, index) => ({
            rank: index + 1,
            name: student.fullName,
            grade: student.grade,
            school: student.school,
            score: student.totalBestScore,
            percentage: Math.round((student.totalBestScore / 40) * 100)
        }));
        
        const formattedSchools = schoolStats.map((school, index) => ({
            rank: index + 1,
            name: school._id,
            averageScore: Math.round(school.averageScore * 10) / 10,
            percentage: Math.round((school.averageScore / 40) * 100),
            studentCount: school.studentCount
        }));
        
        res.json({
            success: true,
            students: formattedStudents,
            schools: formattedSchools
        });
        
    } catch (error) {
        console.error('Get top 5 error:', error);
        res.json({
            success: false,
            message: 'Failed to get leaderboards'
        });
    }
});

// ========================================
// GET TOTAL STATISTICS (PUBLIC)
// ========================================
app.get('/stats', async (req, res) => {
    try {
        const totalStudents = await User.countDocuments();
        const totalSchools = await User.distinct('school').then(schools => schools.length);
        const totalQuestions = await Question.countDocuments();
        const totalAttempts = await QuizAttempt.countDocuments();
        
        res.json({
            success: true,
            stats: {
                totalStudents,
                totalSchools,
                totalQuestions,
                totalAttempts
            }
        });
        
    } catch (error) {
        console.error('Get stats error:', error);
        res.json({
            success: false,
            message: 'Failed to get statistics'
        });
    }
});





// ========================================
// GET ALL STUDENTS LEADERBOARD (PUBLIC)
// ========================================
app.get('/leaderboard/students', async (req, res) => {
    try {
        const { grade, subject, page = 1, limit = 20 } = req.query;
        
        let query = {};
        
        // Filter by grade if provided
        if (grade && grade !== 'all') {
            query.grade = parseInt(grade);
        }
        
        // Determine sort field based on subject
        let sortField = 'totalBestScore';
        if (subject && subject !== 'overall') {
            sortField = `bestScores.${subject}`;
        }
        
        // Get total count for pagination
        const totalCount = await User.countDocuments(query);
        
        // Get students with pagination
        const students = await User.find(query)
            .select('fullName grade school bestScores totalBestScore')
            .sort({ [sortField]: -1, createdAt: 1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        // Format response
        const formattedStudents = students.map((student, index) => {
            const score = subject && subject !== 'overall' 
                ? student.bestScores[subject] || 0
                : student.totalBestScore || 0;
            
            const maxScore = subject && subject !== 'overall' ? 10 : 40;
            const percentage = Math.round((score / maxScore) * 100);
            
            return {
                rank: ((parseInt(page) - 1) * parseInt(limit)) + index + 1,
                name: student.fullName,
                grade: student.grade,
                school: student.school,
                score: score,
                maxScore: maxScore,
                percentage: percentage
            };
        });
        
        res.json({
            success: true,
            students: formattedStudents,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount: totalCount,
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Get students leaderboard error:', error);
        res.json({
            success: false,
            message: 'Failed to get students leaderboard'
        });
    }
});

// ========================================
// GET ALL SCHOOLS LEADERBOARD (PUBLIC)
// ========================================
app.get('/leaderboard/schools', async (req, res) => {
    try {
        const { grade, subject, page = 1, limit = 20 } = req.query;
        
        let matchQuery = {};
        
        // Filter by grade if provided
        if (grade && grade !== 'all') {
            matchQuery.grade = parseInt(grade);
        }
        
        // Determine score field based on subject
        let scoreField = '$totalBestScore';
        if (subject && subject !== 'overall') {
            scoreField = `$bestScores.${subject}`;
        }
        
        // Aggregate schools
        const pipeline = [
            { $match: matchQuery },
            {
                $group: {
                    _id: '$school',
                    averageScore: { $avg: scoreField },
                    totalScore: { $sum: scoreField },
                    studentCount: { $sum: 1 }
                }
            },
            { $sort: { averageScore: -1 } }
        ];
        
        const allSchools = await User.aggregate(pipeline);
        
        // Apply pagination
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedSchools = allSchools.slice(startIndex, endIndex);
        
        // Format response
        const maxScore = subject && subject !== 'overall' ? 10 : 40;
        
        const formattedSchools = paginatedSchools.map((school, index) => {
            const percentage = Math.round((school.averageScore / maxScore) * 100);
            
            return {
                rank: startIndex + index + 1,
                name: school._id,
                averageScore: Math.round(school.averageScore * 10) / 10,
                percentage: percentage,
                studentCount: school.studentCount,
                maxScore: maxScore
            };
        });
        
        res.json({
            success: true,
            schools: formattedSchools,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(allSchools.length / parseInt(limit)),
                totalCount: allSchools.length,
                limit: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Get schools leaderboard error:', error);
        res.json({
            success: false,
            message: 'Failed to get schools leaderboard'
        });
    }
});














// Import Admin model and middleware
const Admin = require('./models/Admin');
const { protectAdmin } = require('./middleware/adminAuth');

// ========================================
// CREATE FIRST ADMIN (ONE-TIME SETUP)
// ========================================
app.post('/admin/setup', async (req, res) => {
    try {
        // Check if any admin exists
        const adminExists = await Admin.findOne({});
        
        if (adminExists) {
            return res.json({ 
                success: false, 
                message: 'Admin already exists. Use /admin/login instead.' 
            });
        }
        
        const { username, password, email } = req.body;
        
        // Create first admin
        const admin = await Admin.create({
            username,
            password,
            email,
            role: 'superadmin'
        });
        
        // Generate token
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });
        
        res.json({
            success: true,
            message: 'Admin account created successfully',
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
        
    } catch (error) {
        console.error('Admin setup error:', error);
        res.json({ 
            success: false, 
            message: 'Failed to create admin account' 
        });
    }
});

// ========================================
// ADMIN LOGIN
// ========================================
app.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.json({ 
                success: false, 
                message: 'Please provide username and password' 
            });
        }
        
        // Find admin
        const admin = await Admin.findOne({ username: username.toLowerCase() });
        
        if (!admin) {
            return res.json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // Check password
        const isMatch = await admin.comparePassword(password);
        
        if (!isMatch) {
            return res.json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // Update last login
        admin.lastLogin = Date.now();
        await admin.save();
        
        // Generate token
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
        
    } catch (error) {
        console.error('Admin login error:', error);
        res.json({ 
            success: false, 
            message: 'Login failed' 
        });
    }
});

// ========================================
// GET ALL USERS (ADMIN ONLY)
// ========================================
app.get('/admin/users', protectAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', grade = '' } = req.query;
        
        let query = {};
        
        if (search) {
            query.$or = [
                { fullName: new RegExp(search, 'i') },
                { username: new RegExp(search, 'i') },
                { school: new RegExp(search, 'i') }
            ];
        }
        
        if (grade) {
            query.grade = parseInt(grade);
        }
        
        const totalUsers = await User.countDocuments(query);
        
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        res.json({
            success: true,
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalUsers / parseInt(limit)),
                totalUsers
            }
        });
        
    } catch (error) {
        console.error('Get users error:', error);
        res.json({ 
            success: false, 
            message: 'Failed to get users' 
        });
    }
});

// ========================================
// GET ALL QUIZ ATTEMPTS (ADMIN ONLY)
// ========================================
app.get('/admin/attempts', protectAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        
        const totalAttempts = await QuizAttempt.countDocuments();
        
        const attempts = await QuizAttempt.find()
            .populate('user', 'fullName username grade school')
            .sort({ completedAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        res.json({
            success: true,
            attempts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalAttempts / parseInt(limit)),
                totalAttempts
            }
        });
        
    } catch (error) {
        console.error('Get attempts error:', error);
        res.json({ 
            success: false, 
            message: 'Failed to get quiz attempts' 
        });
    }
});



// ========================================
// GET ALL QUESTIONS (ADMIN ONLY) - WITH FILTERS
// ========================================
app.get('/admin/questions', protectAdmin, async (req, res) => {
    try {
     //   const { page = 1, limit = 50, subject = '', grade = '', search = '' } = req.query;
       const { page = 1, limit = 50, subject = '', grade = '', search = '', recent = '' } = req.query; 
        let query = {};
        
        // Filter by subject
        if (subject) {
            query.subject = subject.toLowerCase();
        }
        
        // Filter by grade
        if (grade) {
            query.grade = parseInt(grade);
        }
        
        // Search in question text
        if (search) {
            query.$or = [
                { questionTextEn: new RegExp(search, 'i') },
                { questionTextAr: new RegExp(search, 'i') }
            ];
        }
        // Filter by recent date (ADD THIS ENTIRE SECTION)
if (recent) {
    const now = new Date();
    let minutesAgo = 0;
    
    switch(recent) {
        case '15min':
            minutesAgo = 15;
            break;
        case '30min':
            minutesAgo = 30;
            break;
        case '1hour':
            minutesAgo = 60;
            break;
        case '2hours':
            minutesAgo = 120;
            break;
        case '3hours':
            minutesAgo = 180;
            break;
        case '6hours':
            minutesAgo = 360;
            break;
        case '12hours':
            minutesAgo = 720;
            break;
        case '24hours':
            minutesAgo = 1440;
            break;
    }
    
    if (minutesAgo > 0) {
        const startDate = new Date(now.getTime() - minutesAgo * 60 * 1000);
        query.createdAt = { $gte: startDate };
        console.log(`[ADMIN] Filtering questions after: ${startDate.toISOString()}`);
    }
}
        console.log('[ADMIN] Loading questions with filters:', query);
        
        const totalQuestions = await Question.countDocuments(query);
        
        const questions = await Question.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        console.log(`[ADMIN] Found ${questions.length} questions (total: ${totalQuestions})`);
        
        res.json({
            success: true,
            questions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalQuestions / parseInt(limit)),
                totalQuestions
            }
        });
        
    } catch (error) {
        console.error('[ADMIN] Get questions error:', error);
        res.json({
            success: false,
            message: 'Failed to get questions'
        });
    }
});


// ========================================
// DELETE QUESTION (ADMIN ONLY)
// ========================================
app.delete('/admin/questions/:id', protectAdmin, async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        
        if (!question) {
            return res.json({ 
                success: false, 
                message: 'Question not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Question deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete question error:', error);
        res.json({ 
            success: false, 
            message: 'Failed to delete question' 
        });
    }
});

// ========================================
// GET ADMIN STATISTICS
// ========================================
app.get('/admin/stats', protectAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalQuestions = await Question.countDocuments();
        const totalAttempts = await QuizAttempt.countDocuments();
        const totalSchools = await User.distinct('school').then(schools => schools.length);
        
        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        const recentAttempts = await QuizAttempt.countDocuments({ completedAt: { $gte: sevenDaysAgo } });
        
        // Questions by subject
        const questionsBySubject = await Question.aggregate([
            { $group: { _id: '$subject', count: { $sum: 1 } } }
        ]);
        
        // Users by grade
        const usersByGrade = await User.aggregate([
            { $group: { _id: '$grade', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        res.json({
            success: true,
            stats: {
                totalUsers,
                totalQuestions,
                totalAttempts,
                totalSchools,
                recentUsers,
                recentAttempts,
                questionsBySubject,
                usersByGrade
            }
        });
        
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.json({ 
            success: false, 
            message: 'Failed to get statistics' 
        });
    }
});












// ========================================
// ADD NEW QUESTION (ADMIN ONLY)
// ========================================
app.post('/admin/questions', protectAdmin, async (req, res) => {
    try {
        const {
            subject,
            grade,
            questionType,
            questionTextEn,
            questionTextAr,
            options,
            correctAnswer,
            imageUrl
        } = req.body;
        
        // Validate required fields
        if (!subject || !grade || !questionType || !questionTextEn || !questionTextAr || !correctAnswer) {
            return res.json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Create question
        const question = await Question.create({
            subject: subject.toLowerCase(),
            grade: parseInt(grade),
            questionType,
            questionTextEn,
            questionTextAr,
            options: options || [],
            correctAnswer,
            imageUrl: imageUrl || null,
            points: 1
        });
        
        res.json({
            success: true,
            message: 'Question added successfully',
            question
        });
        
    } catch (error) {
        console.error('Add question error:', error);
        res.json({
            success: false,
            message: 'Failed to add question'
        });
    }
});

// ========================================
// UPDATE QUESTION (ADMIN ONLY)
// ========================================
app.put('/admin/questions/:id', protectAdmin, async (req, res) => {
    try {
        const {
            subject,
            grade,
            questionType,
            questionTextEn,
            questionTextAr,
            options,
            correctAnswer,
            imageUrl
        } = req.body;
        
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            {
                subject: subject?.toLowerCase(),
                grade: parseInt(grade),
                questionType,
                questionTextEn,
                questionTextAr,
                options: options || [],
                correctAnswer,
                imageUrl: imageUrl || null
            },
            { new: true, runValidators: true }
        );
        
        if (!question) {
            return res.json({
                success: false,
                message: 'Question not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Question updated successfully',
            question
        });
        
    } catch (error) {
        console.error('Update question error:', error);
        res.json({
            success: false,
            message: 'Failed to update question'
        });
    }
});

// ========================================
// GET SINGLE QUESTION (ADMIN ONLY)
// ========================================
app.get('/admin/questions/:id', protectAdmin, async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        
        if (!question) {
            return res.json({
                success: false,
                message: 'Question not found'
            });
        }
        
        res.json({
            success: true,
            question
        });
        
    } catch (error) {
        console.error('Get question error:', error);
        res.json({
            success: false,
            message: 'Failed to get question'
        });
    }
});

// ========================================
// IMPORT QUESTIONS FROM EXCEL (ADMIN ONLY)
// ========================================
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept only xlsx and xls files
        if (file.originalname.match(/\.(xlsx|xls)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'), false);
        }
    }
});

app.post('/admin/import-questions', protectAdmin, upload.single('file'), async (req, res) => {
    try {
        console.log('[ADMIN] Starting Excel import...');

        if (!req.file) {
            return res.json({ success: false, message: 'No file uploaded' });
        }

        // Read Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`[ADMIN] Found ${data.length} rows in Excel`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Optional: Clear existing questions (comment out if you want to keep them)
        // await Question.deleteMany({});
        // console.log('[ADMIN] Cleared existing questions');

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel row number (accounting for header)

            try {
                // Validate required fields
                if (!row.subject || !row.grade || !row.questionType ||
                    !row.questionTextEn || !row.questionTextAr || !row.correctAnswer) {
                    throw new Error('Missing required fields');
                }

                // Prepare options for multiple choice
                let options = [];
                if (row.questionType.toLowerCase() === 'multiple_choice') {
                    // Keep LaTeX formatting in options
                    options = [
                        row.option1,
                        row.option2,
                        row.option3,
                        row.option4
                    ].filter(opt => opt && opt.toString().trim() !== '');

                    if (options.length < 2) {
                        throw new Error('Multiple choice needs at least 2 options');
                    }
                }

                // IMPORTANT: Clean correctAnswer - STRIP ALL LATEX DELIMITERS
                let cleanAnswer = row.correctAnswer.toString().trim();

                // Remove $ delimiters
                cleanAnswer = cleanAnswer.replace(/^\$+/, '').replace(/\$+$/, '');

                // Remove \( and \) delimiters
                cleanAnswer = cleanAnswer.replace(/^\\\(+/, '').replace(/\\\)+$/, '');

                // Remove \[ and \] delimiters (display math)
                cleanAnswer = cleanAnswer.replace(/^\\\[+/, '').replace(/\\\]+$/, '');

                // Final trim
                cleanAnswer = cleanAnswer.trim();

                console.log(`[ADMIN] Row ${rowNumber}: Original answer="${row.correctAnswer}" -> Clean answer="${cleanAnswer}"`);

                // Validate subject
                const validSubjects = ['math', 'science', 'english', 'arabic'];
                const subject = row.subject.toLowerCase().trim();
                if (!validSubjects.includes(subject)) {
                    throw new Error(`Invalid subject: ${subject}`);
                }

                // Validate grade
                const grade = parseInt(row.grade);
                if (grade < 4 || grade > 9) {
                    throw new Error(`Invalid grade: ${grade}`);
                }

                // Validate question type
                const validTypes = ['multiple_choice', 'true_false', 'text_input'];
                const questionType = row.questionType.toLowerCase().trim();
                if (!validTypes.includes(questionType)) {
                    throw new Error(`Invalid question type: ${questionType}`);
                }

                // Create question (KEEP LaTeX in question text, but CLEAN in correctAnswer)
                await Question.create({
                    subject: subject,
                    grade: grade,
                    questionType: questionType,
                    questionTextEn: row.questionTextEn.trim(), // Keep LaTeX formatting
                    questionTextAr: row.questionTextAr.trim(), // Keep LaTeX formatting
                    options: options, // Keep LaTeX formatting in options
                    correctAnswer: cleanAnswer, // CLEANED - no LaTeX delimiters
                    imageUrl: row.imageUrl || null,
                    points: 1
                });

                successCount++;

                // Log progress every 50 questions
                if (successCount % 50 === 0) {
                    console.log(`[ADMIN] Imported ${successCount} questions...`);
                }

            } catch (error) {
                errorCount++;
                errors.push({
                    row: rowNumber,
                    question: row.questionTextEn?.substring(0, 50) + '...',
                    error: error.message
                });
                console.error(`[ADMIN] Error on row ${rowNumber}:`, error.message);
            }
        }

        // Delete uploaded file
        fs.unlinkSync(req.file.path);

        console.log(`[ADMIN] Import complete: ${successCount} success, ${errorCount} errors`);

        res.json({
            success: true,
            message: `Import completed: ${successCount} questions imported, ${errorCount} errors`,
            successCount,
            errorCount,
            errors: errors.slice(0, 20) // Return first 20 errors
        });

    } catch (error) {
        console.error('[ADMIN] Import failed:', error);

        // Clean up file if exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: false,
            message: 'Import failed: ' + error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.MONGODB_URI}`);
    console.log(`✨ UAE Schools Competition Backend Ready!\n`);
});