/* ============================================
   Homepage JavaScript
   ============================================ */

// Use API_URL from config.js (set globally)
//const API_URL = window.API_URL || 'http://localhost:5000';
const API_URL = window.API_URL
// Load everything when page loads
// Load everything when page loads
window.addEventListener('DOMContentLoaded', function() {
    console.log('Homepage loading...');
    
    // Check authentication status first
    checkAuthStatus();
    
    loadStatistics();
    loadTop5Leaderboards();
    
    // Update language if saved
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && savedLanguage === 'ar' && typeof currentLanguage !== 'undefined' && currentLanguage === 'en') {
        toggleLanguage();
    }
});

// Check authentication status and update UI
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    
    // Navigation buttons
    const loginBtn = document.getElementById('loginBtn');
    const dashboardLink = document.getElementById('dashboardLink');
    
    // Hero section buttons
    const registerBtnHero = document.getElementById('registerBtnHero');
    const loginBtnHero = document.getElementById('loginBtnHero');
    const dashboardBtnHero = document.getElementById('dashboardBtnHero');
    
    // CTA section buttons
    const ctaRegisterBtn = document.getElementById('ctaRegisterBtn');
    const ctaDashboardBtn = document.getElementById('ctaDashboardBtn');
    
    if (token) {
        // User is logged in - hide register/login, show dashboard
        if (loginBtn) loginBtn.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'inline-block';
        
        if (registerBtnHero) registerBtnHero.style.display = 'none';
        if (loginBtnHero) loginBtnHero.style.display = 'none';
        if (dashboardBtnHero) dashboardBtnHero.style.display = 'inline-block';
        
        if (ctaRegisterBtn) ctaRegisterBtn.style.display = 'none';
        if (ctaDashboardBtn) ctaDashboardBtn.style.display = 'inline-block';
    } else {
        // User is not logged in - show register/login, hide dashboard
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (dashboardLink) dashboardLink.style.display = 'none';
        
        if (registerBtnHero) registerBtnHero.style.display = 'inline-block';
        if (loginBtnHero) loginBtnHero.style.display = 'inline-block';
        if (dashboardBtnHero) dashboardBtnHero.style.display = 'none';
        
        if (ctaRegisterBtn) ctaRegisterBtn.style.display = 'inline-block';
        if (ctaDashboardBtn) ctaDashboardBtn.style.display = 'none';
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();
        
        if (data.success) {
            const stats = data.stats;
            
            // Animate counting up
            animateCounter('totalStudents', stats.totalStudents);
            animateCounter('totalSchools', stats.totalSchools);
            animateCounter('totalQuestions', stats.totalQuestions);
            animateCounter('totalAttempts', stats.totalAttempts);
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// Animate counter
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let current = 0;
    const increment = targetValue / 50; // 50 steps
    const duration = 1500; // 1.5 seconds
    const stepTime = duration / 50;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepTime);
}

// Load Top 5 Leaderboards
async function loadTop5Leaderboards() {
    try {
        const response = await fetch(`${API_URL}/leaderboard/top5`);
        const data = await response.json();
        
        if (data.success) {
            displayTop5Schools(data.schools);
            displayTop5Students(data.students);
        } else {
            showEmptyLeaderboards();
        }
    } catch (error) {
        console.error('Load leaderboards error:', error);
        showEmptyLeaderboards();
    }
}

// Display Top 5 Schools
function displayTop5Schools(schools) {
    const container = document.getElementById('topSchoolsContainer');
    
    if (!schools || schools.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                <p class="mt-3" data-en="No schools yet. Be the first!" data-ar="لا توجد مدارس بعد. كن الأول!">
                    No schools yet. Be the first!
                </p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="d-flex flex-column gap-3">';
    
    schools.forEach((school, index) => {
        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        html += `
            <div class="d-flex align-items-center p-3 bg-light rounded-3">
                <div class="rank-badge ${rankClass}">
                    ${medal || school.rank}
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">${school.name}</h6>
                    <small class="text-muted">
                        ${school.studentCount} 
                        <span data-en="students" data-ar="طالب">${currentLanguage === 'ar' ? 'طالب' : 'students'}</span>
                    </small>
                </div>
                <div class="text-end">
                    <div class="fw-bold text-primary fs-5">${school.percentage}%</div>
                    <small class="text-muted">${school.averageScore}/40</small>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Display Top 5 Students
function displayTop5Students(students) {
    const container = document.getElementById('topStudentsContainer');
    
    if (!students || students.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                <p class="mt-3" data-en="No students yet. Be the first!" data-ar="لا يوجد طلاب بعد. كن الأول!">
                    No students yet. Be the first!
                </p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="d-flex flex-column gap-3">';
    
    students.forEach((student, index) => {
        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        html += `
            <div class="d-flex align-items-center p-3 bg-light rounded-3">
                <div class="rank-badge ${rankClass}">
                    ${medal || student.rank}
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">${student.name}</h6>
                    <small class="text-muted">
                        <span data-en="Grade" data-ar="الصف">${currentLanguage === 'ar' ? 'الصف' : 'Grade'}</span> ${student.grade} • ${student.school}
                    </small>
                </div>
                <div class="text-end">
                    <div class="fw-bold text-success fs-5">${student.percentage}%</div>
                    <small class="text-muted">${student.score}/40</small>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Show empty leaderboards
function showEmptyLeaderboards() {
    const emptyHTML = `
        <div class="text-center py-5 text-muted">
            <i class="bi bi-inbox" style="font-size: 3rem;"></i>
            <p class="mt-3" data-en="No data yet. Be the first to compete!" data-ar="لا توجد بيانات بعد. كن أول من يتنافس!">
                No data yet. Be the first to compete!
            </p>
        </div>
    `;
    
    document.getElementById('topSchoolsContainer').innerHTML = emptyHTML;
    document.getElementById('topStudentsContainer').innerHTML = emptyHTML;
}
