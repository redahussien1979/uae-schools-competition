/* ============================================
   Results Page JavaScript
   ============================================ */

let resultsData = null;
let currentSubject = '';
let currentAttemptId = null;

// ===== DEBUG MODE =====
const DEBUG = true;
function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data || '');
    }
}

// Helper function to create a styled fraction using HTML/CSS
function createFraction(numerator, denominator) {
    return `<span class="fraction"><span class="numerator">${numerator}</span><span class="denominator">${denominator}</span></span>`;
}

// Load results when page loads
window.addEventListener('DOMContentLoaded', function() {
    debugLog('Page loaded, calling loadResults()');
    loadResults();
});

// Load quiz results
function loadResults() {
    debugLog('loadResults() called');

    // Get results from localStorage (stored by quiz.js)
    const resultsStr = localStorage.getItem('quizResults');
    debugLog('quizResults from localStorage:', resultsStr);

    if (!resultsStr) {
        debugLog('ERROR: No quiz results found in localStorage');
        alert('No quiz results found');
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        resultsData = JSON.parse(resultsStr);
        debugLog('Parsed resultsData:', resultsData);

        // Save attemptId for viewing details later
        currentAttemptId = resultsData.attemptId;
        debugLog('Current attemptId:', currentAttemptId);

        // Get subject from URL or results
        const urlParams = new URLSearchParams(window.location.search);
        currentSubject = urlParams.get('subject') || 'math';
        debugLog('Current subject:', currentSubject);

        // Display results
        debugLog('Calling displayResults()');
        displayResults();

        // Clear results from localStorage
        localStorage.removeItem('quizResults');
        debugLog('Results cleared from localStorage');

    } catch (error) {
        debugLog('CRITICAL ERROR in loadResults():', error);
        console.error('Error loading results:', error);
        alert('Failed to load results: ' + error.message);
        window.location.href = 'dashboard.html';
    }
}

// Display results
function displayResults() {
    debugLog('displayResults() started');
    try {
        debugLog('Extracting data from resultsData');
        const { score, totalQuestions, percentage, isNewBest, previousBest, timeTaken, totalBestScore, starsEarned, totalStars } = resultsData;
        debugLog('Extracted values:', { score, totalQuestions, percentage, isNewBest, previousBest, timeTaken, totalBestScore, starsEarned, totalStars });

        // Set subject info
        debugLog('Setting subject info');
        setSubjectInfo(currentSubject);

        // Display score using CSS fractions (instant, no delay!)
        debugLog('Displaying score');
        const scoreEl = document.getElementById('scoreDisplay');
        const percentageEl = document.getElementById('percentageDisplay');

        // Set fractions using CSS styling
        scoreEl.innerHTML = createFraction(score, totalQuestions);
        percentageEl.textContent = `${percentage}%`;

        debugLog('Score set with CSS fraction');

        // Display stars earned
        debugLog('Displaying stars earned');
        const starsEarnedEl = document.getElementById('starsEarned');
        if (starsEarnedEl) {
            starsEarnedEl.textContent = `+${starsEarned || 0} ⭐`;
            debugLog('Stars earned set:', starsEarned);
        }

        // Display total stars
        debugLog('Displaying total stars');
        const totalStarsEl = document.getElementById('totalStarsResult');
        if (totalStarsEl) {
            totalStarsEl.textContent = `${totalStars || 0} ⭐`;
            debugLog('Total stars set:', totalStars);
        }

        // Display comparison using CSS fractions
        debugLog('Displaying comparison scores');
        document.getElementById('currentScoreText').innerHTML = createFraction(score, totalQuestions);
        document.getElementById('previousBestText').innerHTML = createFraction(previousBest, totalQuestions);

        // Display time taken
        debugLog('Displaying time taken');
        document.getElementById('timeTaken').textContent = formatTime(timeTaken);

        // Display total best score using CSS fractions
        debugLog('Displaying total best score');
        document.getElementById('totalBestScore').innerHTML = createFraction(totalBestScore, 40);
        const overallPercentage = Math.round((totalBestScore / 40) * 100);
        document.getElementById('overallPercentage').textContent = `${overallPercentage}%`;
        debugLog('Overall percentage calculated:', overallPercentage);

        // Handle new record
        debugLog('Checking if new best:', isNewBest);
        if (isNewBest) {
            debugLog('Showing new record celebration');
            showNewRecordCelebration();
        } else {
            debugLog('Showing regular results');
            showRegularResults();
        }

        // Show encouragement message
        debugLog('Showing encouragement message');
        showEncouragementMessage(percentage, isNewBest);

// Reveal all score elements with smooth transition
document.querySelectorAll('.score-loading').forEach(el => {
    el.classList.remove('score-loading');
    el.classList.add('score-loaded');
});


       
        debugLog('displayResults() completed successfully!');
    } catch (error) {
        debugLog('CRITICAL ERROR in displayResults():', error);
        debugLog('Error stack:', error.stack);
        console.error('Error displaying results:', error);
        alert('Error displaying results: ' + error.message + '\n\nCheck console for details.');
    }
}

// Set subject information
function setSubjectInfo(subject) {
    debugLog('setSubjectInfo called with subject:', subject);

    const subjectInfo = {
        'math': {
            en: 'Mathematics',
            ar: 'الرياضيات',
            icon: 'calculator-fill',
            color: 'primary'
        },
        'science': {
            en: 'Science',
            ar: 'العلوم',
            icon: 'flask',
            color: 'success'
        },
        'english': {
            en: 'English',
            ar: 'اللغة الإنجليزية',
            icon: 'book-fill',
            color: 'danger'
        },
        'arabic': {
            en: 'Arabic',
            ar: 'اللغة العربية',
            icon: 'chat-square-text-fill',
            color: 'warning'
        }
    };

    const info = subjectInfo[subject] || subjectInfo.math;
    debugLog('Subject info:', info);

    // Update subject name
    const nameEl = document.querySelector('#subjectName span:last-child');
    if (nameEl) {
        nameEl.setAttribute('data-en', info.en);
        nameEl.setAttribute('data-ar', info.ar);
        nameEl.textContent = currentLanguage === 'ar' ? info.ar : info.en;
        debugLog('Subject name updated');
    }

    // Update icon
    const iconEl = document.getElementById('subjectIcon');
    if (iconEl) {
        iconEl.className = `bi bi-${info.icon} me-2 text-${info.color}`;
        debugLog('Icon updated');
    }
}

// Show new record celebration
function showNewRecordCelebration() {
    const titleEl = document.getElementById('resultTitle');
    const iconEl = document.getElementById('resultIcon');
    const iconContainer = document.getElementById('resultIconContainer');

    titleEl.setAttribute('data-en', '🎉 NEW RECORD! 🎉');
    titleEl.setAttribute('data-ar', '🎉 رقم قياسي جديد! 🎉');
    titleEl.textContent = currentLanguage === 'ar' ? '🎉 رقم قياسي جديد! 🎉' : '🎉 NEW RECORD! 🎉';
    titleEl.classList.add('text-success');

    iconEl.classList.remove('text-warning');
    iconEl.classList.add('text-success');
    iconContainer.classList.add('result-success');

    const comparisonCard = document.getElementById('comparisonCard');
    comparisonCard.classList.add('border', 'border-success', 'border-3');

    try {
        const scoreCard = document.querySelector('.card.shadow-lg');
        if (scoreCard && !document.querySelector('.new-record-ribbon')) {
            const ribbon = document.createElement('div');
            ribbon.className = 'new-record-ribbon';
            ribbon.textContent = currentLanguage === 'ar' ? 'رقم قياسي جديد' : 'NEW RECORD';
            scoreCard.appendChild(ribbon);
        }
    } catch (err) {
        console.warn('Could not add ribbon:', err);
    }

    showConfetti();
}

// Show regular results
function showRegularResults() {
    const titleEl = document.getElementById('resultTitle');
    titleEl.setAttribute('data-en', 'Quiz Completed!');
    titleEl.setAttribute('data-ar', 'اكتمل الاختبار!');
    titleEl.textContent = currentLanguage === 'ar' ? 'اكتمل الاختبار!' : 'Quiz Completed!';
}

// Show encouragement message
function showEncouragementMessage(percentage, isNewBest) {
    const messageEl = document.getElementById('encouragementMessage');

    let messageEn, messageAr;

    if (isNewBest) {
        messageEn = "Congratulations! You've set a new personal record! Keep up the excellent work!";
        messageAr = "تهانينا! لقد حققت رقماً قياسياً جديداً! استمر في العمل الممتاز!";
    } else if (percentage === 100) {
        messageEn = "Perfect score! You've mastered this subject!";
        messageAr = "درجة كاملة! لقد أتقنت هذه المادة!";
    } else if (percentage >= 80) {
        messageEn = "Great job! You're doing very well!";
        messageAr = "عمل رائع! أنت تقوم بعمل جيد جداً!";
    } else if (percentage >= 60) {
        messageEn = "Good effort! Keep practicing to improve your score!";
        messageAr = "جهد جيد! استمر في الممارسة لتحسين درجتك!";
    } else {
        messageEn = "Don't give up! Practice makes perfect. Try again!";
        messageAr = "لا تستسلم! الممارسة تصنع الكمال. حاول مرة أخرى!";
    }

    messageEl.setAttribute('data-en', messageEn);
    messageEl.setAttribute('data-ar', messageAr);
    messageEl.textContent = currentLanguage === 'ar' ? messageAr : messageEn;
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Retry quiz
function retryQuiz() {
    window.location.href = `quiz.html?subject=${currentSubject}`;
}

// Show confetti animation
function showConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = [];
    const confettiCount = 150;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];

    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * confettiCount,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 10,
            tiltAngleIncremental: Math.random() * 0.07 + 0.05,
            tiltAngle: 0
        });
    }

    let animationFrame;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        confetti.forEach((particle, index) => {
            ctx.beginPath();
            ctx.lineWidth = particle.r / 2;
            ctx.strokeStyle = particle.color;
            ctx.moveTo(particle.x + particle.tilt + particle.r / 4, particle.y);
            ctx.lineTo(particle.x + particle.tilt, particle.y + particle.tilt + particle.r / 4);
            ctx.stroke();

            particle.tiltAngle += particle.tiltAngleIncremental;
            particle.y += (Math.cos(particle.d) + 3 + particle.r / 2) / 2;
            particle.tilt = Math.sin(particle.tiltAngle - index / 3) * 15;

            if (particle.y > canvas.height) {
                confetti.splice(index, 1);
            }
        });

        if (confetti.length > 0) {
            animationFrame = requestAnimationFrame(draw);
        } else {
            canvas.style.display = 'none';
            cancelAnimationFrame(animationFrame);
        }
    }

    draw();

    setTimeout(() => {
        canvas.style.display = 'none';
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    }, 5000);
}

// ===== QUIZ ATTEMPT DETAILS FUNCTIONS =====

/**
 * View quiz attempt details in modal
 */
async function viewAttemptDetails() {
    if (!currentAttemptId) {
        alert(currentLanguage === 'ar' ? 'معرف المحاولة غير متاح' : 'Attempt ID not available');
        return;
    }

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('quizDetailsModal'));
    modal.show();

    // Reset container to loading state
    const questionsContainer = document.getElementById('detailQuestionsContainer');
    questionsContainer.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">${currentLanguage === 'ar' ? 'جاري تحميل الأسئلة...' : 'Loading questions...'}</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/analytics/${currentAttemptId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.attempt) {
            const attempt = data.attempt;
            const questions = data.questions || [];

            // Populate quiz summary
            document.getElementById('detailSubject').textContent = attempt.subject.charAt(0).toUpperCase() + attempt.subject.slice(1);
            document.getElementById('detailScore').innerHTML = `<strong class="${attempt.score >= 8 ? 'text-success' : attempt.score >= 6 ? 'text-warning' : 'text-danger'}">${attempt.score}/10</strong> (${Math.round((attempt.score / 10) * 100)}%)`;

            const seconds = attempt.timeTaken || 0;
            const minutes = Math.floor(seconds / 60);
            const remainingSecs = Math.round(seconds % 60);
            document.getElementById('detailTimeTaken').textContent = `${minutes}m ${remainingSecs}s`;

            document.getElementById('detailDate').textContent = new Date(attempt.completedAt).toLocaleString();

            // Display questions with answers
            displayQuizQuestions(questions);

        } else {
            questionsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    ${data.message || (currentLanguage === 'ar' ? 'فشل تحميل تفاصيل الاختبار' : 'Failed to load quiz details')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Load quiz details error:', error);
        questionsContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle me-2"></i>
                ${currentLanguage === 'ar' ? 'فشل تحميل تفاصيل الاختبار. يرجى المحاولة مرة أخرى.' : 'Failed to load quiz details. Please try again.'}
            </div>
        `;
    }
}

/**
 * Display questions with user answers in the modal
 */
function displayQuizQuestions(questions) {
    const container = document.getElementById('detailQuestionsContainer');

    if (!questions || questions.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${currentLanguage === 'ar' ? 'لم يتم العثور على أسئلة لهذه المحاولة.' : 'No questions found for this quiz attempt.'}
            </div>
        `;
        return;
    }

    let html = '';

    questions.forEach((q, index) => {
        const isCorrect = q.isCorrect;
        const bgClass = isCorrect ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger';
        const iconClass = isCorrect ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger';

        // Clean question text (remove GROUP and PARAGRAPH tags)
        let questionText = (q.questionTextEn || q.questionTextAr || '').replace(/\[GROUP:[^\]]+\]/g, '').replace(/\[PARAGRAPH\][\s\S]*?\[\/PARAGRAPH\]/g, '').trim();

        // Use the correct language for question text
        if (currentLanguage === 'ar' && q.questionTextAr) {
            questionText = q.questionTextAr.replace(/\[GROUP:[^\]]+\]/g, '').replace(/\[PARAGRAPH\][\s\S]*?\[\/PARAGRAPH\]/g, '').trim();
        }

        html += `
            <div class="card mb-3 ${bgClass}" style="border-width: 2px;">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">
                            <span class="badge bg-secondary me-2">${currentLanguage === 'ar' ? 'س' : 'Q'}${index + 1}</span>
                            ${questionText.substring(0, 150)}${questionText.length > 150 ? '...' : ''}
                        </h6>
                        <i class="bi ${iconClass}" style="font-size: 1.5rem;"></i>
                    </div>

                    ${q.imageUrl ? `<img src="${q.imageUrl}" class="img-fluid rounded mb-3" style="max-height: 200px;">` : ''}

                    <div class="row">
                        <div class="col-md-6">
                            <p class="mb-1"><strong>${currentLanguage === 'ar' ? 'إجابتك:' : "Your Answer:"}</strong></p>
                            <p class="mb-0 ${isCorrect ? 'text-success' : 'text-danger'}">
                                <i class="bi ${isCorrect ? 'bi-check' : 'bi-x'} me-1"></i>
                                ${q.userAnswer || `<em>${currentLanguage === 'ar' ? 'لم يتم تقديم إجابة' : 'No answer provided'}</em>`}
                            </p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-1"><strong>${currentLanguage === 'ar' ? 'الإجابة الصحيحة:' : "Correct Answer:"}</strong></p>
                            <p class="mb-0 text-success">
                                <i class="bi bi-check-circle me-1"></i>
                                ${q.correctAnswer}
                            </p>
                        </div>
                    </div>

                    ${q.questionType === 'multiple_choice' && q.options && q.options.length > 0 ? `
                        <div class="mt-3">
                            <p class="mb-2"><strong>${currentLanguage === 'ar' ? 'الخيارات:' : 'Options:'}</strong></p>
                            <div class="row">
                                ${q.options.map((opt, idx) => {
                                    const label = String.fromCharCode(65 + idx);
                                    const isThisCorrect = opt.toLowerCase().trim() === (q.correctAnswer || '').toLowerCase().trim();
                                    const isUserAnswer = opt.toLowerCase().trim() === (q.userAnswer || '').toLowerCase().trim();
                                    let optClass = '';
                                    if (isThisCorrect) optClass = 'text-success fw-bold';
                                    if (isUserAnswer && !isThisCorrect) optClass = 'text-danger';
                                    return `<div class="col-6"><span class="${optClass}">${label}. ${opt}</span></div>`;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Render MathJax for LaTeX if available
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([container]).catch((err) => console.log('MathJax error:', err));
    }
}
