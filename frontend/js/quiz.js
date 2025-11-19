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

    startTime: null,

    timerInterval: null,

    timeLimit: 900 // 15 minutes in seconds

};

 

// Activity and page visibility tracking

let lastActivityTime = Date.now();

let idleCheckInterval = null;

let pageHiddenTime = 0;

let pageHiddenStart = null;

let focusLostCount = 0;

let timerPaused = false;

let pausedTimeRemaining = 0;

let blurTimeout = null;

 

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

 

            // Initialize progress dots

            initializeProgressDots();

 

            // Display first question

            displayQuestion(0);

 

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

 

    // Show/hide image

    if (question.imageUrl) {

        document.getElementById('questionImageContainer').classList.remove('d-none');

        document.getElementById('questionImage').src = question.imageUrl;

    } else {

        document.getElementById('questionImageContainer').classList.add('d-none');

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

        // Multiple choice options

        question.options.forEach((option, index) => {

            const optionDiv = document.createElement('div');

            optionDiv.className = 'answer-option';

            if (savedAnswer === option) {

                optionDiv.classList.add('selected');

            }

            optionDiv.onclick = () => selectAnswer(question.id, option);

 

            const label = String.fromCharCode(65 + index); // A, B, C, D

            optionDiv.innerHTML = `

                <div class="d-flex align-items-center">

                    <div class="me-3">

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

    // Confirm submission

    if (!autoSubmit) {

        const confirmMsg = currentLanguage === 'ar'

            ? 'هل أنت متأكد من إنهاء الاختبار؟'

            : 'Are you sure you want to submit?';

 

        if (!confirm(confirmMsg)) {

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

