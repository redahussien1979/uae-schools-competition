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

// Submit quiz
//............
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
    
    // Calculate time taken
    const timeTaken = Math.floor((Date.now() - currentQuizData.startTime) / 1000);
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('token');
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
        
        showLoading(false);
        
        if (data.success) {
            // Store results for results page
                data.totalQuestions = 10;

            localStorage.setItem('quizResults', JSON.stringify(data));
            currentQuizData.questions = [];

            // Redirect to results page
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











//lllllllllllllllllllllllllllllllllllllllllllllllll
