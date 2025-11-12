const mongoose = require('mongoose');
const XLSX = require('xlsx');
const dotenv = require('dotenv');
const Question = require('./models/Question');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.log('❌ MongoDB Error:', err);
        process.exit(1);
    });

// Import questions from Excel
async function importQuestions(filePath) {
    try {
        console.log('\n📚 Starting Question Import...\n');
        
        // Read Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // First sheet
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📊 Found ${data.length} questions in Excel file\n`);
        
        // Statistics
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // Clear existing questions (OPTIONAL - comment out to keep existing)
        console.log('🗑️  Clearing existing questions...');
        await Question.deleteMany({});
        console.log('✅ Existing questions cleared\n');
        
        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // +2 because Excel starts at 1 and header is row 1
            
            try {
                // Validate required fields
                if (!row.subject || !row.grade || !row.questionType) {
                    throw new Error('Missing required fields: subject, grade, or questionType');
                }
                
                if (!row.questionTextEn || !row.questionTextAr) {
                    throw new Error('Missing question text (English or Arabic)');
                }
                
                if (!row.correctAnswer) {
                    throw new Error('Missing correct answer');
                }
                
                // Prepare options array (only for multiple choice)
                let options = [];
                if (row.questionType === 'multiple_choice') {
                    options = [
                        row.option1,
                        row.option2,
                        row.option3,
                        row.option4
                    ].filter(opt => opt); // Remove empty options
                    
                    if (options.length < 2) {
                        throw new Error('Multiple choice questions need at least 2 options');
                    }
                }
                
                // Create question object
                const questionData = {
                    subject: row.subject.toLowerCase().trim(),
                    grade: parseInt(row.grade),
                    questionType: row.questionType.toLowerCase().trim(),
                    questionTextEn: row.questionTextEn.trim(),
                    questionTextAr: row.questionTextAr.trim(),
                    options: options,
                    correctAnswer: row.correctAnswer.toString().trim(),
                    imageUrl: row.imageUrl || null,
                    points: 1
                };
                
                // Validate subject
                const validSubjects = ['math', 'science', 'english', 'arabic'];
                if (!validSubjects.includes(questionData.subject)) {
                    throw new Error(`Invalid subject: ${questionData.subject}`);
                }
                
                // Validate grade
                if (questionData.grade < 4 || questionData.grade > 9) {
                    throw new Error(`Invalid grade: ${questionData.grade}`);
                }
                
                // Validate question type
                const validTypes = ['multiple_choice', 'true_false', 'text_input'];
                if (!validTypes.includes(questionData.questionType)) {
                    throw new Error(`Invalid question type: ${questionData.questionType}`);
                }
                
                // Insert into database
                await Question.create(questionData);
                successCount++;
                
                // Show progress every 100 questions
                if (successCount % 100 === 0) {
                    console.log(`✅ Imported ${successCount} questions...`);
                }
                
            } catch (error) {
                errorCount++;
                errors.push({
                    row: rowNumber,
                    subject: row.subject,
                    question: row.questionTextEn?.substring(0, 50) + '...',
                    error: error.message
                });
            }
        }
        
        // Final report
        console.log('\n' + '='.repeat(60));
        console.log('📊 IMPORT SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successfully imported: ${successCount} questions`);
        console.log(`❌ Errors: ${errorCount} questions`);
        console.log(`📈 Success rate: ${Math.round((successCount / data.length) * 100)}%`);
        console.log('='.repeat(60) + '\n');
        
        // Show breakdown by subject and grade
        const breakdown = await Question.aggregate([
            {
                $group: {
                    _id: { subject: '$subject', grade: '$grade' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.subject': 1, '_id.grade': 1 } }
        ]);
        
        console.log('📚 Questions by Subject and Grade:');
        console.log('-'.repeat(60));
        breakdown.forEach(item => {
            console.log(`${item._id.subject.toUpperCase()} - Grade ${item._id.grade}: ${item.count} questions`);
        });
        console.log('='.repeat(60) + '\n');
        
        // Show errors if any
        if (errors.length > 0) {
            console.log('❌ ERRORS FOUND:\n');
            errors.slice(0, 10).forEach(err => {
                console.log(`Row ${err.row} [${err.subject}]: ${err.error}`);
                console.log(`  Question: ${err.question}`);
                console.log('');
            });
            
            if (errors.length > 10) {
                console.log(`... and ${errors.length - 10} more errors\n`);
            }
        }
        
        console.log('✨ Import completed!\n');
        
    } catch (error) {
        console.error('❌ Import failed:', error);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('📴 Database connection closed');
    }
}

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
    console.log('❌ Please provide Excel file path');
    console.log('Usage: node import-questions.js path/to/questions.xlsx');
    process.exit(1);
}

// Run import
importQuestions(filePath);