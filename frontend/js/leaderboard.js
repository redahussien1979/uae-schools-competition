/* ============================================
   Leaderboard Page JavaScript
   ============================================ */

// Use API_URL from config.js (set globally)
//const API_URL = window.API_URL || 'http://localhost:5000';

// Current state
let currentState = {
    tab: 'students',      // 'students' or 'schools'
    grade: 'all',         // 'all' or 4-9
    subject: 'overall',   // 'overall', 'math', 'science', 'english', 'arabic'
    page: 1,
    limit: 20
};

// Load leaderboard when page loads
// Load leaderboard when page loads
window.addEventListener('DOMContentLoaded', function() {
    console.log('Leaderboard loading...');

    // Check if user is logged in
    checkAuthStatus();

    loadLeaderboard();
});

// Check authentication status and update navigation
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const loginBtn = document.getElementById('loginBtn');
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (token) {
        // User is logged in - hide login button, show dashboard link
        loginBtn.style.display = 'none';
        dashboardLink.style.display = 'inline-block';
    } else {
        // User is not logged in - show login button, hide dashboard link
        loginBtn.style.display = 'inline-block';
        dashboardLink.style.display = 'none';
    }
}

// Switch between Students and Schools tabs
function switchTab(tab) {
    currentState.tab = tab;
    currentState.page = 1; // Reset to first page
    
    // Update tab buttons
    document.getElementById('studentsTab').classList.remove('active');
    document.getElementById('schoolsTab').classList.remove('active');
    document.getElementById(tab + 'Tab').classList.add('active');
    
    // Update table header
    updateTableHeader();
    
    // Load data
    loadLeaderboard();
}

// Update table header based on current tab
function updateTableHeader() {
    const header3 = document.getElementById('tableHeader3');
    
    if (currentState.tab === 'students') {
        header3.setAttribute('data-en', 'Grade');
        header3.setAttribute('data-ar', 'الصف');
        header3.textContent = currentLanguage === 'ar' ? 'الصف' : 'Grade';
    } else {
        header3.setAttribute('data-en', 'Students');
        header3.setAttribute('data-ar', 'عدد الطلاب');
        header3.textContent = currentLanguage === 'ar' ? 'عدد الطلاب' : 'Students';
    }
}

// Filter by grade
function filterByGrade(grade) {
    currentState.grade = grade;
    currentState.page = 1; // Reset to first page
    
    // Update button states
    document.querySelectorAll('.filter-btn[onclick^="filterByGrade"]').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('button').classList.add('active');
    
    loadLeaderboard();
}

// Filter by subject
function filterBySubject(subject) {
    currentState.subject = subject;
    currentState.page = 1; // Reset to first page
    
    // Update button states
    document.querySelectorAll('.filter-btn[onclick^="filterBySubject"]').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('button').classList.add('active');
    
    loadLeaderboard();
}

// Load leaderboard data
async function loadLeaderboard() {
    showLoading();
    
    try {
        const endpoint = currentState.tab === 'students' 
            ? '/leaderboard/students' 
            : '/leaderboard/schools';
        
        const params = new URLSearchParams({
            grade: currentState.grade,
            subject: currentState.subject,
            page: currentState.page,
            limit: currentState.limit
        });
        
        const response = await fetch(`${API_URL}${endpoint}?${params}`);
        const data = await response.json();
        
        if (data.success) {
            if (currentState.tab === 'students') {
                displayStudents(data.students);
            } else {
                displaySchools(data.schools);
            }
            
            updatePagination(data.pagination);
        } else {
            showError(data.message || 'Failed to load leaderboard');
        }
    } catch (error) {
        console.error('Load leaderboard error:', error);
        showError('Failed to load leaderboard. Please try again.');
    }
}

// Display students in table
function displayStudents(students) {
    const tbody = document.getElementById('leaderboardBody');
    
    if (!students || students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center empty-state text-muted">
                    <i class="bi bi-inbox"></i>
                    <p class="mt-3 fs-5" data-en="No students found with current filters" data-ar="لا يوجد طلاب بالفلاتر الحالية">
                        No students found with current filters
                    </p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    students.forEach((student, index) => {
        const rankBadge = getRankBadge(student.rank);
        
        html += `
            <tr class="leaderboard-row">
                <td class="px-4 py-4">
                    ${rankBadge}
                </td>
                <td class="px-4 py-4">
                    <div class="fw-bold fs-6">${student.name}</div>
                    <small class="text-muted d-flex align-items-center mt-1">
                        <i class="bi bi-building me-1"></i>
                        ${student.school}
                    </small>
                </td>
                <td class="px-4 py-4 d-none d-md-table-cell">
                    <span class="badge bg-primary">Grade ${student.grade}</span>
                </td>
                <td class="px-4 py-4 text-end">
                    <div class="fw-bold text-warning score-display-cell">${student.stars || 0} ⭐</div>
                    <small class="text-muted d-flex align-items-center justify-content-end mt-1">
                        <i class="bi bi-trophy-fill text-success me-1"></i>
                        Best: ${student.bestScore || student.score}/${student.maxScore}
                    </small>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Display schools in table
function displaySchools(schools) {
    const tbody = document.getElementById('leaderboardBody');
    
    if (!schools || schools.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center empty-state text-muted">
                    <i class="bi bi-inbox"></i>
                    <p class="mt-3 fs-5" data-en="No schools found with current filters" data-ar="لا توجد مدارس بالفلاتر الحالية">
                        No schools found with current filters
                    </p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    schools.forEach((school, index) => {
        const rankBadge = getRankBadge(school.rank);
        
        html += `
            <tr class="leaderboard-row">
                <td class="px-4 py-4">
                    ${rankBadge}
                </td>
                <td class="px-4 py-4">
                    <div class="fw-bold fs-6">${school.name}</div>
                    <small class="text-muted d-flex align-items-center mt-1">
                        <i class="bi bi-people-fill me-1"></i>
                        ${school.studentCount} 
                        <span data-en="students" data-ar="طالب">${currentLanguage === 'ar' ? 'طالب' : 'students'}</span>
                    </small>
                </td>
                <td class="px-4 py-4 d-none d-md-table-cell">
                    <span class="badge bg-info">${school.studentCount}</span>
                </td>
                <td class="px-4 py-4 text-end">
                    <div class="fw-bold text-warning score-display-cell">${school.totalStars || 0} ⭐</div>
                    <small class="text-muted d-flex align-items-center justify-content-end mt-1">
                        <i class="bi bi-graph-up text-success me-1"></i>
                        Avg: ${school.averageStars || school.averageScore || 0}
                    </small>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Get rank badge HTML
function getRankBadge(rank) {
    if (rank === 1) {
        return `<span class="rank-badge rank-1">🥇</span>`;
    } else if (rank === 2) {
        return `<span class="rank-badge rank-2">🥈</span>`;
    } else if (rank === 3) {
        return `<span class="rank-badge rank-3">🥉</span>`;
    } else {
        return `<span class="fw-bold fs-5">#${rank}</span>`;
    }
}

// Update pagination controls
function updatePagination(pagination) {
    const { currentPage, totalPages, totalCount } = pagination;
    
    // Update page info
    const pageInfo = document.getElementById('pageInfo');
    const pageText = currentLanguage === 'ar' 
        ? `صفحة ${currentPage} من ${totalPages}` 
        : `Page ${currentPage} of ${totalPages}`;
    pageInfo.textContent = pageText;
    
    // Update prev button
    const prevBtn = document.getElementById('prevBtn');
    prevBtn.disabled = currentPage === 1;
    
    // Update next button
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Previous page
function previousPage() {
    if (currentState.page > 1) {
        currentState.page--;
        loadLeaderboard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Next page
function nextPage() {
    currentState.page++;
    loadLeaderboard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show loading state
function showLoading() {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted fs-5" data-en="Loading leaderboard..." data-ar="جاري تحميل لوحة المتصدرين...">
                    Loading leaderboard...
                </p>
            </td>
        </tr>
    `;
}

// Show error message
function showError(message) {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center empty-state text-danger">
                <i class="bi bi-exclamation-triangle"></i>
                <p class="mt-3 fs-5">${message}</p>
                <button class="btn btn-primary mt-3" onclick="loadLeaderboard()">
                    <i class="bi bi-arrow-clockwise me-2"></i>
                    <span data-en="Try Again" data-ar="حاول مرة أخرى">Try Again</span>
                </button>
            </td>
        </tr>
    `;
}
