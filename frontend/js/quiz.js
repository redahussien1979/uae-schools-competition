
/* ============================================
   Quiz Page JavaScript
   ============================================ */

// Use API_URL from config.js (set globally)
//const API_URL = window.API_URL || 'http://localhost:5000';

let currentQuizData = {
    subject: '',
    questions: [],
    currentIndex: 0,
    answers: {},
    shuffledOptions: {}, // Store shuffled options per question ID for consistency
    startTime: null,
    timerInterval: null,
    timeLimit: 900 // 15 minutes in seconds
};

/**
 * Detect if text contains Arabic characters
 * Returns true if text is Arabic - used for RTL/LTR direction
 */
function isArabicText(text) {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
    return arabicPattern.test(text);
}

// Fisher-Yates shuffle algorithm - returns a new shuffled array
function shuffleArray(array) {
    const shuffled = [...array]; // Create a copy to avoid mutating original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Get shuffled options for a question (creates and caches if not exists)
function getShuffledOptions(question) {
    if (!currentQuizData.shuffledOptions[question.id]) {
        currentQuizData.shuffledOptions[question.id] = shuffleArray(question.options);
    }
    return currentQuizData.shuffledOptions[question.id];
}

// Activity and page visibility tracking
let lastActivityTime = Date.now();
let idleCheckInterval = null;
let pageHiddenTime = 0;
let pageHiddenStart = null;
let focusLostCount = 0;
let timerPaused = false;
let pausedTimeRemaining = 0;
let blurTimeout = null;
let isSubmitting = false; // Flag to prevent blur during submit

// Configuration constants
const MAX_IDLE_TIME = 300; // 5 minutes of inactivity
const MAX_HIDDEN_TIME = 60; // Maximum 60 seconds page can be hidden
const MAX_FOCUS_LOSS = 3; // Maximum focus losses allowed

// Start quiz when page loads
window.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    const urlParams = new URLSearchParams(window.location.search);
    const subject = urlParams.get('subject');

    if (subject) {
        loadQuiz(subject);
    } else {
        alert('No subject selected');
        window.location.href = 'dashboard.html';
    }
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Load quiz questions
async function loadQuiz(subject) {
    showLoading(true);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/quiz/start/${subject}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        showLoading(false);

        if (data.success) {
            currentQuizData.subject = subject;
            currentQuizData.questions = data.questions;
            currentQuizData.timeLimit = data.timeLimit;
            currentQuizData.startTime = Date.now();

            // Set subject name
            setSubjectInfo(subject);

            // Check if this is a paragraph-based quiz
            const hasParagraph = data.questions.some(q => q.paragraphTextEn || q.paragraphTextAr);
            
            console.log('[QUIZ] Has paragraph:', hasParagraph);
            
            if (hasParagraph) {
                // Display all questions at once with paragraph
                displayParagraphMode();
            } else {
                // Normal mode: one question at a time
                // Initialize progress dots
                initializeProgressDots();

                // Display first question
                displayQuestion(0);
            }

            // Start timer
            startTimer(data.timeLimit);

            // Start activity monitoring
            startActivityMonitoring();
            lastActivityTime = Date.now();

        } else {
            alert(data.message || 'Failed to load quiz');
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        showLoading(false);
        console.error('Load quiz error:', error);
        alert('Failed to load quiz. Please try again.');
    }
}

// Set subject information
function setSubjectInfo(subject) {
    const subjectNames = {
        'math': { en: 'Mathematics', ar: 'الرياضيات', icon: 'calculator-fill', color: 'primary' },
        'science': { en: 'Science', ar: 'العلوم', icon: 'flask', color: 'success' },
        'english': { en: 'English', ar: 'اللغة الإنجليزية', icon: 'book-fill', color: 'danger' },
        'arabic': { en: 'Arabic', ar: 'اللغة العربية', icon: 'chat-square-text-fill', color: 'warning' }
    };

    const info = subjectNames[subject];
    const nameEl = document.getElementById('subjectName');
    const iconEl = document.getElementById('subjectIcon');

    nameEl.setAttribute('data-en', info.en);
    nameEl.setAttribute('data-ar', info.ar);
    nameEl.textContent = currentLanguage === 'ar' ? info.ar : info.en;

    iconEl.className = `bi bi-${info.icon} me-2 text-${info.color}`;
}

// Initialize progress dots
function initializeProgressDots() {
    const container = document.getElementById('progressDots');
    container.innerHTML = '';

    currentQuizData.questions.forEach((q, index) => {
        const dot = document.createElement('div');
        dot.className = 'progress-dot';
        dot.id = `dot-${index}`;
        container.appendChild(dot);
    });
}


// Display question
function displayQuestion(index) {
    currentQuizData.currentIndex = index;
    const question = currentQuizData.questions[index];

    // Update question number
    document.getElementById('currentQuestion').textContent = index + 1;
    document.getElementById('totalQuestions').textContent = currentQuizData.questions.length;

    // Update question text with MathJax support
    const questionTextEl = document.getElementById('questionText');
    const questionText = currentLanguage === 'ar' ? question.questionTextAr : question.questionTextEn;
    questionTextEl.innerHTML = questionText;
    
    // Force direction and font based on content (for English quiz, ignore UI language)
    const shouldAlignByContent = currentQuizData.subject === 'english';
    const shouldBeRTL = shouldAlignByContent ? isArabicText(questionText) : (currentLanguage === 'ar' || isArabicText(questionText));

    if (shouldBeRTL) {
        questionTextEl.setAttribute('dir', 'rtl');
        questionTextEl.style.textAlign = 'right';
        questionTextEl.style.fontFamily = "' Tajawal', 'Tajawal', sans-serif";
    } else {
        questionTextEl.setAttribute('dir', 'ltr');
        questionTextEl.style.textAlign = 'left';
        questionTextEl.style.fontFamily = "'Tajawal', sans-serif";
    }

    // Show/hide image based on position
    const imageAboveContainer = document.getElementById('questionImageContainerAbove');
    const imageBelowContainer = document.getElementById('questionImageContainerBelow');
    const imageAbove = document.getElementById('questionImageAbove');
    const imageBelow = document.getElementById('questionImageBelow');

    // Hide both containers first
    imageAboveContainer.classList.add('d-none');
    imageBelowContainer.classList.add('d-none');

    if (question.imageUrl) {
        const position = question.imagePosition || 'below';

        if (position === 'above') {
            imageAboveContainer.classList.remove('d-none');
            imageAbove.src = question.imageUrl;
        } else {
            imageBelowContainer.classList.remove('d-none');
            imageBelow.src = question.imageUrl;
        }
    }

    // Display answer options based on question type
    displayAnswerOptions(question);

    // Update progress dots
    updateProgressDots();

    // Update navigation buttons
    updateNavigationButtons();

    // Render MathJax after everything is loaded
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise().catch((err) => console.log('MathJax typeset error:', err));
    }
}


// Display answer options based on question type
function displayAnswerOptions(question) {
    const container = document.getElementById('answerContainer');
    container.innerHTML = '';

    const savedAnswer = currentQuizData.answers[question.id];

    if (question.questionType === 'multiple_choice') {
        // Multiple choice options - use shuffled order
        const options = getShuffledOptions(question);
        options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'answer-option';
            if (savedAnswer === option) {
                optionDiv.classList.add('selected');
            }
            optionDiv.onclick = () => selectAnswer(question.id, option);

            const label = String.fromCharCode(65 + index); // A, B, C, D
            
            // Force direction and font (for English quiz, ignore UI language)
            const shouldAlignByContent = currentQuizData.subject === 'english';
            const shouldBeRTL = shouldAlignByContent ? isArabicText(option) : (currentLanguage === 'ar' || isArabicText(option));

            if (shouldBeRTL) {
                optionDiv.setAttribute('dir', 'rtl');
                optionDiv.style.textAlign = 'right';
                optionDiv.style.fontFamily = "' Tajawal', 'Tajawal', sans-serif";
            } else {
                optionDiv.setAttribute('dir', 'ltr');
                optionDiv.style.textAlign = 'left';
                optionDiv.style.fontFamily = "'Tajawal', sans-serif";
            }
            
            optionDiv.innerHTML = `

            
                <div class="d-flex align-items-center" style="gap: 1rem;">
    <div>
                    
                        <div class="option-label">${label}</div>
                    </div>
                    <div class="option-text">${option}</div>
                </div>
            `;
            container.appendChild(optionDiv);
        });

    } else if (question.questionType === 'true_false') {
        // True/False options
        ['True', 'False'].forEach(option => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'answer-option';
            if (savedAnswer === option) {
                optionDiv.classList.add('selected');
            }
            optionDiv.onclick = () => selectAnswer(question.id, option);

            const displayText = currentLanguage === 'ar'
                ? (option === 'True' ? 'صح' : 'خطأ')
                : option;

            // Force direction and font (for English quiz, ignore UI language)
            const shouldAlignByContent = currentQuizData.subject === 'english';
            const shouldBeRTL = shouldAlignByContent ? isArabicText(displayText) : (currentLanguage === 'ar' || isArabicText(displayText));

            if (shouldBeRTL) {
               optionDiv.setAttribute('dir', 'rtl');
                optionDiv.style.textAlign = 'right';
                optionDiv.style.fontFamily = "' Tajawal', 'Tajawal', sans-serif";
            } else {
                optionDiv.setAttribute('dir', 'ltr');
                optionDiv.style.textAlign = 'left';
                optionDiv.style.fontFamily = "'Tajawal', sans-serif";
            }

            optionDiv.innerHTML = `<div class="text-center fw-bold fs-5">${displayText}</div>`;
            container.appendChild(optionDiv);
        });

    } else if (question.questionType === 'text_input') {
        // Text input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control form-control-lg';
        input.placeholder = currentLanguage === 'ar' ? 'اكتب إجابتك هنا' : 'Type your answer here';
        input.value = savedAnswer || '';
        input.oninput = (e) => selectAnswer(question.id, e.target.value);
        
        // Force direction and font (for English quiz, ignore UI language)
        const qText = currentLanguage === 'ar' ? question.questionTextAr : question.questionTextEn;
        const shouldAlignByContent = currentQuizData.subject === 'english';
        const shouldBeRTL = shouldAlignByContent ? isArabicText(qText) : (currentLanguage === 'ar' || isArabicText(qText));

        if (shouldBeRTL) {
            input.setAttribute('dir', 'rtl');
            input.style.textAlign = 'right';
            input.style.fontFamily = "' Tajawal', 'Tajawal', sans-serif";
        } else {
            input.setAttribute('dir', 'ltr');
            input.style.textAlign = 'left';
            input.style.fontFamily = "'Tajawal', sans-serif";
        }
        
        container.appendChild(input);
    }
}


// Select answer
function selectAnswer(questionId, answer) {
    // Save answer
    currentQuizData.answers[questionId] = answer;

    // Update UI
    const container = document.getElementById('answerContainer');
    container.querySelectorAll('.answer-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    if (event && event.target.closest) {
        const clickedOption = event.target.closest('.answer-option');
        if (clickedOption) {
            clickedOption.classList.add('selected');
        }
    }

    // Update progress dot
    updateProgressDots();
}

// Update progress dots
function updateProgressDots() {
    currentQuizData.questions.forEach((q, index) => {
        const dot = document.getElementById(`dot-${index}`);
        if (currentQuizData.answers[q.id]) {
            dot.classList.add('answered');
        } else {
            dot.classList.remove('answered');
        }
    });
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    const isFirst = currentQuizData.currentIndex === 0;
    const isLast = currentQuizData.currentIndex === currentQuizData.questions.length - 1;

    prevBtn.disabled = isFirst;

    if (isLast) {
        nextBtn.classList.add('d-none');
        submitBtn.classList.remove('d-none');
    } else {
        nextBtn.classList.remove('d-none');
        submitBtn.classList.add('d-none');
    }
}

// Next question
function nextQuestion() {
    if (currentQuizData.currentIndex < currentQuizData.questions.length - 1) {
        displayQuestion(currentQuizData.currentIndex + 1);
    }
}

// Previous question
function previousQuestion() {
    if (currentQuizData.currentIndex > 0) {
        displayQuestion(currentQuizData.currentIndex - 1);
    }
}

// Start timer
function startTimer(seconds) {
    let timeRemaining = seconds;
    const timerEl = document.getElementById('timer');

    function updateTimer() {
        const minutes = Math.floor(timeRemaining / 60);
        const secs = timeRemaining % 60;
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Warning when 1 minute left
        if (timeRemaining === 60) {
            timerEl.classList.add('timer-warning');
            alert(currentLanguage === 'ar' ? 'دقيقة واحدة متبقية!' : 'Only 1 minute remaining!');
        }

        timeRemaining--;

        if (timeRemaining < 0) {
            clearInterval(currentQuizData.timerInterval);
            submitQuiz(true); // Auto-submit
        }
    }

    updateTimer();
    currentQuizData.timerInterval = setInterval(updateTimer, 1000);
}

// Pause quiz timer
function pauseQuizTimer() {
    if (!timerPaused && currentQuizData.timerInterval) {
        timerPaused = true;
        clearInterval(currentQuizData.timerInterval);
        // Store remaining time with safe parsing
        const timerEl = document.getElementById('timer');
        if (timerEl && timerEl.textContent) {
            const parts = timerEl.textContent.split(':');
            if (parts.length === 2) {
                const mins = parseInt(parts[0], 10) || 0;
                const secs = parseInt(parts[1], 10) || 0;
                pausedTimeRemaining = mins * 60 + secs;
            }
        }
    }
}

// Resume quiz timer
function resumeQuizTimer() {
    if (timerPaused) {
        timerPaused = false;
        startTimer(pausedTimeRemaining);
    }
}

// Show warning message to user
function showWarningMessage(message) {
    let warningDiv = document.getElementById('quiz-warning');
    if (!warningDiv) {
        warningDiv = document.createElement('div');
        warningDiv.id = 'quiz-warning';
        warningDiv.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff6b6b;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 90%;
            text-align: center;
        `;
        document.body.appendChild(warningDiv);
    }
    warningDiv.textContent = message;
    warningDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (warningDiv) {
            warningDiv.style.display = 'none';
        }
    }, 5000);
}

// Reset activity timer on user interaction
function resetActivityTimer() {
    lastActivityTime = Date.now();
}

// Start monitoring user activity
function startActivityMonitoring() {
    // Track user interactions
    document.addEventListener('mousemove', resetActivityTimer);
    document.addEventListener('keypress', resetActivityTimer);
    document.addEventListener('click', resetActivityTimer);
    document.addEventListener('scroll', resetActivityTimer);

    // Check for idle every 30 seconds
    idleCheckInterval = setInterval(() => {
        const idleTime = Math.floor((Date.now() - lastActivityTime) / 1000);

        if (idleTime > MAX_IDLE_TIME) {
            clearInterval(idleCheckInterval);
            const msg = currentLanguage === 'ar'
                ? 'تم إرسال الاختبار تلقائياً بسبب عدم النشاط'
                : 'Quiz auto-submitted due to inactivity';
            alert(msg);
            submitQuiz(true);
        } else if (idleTime > MAX_IDLE_TIME - 60) {
            // Warning 1 minute before auto-submit
            const remaining = MAX_IDLE_TIME - idleTime;
            const msg = currentLanguage === 'ar'
                ? `تحذير: سيتم إرسال الاختبار تلقائياً خلال ${remaining} ثانية بسبب عدم النشاط`
                : `Warning: You will be auto-submitted in ${remaining} seconds due to inactivity`;
            showWarningMessage(msg);
        }
    }, 30000); // Check every 30 seconds
}

// Stop monitoring on quiz completion
function stopActivityMonitoring() {
    document.removeEventListener('mousemove', resetActivityTimer);
    document.removeEventListener('keypress', resetActivityTimer);
    document.removeEventListener('click', resetActivityTimer);
    document.removeEventListener('scroll', resetActivityTimer);
    if (idleCheckInterval) {
        clearInterval(idleCheckInterval);
    }
}

// Submit quiz
async function submitQuiz(autoSubmit = false) {
    // Set flag to prevent blur warnings during confirm dialog
    isSubmitting = true;

    // Confirm submission
    if (!autoSubmit) {
        const confirmMsg = currentLanguage === 'ar'
            ? 'هل أنت متأكد من إنهاء الاختبار؟'
            : 'Are you sure you want to submit?';

        if (!confirm(confirmMsg)) {
            isSubmitting = false; // Reset flag if cancelled
            return;
        }
    }

    // Stop timer
    if (currentQuizData.timerInterval) {
        clearInterval(currentQuizData.timerInterval);
    }

    // Stop activity monitoring
    stopActivityMonitoring();

    // Calculate time taken
    const timeTaken = Math.floor((Date.now() - currentQuizData.startTime) / 1000);

    showLoading(true);

    try {
        const token = localStorage.getItem('token');

        // Debug logs
        console.log('Submitting to backend:');
        console.log('Subject:', currentQuizData.subject);
        console.log('Answers:', currentQuizData.answers);
        console.log('Number of answers:', Object.keys(currentQuizData.answers).length);

        const response = await fetch(`${API_URL}/quiz/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subject: currentQuizData.subject,
                answers: currentQuizData.answers,
                timeTaken: timeTaken
            })
        });

        const data = await response.json();
        console.log('Backend response:', data);

        showLoading(false);

        if (data.success) {
            // Store results for results page
            data.totalQuestions = 10;

            localStorage.setItem('quizResults', JSON.stringify(data));
            currentQuizData.questions = [];

            // Redirect to results page
            window.location.href = `results.html?subject=${currentQuizData.subject}`;
        } else {
            alert(data.message || 'Failed to submit quiz');
        }
    } catch (error) {
        showLoading(false);
        console.error('Submit quiz error:', error);
        alert('Failed to submit quiz. Please try again.');
    }
}

// Prevent page refresh/close during quiz
window.addEventListener('beforeunload', function(e) {
    if (currentQuizData.questions.length > 0) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Page visibility detection (tab switching/minimizing)
document.addEventListener('visibilitychange', function() {
    if (currentQuizData.questions.length === 0) return; // Quiz not active
    if (isSubmitting) return; // Don't trigger during submit

    if (document.hidden) {
        // User switched tabs or minimized
        pageHiddenStart = Date.now();
        pauseQuizTimer();

        const msg = currentLanguage === 'ar'
            ? 'تحذير: لقد قمت بتبديل التبويب. عد إلى الاختبار فوراً'
            : 'Warning: You have switched tabs. Return to the quiz immediately';
        showWarningMessage(msg);

    } else {
        // User returned
        if (pageHiddenStart) {
            const hiddenDuration = Math.floor((Date.now() - pageHiddenStart) / 1000);
            pageHiddenTime += hiddenDuration;

            if (pageHiddenTime > MAX_HIDDEN_TIME) {
                // Auto-submit if hidden too long
                const msg = currentLanguage === 'ar'
                    ? 'تم إرسال الاختبار تلقائياً بسبب الوقت الطويل بعيداً عن الصفحة'
                    : 'Quiz auto-submitted due to excessive time away from page';
                alert(msg);
                submitQuiz(true);
            } else {
                resumeQuizTimer();
                const msg = currentLanguage === 'ar'
                    ? `لقد كنت بعيداً ${hiddenDuration} ثانية. إجمالي الوقت المسموح: ${MAX_HIDDEN_TIME} ثانية`
                    : `You were away for ${hiddenDuration} seconds. Total allowed: ${MAX_HIDDEN_TIME} seconds`;
                showWarningMessage(msg);
            }
            pageHiddenStart = null;
        }
    }
});

// Window focus/blur detection with debounce
window.addEventListener('blur', function() {
    if (currentQuizData.questions.length === 0) return; // Quiz not active
    if (isSubmitting) return; // Don't trigger during submit confirmation

    // Debounce to prevent multiple rapid fires
    if (blurTimeout) return;

    blurTimeout = setTimeout(() => {
        blurTimeout = null;
    }, 1000);

    focusLostCount++;

    if (focusLostCount >= MAX_FOCUS_LOSS) {
        const msg = currentLanguage === 'ar'
            ? 'تم اكتشاف العديد من حالات فقدان التركيز. سيتم إرسال الاختبار تلقائياً'
            : 'Too many focus losses detected. Quiz will be auto-submitted';
        alert(msg);
        submitQuiz(true);
    } else {
        const msg = currentLanguage === 'ar'
            ? `تحذير: فقدان التركيز ${focusLostCount}/${MAX_FOCUS_LOSS} مرات`
            : `Warning: Focus lost ${focusLostCount}/${MAX_FOCUS_LOSS} times`;
        showWarningMessage(msg);
    }
});


// ========================================
// PARAGRAPH MODE FUNCTIONS
// ========================================

/**
 * Display all questions at once with shared paragraph
 */
function displayParagraphMode() {
    console.log('[QUIZ] Entering paragraph mode');
    
    // Find the first question with paragraph text
    const paragraphQuestion = currentQuizData.questions.find(q => 
        q.paragraphTextEn || q.paragraphTextAr
    );
    
    if (!paragraphQuestion) {
        // Fallback to normal mode if no paragraph found
        console.log('[QUIZ] No paragraph found, falling back to normal mode');
        initializeProgressDots();
        displayQuestion(0);
        return;
    }
    
    // Show paragraph container
    const paragraphContainer = document.getElementById('paragraphContainer');
    const paragraphTextEl = document.getElementById('paragraphText');
    const paragraphText = currentLanguage === 'ar' 
        ? paragraphQuestion.paragraphTextAr 
        : paragraphQuestion.paragraphTextEn;
   const isParagraphArabic = isArabicText(paragraphText);


    
    console.log('[QUIZ] Displaying paragraph:', paragraphText?.substring(0, 50) + '...');
    
    paragraphTextEl.innerHTML = paragraphText;
    
    // Force direction and font based on ACTUAL CONTENT
    if (isArabicText(paragraphText)) {
        paragraphTextEl.setAttribute('dir', 'rtl');
        paragraphTextEl.style.textAlign = 'right';
        paragraphTextEl.style.fontFamily = "' Tajawal', 'Tajawal', sans-serif";
    } else {
        paragraphTextEl.setAttribute('dir', 'ltr');
        paragraphTextEl.style.textAlign = 'left';
        paragraphTextEl.style.fontFamily = "'Tajawal', sans-serif";
    }

    paragraphContainer.style.display = 'block';
    
    // Hide single question container
    document.getElementById('questionText').style.display = 'none';
    const answerContainer = document.getElementById('answerContainer');
    if (answerContainer) {
        answerContainer.style.display = 'none';
    }
    
    // Hide image containers
    document.getElementById('questionImageContainerAbove').style.display = 'none';
    document.getElementById('questionImageContainerBelow').style.display = 'none';
    
    // Hide navigation buttons (we'll use submit only)
    document.getElementById('prevBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    
    // Show all questions container
    const allQuestionsContainer = document.getElementById('allQuestionsContainer');
    allQuestionsContainer.style.display = 'block';
    allQuestionsContainer.classList.add('all-questions-mode');
    
    // Build all questions HTML
    let questionsHTML = '';
    
    currentQuizData.questions.forEach((question, index) => {
        const questionText = currentLanguage === 'ar' 
            ? question.questionTextAr 
            : question.questionTextEn;
        
       const questionNumber = isParagraphArabic
            ? `السؤال ${index + 1}` 
            : `Question ${index + 1}`;
        
        // Determine direction and font based on ACTUAL CONTENT
      const isArabic = isParagraphArabic;
const qDir = isArabic ? 'rtl' : 'ltr';
const qAlign = isArabic ? 'right' : 'left';
const qFont = isArabic ? "' Tajawal', 'Tajawal', sans-serif" : "'Tajawal', sans-serif";

        
       questionsHTML += `
    <div class="question-item" id="question-item-${index}" dir="${qDir}" style="text-align: ${qAlign};">
    
        <div class="question-number-badge" style="font-family: ${qFont};">
            ${questionNumber}
        </div>
                
                <div class="question-text" dir="${qDir}" style="text-align: ${qAlign}; font-family: ${qFont};">
                    ${questionText}
                </div>
                
                ${question.imageUrl ? `
                    <div class="mb-3 text-center">
                        <img src="${question.imageUrl}" class="img-fluid rounded" style="max-height: 300px;" alt="Question Image" />
                    </div>
                ` : ''}
                
                <div class="answer-options-container" id="answer-container-${index}">
                    ${buildAnswerOptionsHTML(question, index, isParagraphArabic)}


                </div>
            </div>
        `;
    });
    
    allQuestionsContainer.innerHTML = questionsHTML;
    
    // Hide progress dots
    document.getElementById('progressDots').style.display = 'none';
    
    // Update question counter
    document.getElementById('currentQuestion').textContent = '10';
    document.getElementById('totalQuestions').textContent = '10';
    
    // Show submit button
    document.getElementById('submitBtn').classList.remove('d-none');
    
    // Render MathJax
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err));
    }
    
    console.log('[QUIZ] Paragraph mode display complete');
}


/**
 * Build answer options HTML for a question
 */
/**
 * Build answer options HTML for a question
 */
function buildAnswerOptionsHTML(question, questionIndex, isParagraphArabic) {


    const savedAnswer = currentQuizData.answers[question.id];
    let html = '';
    
    if (question.questionType === 'multiple_choice') {
        const options = getShuffledOptions(question);
        options.forEach((option, idx) => {
            const isSelected = savedAnswer === option;
            const label = String.fromCharCode(65 + idx);
            const escapedOption = option.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            // Determine direction and font (for English quiz, ignore UI language)
            const shouldAlignByContent = currentQuizData.subject === 'english';
            const isArabic = shouldAlignByContent ? isArabicText(option) : (isParagraphArabic || isArabicText(option));
           const optionDir = isArabic ? 'rtl' : 'ltr';
            const optionAlign = isArabic ? 'right' : 'left';
            const optionFont = isArabic ? "' Tajawal', 'Tajawal', sans-serif" : "'Tajawal', sans-serif";

            html += `
               <div class="answer-option ${isSelected ? 'selected' : ''}" 
     dir="${optionDir}" 
     style="text-align: ${optionAlign}; font-family: ${optionFont};"
     onclick="selectAnswerInParagraphMode('${question.id}', '${escapedOption}', ${questionIndex})">
    <div class="d-flex align-items-center" style="gap: 1rem;">
        <div>
            <div class="option-label">${label}</div>
        </div>
        <div class="option-text">${option}</div>
    </div>
</div>

            `;
        });
    } else if (question.questionType === 'true_false') {
        ['True', 'False'].forEach(option => {
            const isSelected = savedAnswer === option;
            const displayText = currentLanguage === 'ar'
                ? (option === 'True' ? 'صح' : 'خطأ')
                : option;
            
            // Determine direction and font (for English quiz, ignore UI language)
            const shouldAlignByContent = currentQuizData.subject === 'english';
           const isArabic = shouldAlignByContent ? isArabicText(displayText) : (isParagraphArabic || isArabicText(displayText));
            const optionDir = isArabic ? 'rtl' : 'ltr';
            const optionAlign = isArabic ? 'right' : 'left';
            const optionFont = isArabic ? "' Tajawal', 'Tajawal', sans-serif" : "'Tajawal', sans-serif";
            
            html += `
                <div class="answer-option ${isSelected ? 'selected' : ''}" 
                     dir="${optionDir}" 
                     style="text-align: ${optionAlign}; font-family: ${optionFont};"
                     onclick="selectAnswerInParagraphMode('${question.id}', '${option}', ${questionIndex})">
                    <div class="text-center fw-bold fs-5">${displayText}</div>
                </div>
            `;
        });
    } else if (question.questionType === 'text_input') {
        const value = (savedAnswer || '').replace(/"/g, '&quot;');
        
        // Determine direction and font (for English quiz, ignore UI language)
        const qText = currentLanguage === 'ar' ? question.questionTextAr : question.questionTextEn;
        const shouldAlignByContent = currentQuizData.subject === 'english';
        const isArabic = shouldAlignByContent ? isArabicText(qText) : (isParagraphArabic || isArabicText(qText));
        const optionDir = isArabic ? 'rtl' : 'ltr';
        const optionAlign = isArabic ? 'right' : 'left';
        const optionFont = isArabic ? "' Tajawal', 'Tajawal', sans-serif" : "'Tajawal', sans-serif";
        
        html += `
            <input type="text" 
                   class="form-control form-control-lg" 
                   dir="${optionDir}"
                   style="text-align: ${optionAlign}; font-family: ${optionFont};"
                   placeholder="${currentLanguage === 'ar' ? 'اكتب إجابتك هنا' : 'Type your answer here'}"
                   value="${value}"
                   oninput="selectAnswerInParagraphMode('${question.id}', this.value, ${questionIndex})" />
        `;
    }
    
    return html;
}

/**
 * Select answer in paragraph mode
 */
function selectAnswerInParagraphMode(questionId, answer, questionIndex) {
    // Save answer
    currentQuizData.answers[questionId] = answer;
    
    console.log(`[QUIZ] Answer selected for question ${questionIndex + 1}:`, answer);
    
    // Update UI - remove 'selected' from all options in this question
    const container = document.getElementById(`answer-container-${questionIndex}`);
    if (container) {
        container.querySelectorAll('.answer-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add 'selected' to clicked option (for multiple choice and true/false)
        if (event && event.currentTarget && event.currentTarget.classList) {
            event.currentTarget.classList.add('selected');
        }
    }
    
    // Reset activity timer
    resetActivityTimer();
}
