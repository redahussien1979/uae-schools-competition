/* ============================================
   Results Page JavaScript
   ============================================ */

let resultsData = null;
let currentSubject = '';

// Load results when page loads
window.addEventListener('DOMContentLoaded', function() {
    loadResults();
});

// Load quiz results
function loadResults() {
    // Get results from localStorage (stored by quiz.js)
    const resultsStr = localStorage.getItem('quizResults');
    
    if (!resultsStr) {
        alert('No quiz results found');
        window.location.href = 'dashboard.html';
        return;
    }
    
    try {
        resultsData = JSON.parse(resultsStr);
        
        // Get subject from URL or results
        const urlParams = new URLSearchParams(window.location.search);
        currentSubject = urlParams.get('subject') || 'math';
        
        // Display results
        displayResults();
        
        // Clear results from localStorage
        localStorage.removeItem('quizResults');
        
    } catch (error) {
        console.error('Error loading results:', error);
        alert('Failed to load results');
        window.location.href = 'dashboard.html';
    }
}





// Display results
function displayResults() {
    const { score, totalQuestions, percentage, isNewBest, previousBest, timeTaken, totalBestScore, starsEarned, totalStars } = resultsData;

    // Set subject info
    setSubjectInfo(currentSubject);

    // Display score with LaTeX formatting
    document.getElementById('scoreDisplay').innerHTML = `\\(${score}\\) / \\(${totalQuestions}\\)`;
    document.getElementById('percentageDisplay').innerHTML = `\\(${percentage}\\%\\)`;

    // Display stars earned
    const starsEarnedEl = document.getElementById('starsEarned');
    if (starsEarnedEl) {
        starsEarnedEl.innerHTML = `+\\(${starsEarned || 0}\\) ⭐`;
    }

    // Display total stars
    const totalStarsEl = document.getElementById('totalStarsResult');
    if (totalStarsEl) {
        totalStarsEl.innerHTML = `\\(${totalStars || 0}\\) ⭐`;
    }

    // Display comparison with LaTeX
    document.getElementById('currentScoreText').innerHTML = `\\(${score}\\) / \\(${totalQuestions}\\)`;
    document.getElementById('previousBestText').innerHTML = `\\(${previousBest}\\) / \\(${totalQuestions}\\)`;

    // Display time taken
    document.getElementById('timeTaken').textContent = formatTime(timeTaken);

    // Display total best score with LaTeX
    document.getElementById('totalBestScore').innerHTML = `\\(${totalBestScore}\\) / \\(40\\)`;
    const overallPercentage = Math.round((totalBestScore / 40) * 100);
    document.getElementById('overallPercentage').innerHTML = `\\(${overallPercentage}\\%\\)`;

    // Render MathJax after setting content
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err));
    }

    // Handle new record
    if (isNewBest) {
        showNewRecordCelebration();
    } else {
        showRegularResults();
    }

    // Show encouragement message
    showEncouragementMessage(percentage, isNewBest);
}

// Set subject information
function setSubjectInfo(subject) {
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
    
    // Update subject name
    const nameEl = document.querySelector('#subjectName span');
    nameEl.setAttribute('data-en', info.en);
    nameEl.setAttribute('data-ar', info.ar);
    nameEl.textContent = currentLanguage === 'ar' ? info.ar : info.en;
    
    // Update icon
    const iconEl = document.getElementById('subjectIcon');
    iconEl.className = `bi bi-${info.icon} me-2 text-${info.color}`;
}

// Show new record celebration
function showNewRecordCelebration() {
    const titleEl = document.getElementById('resultTitle');
    const iconEl = document.getElementById('resultIcon');
    const iconContainer = document.getElementById('resultIconContainer');
    
    // Update title
    titleEl.setAttribute('data-en', '🎉 NEW RECORD! 🎉');
    titleEl.setAttribute('data-ar', '🎉 رقم قياسي جديد! 🎉');
    titleEl.textContent = currentLanguage === 'ar' ? '🎉 رقم قياسي جديد! 🎉' : '🎉 NEW RECORD! 🎉';
    titleEl.classList.add('text-success');
    
    // Update icon
    iconEl.classList.remove('text-warning');
    iconEl.classList.add('text-success');
    iconContainer.classList.add('result-success');
    
    // Highlight comparison card
    const comparisonCard = document.getElementById('comparisonCard');
    comparisonCard.classList.add('border', 'border-success', 'border-3');
    
    // Show confetti animation
    showConfetti();
    
    // Play success sound (optional)
    // playSuccessSound();
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
    
    // Create confetti particles
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
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        canvas.style.display = 'none';
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    }, 5000);
}
