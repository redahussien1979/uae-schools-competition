const mongoose = require('mongoose');

async function migrateGrades() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/uae-schools-quiz', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✓ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('questions');

        // Check for old format questions (with 'grade' field)
        const oldFormatCount = await collection.countDocuments({ grade: { $exists: true } });
        console.log(`\n📊 Found ${oldFormatCount} questions with old 'grade' field`);

        if (oldFormatCount === 0) {
            console.log('✓ No migration needed - all questions already use grades array');
            await mongoose.connection.close();
            return;
        }

        // Show sample of old format
        const sample = await collection.findOne({ grade: { $exists: true } });
        if (sample) {
            console.log('\n📝 Sample old format:');
            console.log(`   Subject: ${sample.subject}, Grade: ${sample.grade}`);
        }

        console.log('\n🔄 Starting migration...');

        // Migrate: Convert grade (number) to grades (array)
        const result = await collection.updateMany(
            { grade: { $exists: true } },
            [
                {
                    $set: {
                        grades: { $cond: [{ $isArray: "$grade" }, "$grade", ["$grade"]] }
                    }
                },
                {
                    $unset: "grade"
                }
            ]
        );

        console.log(`✓ Migrated ${result.modifiedCount} questions`);

        // Verify migration
        const newFormatCount = await collection.countDocuments({ grades: { $exists: true } });
        const stillOldFormat = await collection.countDocuments({ grade: { $exists: true } });

        console.log('\n📊 Verification:');
        console.log(`   Questions with grades array: ${newFormatCount}`);
        console.log(`   Questions with old grade field: ${stillOldFormat}`);

        // Show sample of new format
        const newSample = await collection.findOne({ grades: { $exists: true } });
        if (newSample) {
            console.log('\n📝 Sample new format:');
            console.log(`   Subject: ${newSample.subject}, Grades: [${newSample.grades.join(', ')}]`);
        }

        console.log('\n✅ Migration completed successfully!');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run migration
migrateGrades();
