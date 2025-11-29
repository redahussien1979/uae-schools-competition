/* ============================================
   Admin Dashboard JavaScript
   ============================================ */

// Use API_URL from config.js (set globally)
//const API_URL = window.API_URL;// || 'http://localhost:5000';

// State
let currentPage = {
    users: 1,
    attempts: 1,
    questions: 1
};

// Track selected questions for batch delete
let selectedQuestionIds = new Set();

// Track currently editing question ID for highlighting
let currentEditingQuestionId = null;

// Check if admin is logged in
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
        window.location.href = 'admin-login.html';
        return null;
    }
    
    return token;
}

// Load admin info
function loadAdminInfo() {
    const adminInfo = localStorage.getItem('adminInfo');
    
    if (adminInfo) {
        const admin = JSON.parse(adminInfo);
        document.getElementById('adminUsername').textContent = admin.username;
    }
}

// Initialize dashboard
window.addEventListener('DOMContentLoaded', function() {
    const token = checkAdminAuth();
    if (!token) return;
    
    loadAdminInfo();
    loadStatistics();
    
    // Show overview by default
    showSection('overview');
});

// Show section
function showSection(section, event) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
    });

    // Remove active from all nav links
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    document.getElementById(section + '-section').classList.add('active');

    // Set active nav link
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Load data based on section
    if (section === 'users') {
        loadUsers();
    } else if (section === 'attempts') {
        loadAttempts();
    } else if (section === 'questions') {
        loadQuestions();
    }
}

// ========================================
// LOAD STATISTICS
// ========================================
async function loadStatistics() {
    const token = checkAdminAuth();

    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            const stats = data.stats;

            // Update main stats
            document.getElementById('stat-users').textContent = stats.totalUsers;
            document.getElementById('stat-questions').textContent = stats.totalQuestions;
            document.getElementById('stat-attempts').textContent = stats.totalAttempts;
            document.getElementById('stat-schools').textContent = stats.totalSchools;

            // Update recent activity
            document.getElementById('recent-users').textContent = stats.recentUsers;
            document.getElementById('recent-attempts').textContent = stats.recentAttempts;

            // Display questions by subject
            displayQuestionsBySubject(stats.questionsBySubject);

            // Display questions breakdown by grade and subject
            displayQuestionsBreakdown(stats.questionsByGradeAndSubject);
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// Display questions by subject
function displayQuestionsBySubject(data) {
    const container = document.getElementById('questions-by-subject');

    let html = '';
    data.forEach(item => {
        html += `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-capitalize">${item._id}</span>
                <strong>${item.count}</strong>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Display questions breakdown by grade and subject
function displayQuestionsBreakdown(data) {
    const container = document.getElementById('questions-breakdown');

    // Subject names and colors
    const subjectInfo = {
        'math': { name: 'Mathematics', color: 'primary', icon: 'calculator' },
        'science': { name: 'Science', color: 'success', icon: 'flask' },
        'english': { name: 'English', color: 'info', icon: 'chat-text' },
        'arabic': { name: 'Arabic', color: 'warning', icon: 'translate' }
    };

    // Organize data by grade
    const gradeData = {};
    data.forEach(item => {
        const grade = item._id.grade;
        const subject = item._id.subject;
        const count = item.count;

        if (!gradeData[grade]) {
            gradeData[grade] = {};
        }
        gradeData[grade][subject] = count;
    });

    // Sort grades
    const sortedGrades = Object.keys(gradeData).sort((a, b) => a - b);

    // Generate HTML
    let html = '';

    sortedGrades.forEach(grade => {
        const subjects = gradeData[grade];

        // Calculate total for this grade
        const total = Object.values(subjects).reduce((sum, count) => sum + count, 0);

        html += `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="card border-0 shadow-sm h-100">
<div class="card-header text-dark text-center py-2" style="background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%); border-bottom: 3px solid #667eea;">

                        <h6 class="mb-0 fw-bold">
                            <i class="bi bi-mortarboard-fill me-2"></i>
                            Grade ${grade}
                        </h6>
                        <small class="opacity-75">${total} Total Questions</small>
                    </div>
                    <div class="card-body p-3">
                        <div class="d-flex flex-column gap-2">
        `;

        // Display each subject
        ['math', 'science', 'english', 'arabic'].forEach(subject => {
            const count = subjects[subject] || 0;
            const info = subjectInfo[subject];

            html += `
                <div class="d-flex justify-content-between align-items-center p-2 rounded"
                     style="background-color: rgba(var(--bs-${info.color}-rgb), 0.1);">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-${info.icon} text-${info.color}"></i>
                        <span class="small">${info.name}</span>
                    </div>
                    <span class="badge bg-${info.color}">${count}</span>
                </div>
            `;
        });

        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    // If no data
    if (sortedGrades.length === 0) {
        html = `
            <div class="col-12 text-center text-muted py-4">
                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                <p class="mt-3">No questions available yet</p>
            </div>
        `;
    }

    container.innerHTML = html;
}

// ========================================
// LOAD USERS
// ========================================
async function loadUsers(page = 1) {
    const token = checkAdminAuth();
    const tbody = document.getElementById('usersTableBody');
    
    // Show loading
    if (page === 1) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                </td>
            </tr>
        `;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/users?page=${page}&limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayUsers(data.users, page === 1);
            
            // Update load more button
            const loadMoreBtn = document.getElementById('loadMoreUsers');
            if (data.pagination.currentPage >= data.pagination.totalPages) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
            
            currentPage.users = page;
        }
    } catch (error) {
        console.error('Load users error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-danger">
                    Failed to load users
                </td>
            </tr>
        `;
    }
}

// Display users
function displayUsers(users, replace = true) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    No users found
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    users.forEach(user => {
        const joinDate = new Date(user.createdAt).toLocaleDateString();
        const percentage = Math.round((user.totalBestScore / 40) * 100);
        
        html += `
            <tr>
                <td class="px-4 py-3">
                    <strong>${user.fullName}</strong>
                </td>
                <td class="px-4 py-3">
                    <code>${user.username}</code>
                </td>
                <td class="px-4 py-3">
                    <span class="badge bg-primary">Grade ${user.grade}</span>
                </td>
                <td class="px-4 py-3">
                    ${user.school}
                </td>
                <td class="px-4 py-3">
                    <strong class="text-success">${percentage}%</strong>
                    <small class="text-muted">(${user.totalBestScore}/40)</small>
                </td>
                <td class="px-4 py-3">
                    <small class="text-muted">${joinDate}</small>
                </td>
            </tr>
        `;
    });
    
    if (replace) {
        tbody.innerHTML = html;
    } else {
        tbody.innerHTML += html;
    }
}

// Load more users
function loadMoreUsers() {
    loadUsers(currentPage.users + 1);
}

// Search users
let searchTimeout;
function searchUsers() {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        const search = document.getElementById('userSearch').value;
        loadUsersWithSearch(search);
    }, 500);
}

async function loadUsersWithSearch(search) {
    const token = checkAdminAuth();
    const tbody = document.getElementById('usersTableBody');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <div class="spinner-border text-primary" role="status"></div>
            </td>
        </tr>
    `;
    
    try {
        const response = await fetch(`${API_URL}/admin/users?search=${search}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayUsers(data.users);
        }
    } catch (error) {
        console.error('Search users error:', error);
    }
}

// ========================================
// LOAD QUIZ ATTEMPTS
// ========================================
async function loadAttempts(page = 1) {
    const token = checkAdminAuth();
    const tbody = document.getElementById('attemptsTableBody');
    
    // Show loading
    if (page === 1) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                </td>
            </tr>
        `;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/attempts?page=${page}&limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayAttempts(data.attempts, page === 1);
            
            // Update load more button
            const loadMoreBtn = document.getElementById('loadMoreAttempts');
            if (data.pagination.currentPage >= data.pagination.totalPages) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
            
            currentPage.attempts = page;
        }
    } catch (error) {
        console.error('Load attempts error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-danger">
                    Failed to load quiz attempts
                </td>
            </tr>
        `;
    }
}

// Display attempts
function displayAttempts(attempts, replace = true) {
    const tbody = document.getElementById('attemptsTableBody');
    
    if (attempts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                    No quiz attempts found
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    attempts.forEach(attempt => {
        const date = new Date(attempt.completedAt).toLocaleString();
        const percentage = Math.round((attempt.score / 10) * 100);
        
        html += `
            <tr>
                <td class="px-4 py-3">
                    <strong>${attempt.user?.fullName || 'Unknown'}</strong><br>
                    <small class="text-muted">${attempt.user?.school || ''}</small>
                </td>
                <td class="px-4 py-3">
                    <span class="badge bg-info text-capitalize">${attempt.subject}</span>
                </td>
                <td class="px-4 py-3">
                    <span class="badge bg-primary">Grade ${attempt.user?.grade || '-'}</span>
                </td>
                <td class="px-4 py-3">
                    <strong class="text-success">${percentage}%</strong>
                    <small class="text-muted">(${attempt.score}/10)</small>
                </td>
                <td class="px-4 py-3">
                    <small class="text-muted">${date}</small>
                </td>
            </tr>
        `;
    });
    
    if (replace) {
        tbody.innerHTML = html;
    } else {
        tbody.innerHTML += html;
    }
}

// Load more attempts
function loadMoreAttempts() {
    loadAttempts(currentPage.attempts + 1);
}





// ========================================
// LOAD QUESTIONS
// ========================================
// ========================================
// LOAD QUESTIONS (UPDATED WITH FILTERS)
// ========================================
async function loadQuestions(page = 1) {
    const token = checkAdminAuth();
    const tbody = document.getElementById('questionsTableBody');
    
    // Show loading
    if (page === 1) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Loading questions...</p>
                </td>
            </tr>
        `;
    }
    
    try {
        // Build query string with filters
        const params = new URLSearchParams({
            page: page,
            limit: 150
        });
        
        if (questionFilters.subject) {
            params.append('subject', questionFilters.subject);
        }
        
        if (questionFilters.grade) {
            params.append('grade', questionFilters.grade);
        }
        
        if (questionFilters.search) {
            params.append('search', questionFilters.search);
        }
        if (questionFilters.recent) {
    params.append('recent', questionFilters.recent);
}
        console.log('Loading questions with filters:', questionFilters);
        
        const response = await fetch(`${API_URL}/admin/questions?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
    const startSerial = ((page - 1) * 50) + 1;
    displayQuestions(data.questions, page === 1, startSerial);
            
            // Update load more button
            const loadMoreBtn = document.getElementById('loadMoreQuestions');
            if (data.pagination.currentPage >= data.pagination.totalPages) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
            
            // Show count
            if (data.pagination.totalQuestions === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-5 text-muted">
                            <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                            <p class="mt-3">No questions found with current filters</p>
                            <button class="btn btn-primary mt-2" onclick="clearFilters()">
                                Clear Filters
                            </button>
                        </td>
                    </tr>
                `;
            }
            
            currentPage.questions = page;
        }
    } catch (error) {
        console.error('Load questions error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                    <p class="mt-2">Failed to load questions</p>
                    <button class="btn btn-primary mt-2" onclick="loadQuestions()">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        Try Again
                    </button>
                </td>
            </tr>
        `;
    }
}








//here

// Display questions (UPDATED WITH SERIAL & PREVIEW)
// Display questions (UPDATED WITH CHECKBOX AND VALIDATION INDICATOR)
function displayQuestions(questions, replace = true, startSerial = 1) {
    const tbody = document.getElementById('questionsTableBody');

    if (questions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    No questions found
                </td>
            </tr>
        `;
        return;
    }

    // Clear selected questions if replacing
    if (replace) {
        selectedQuestionIds.clear();
        updateDeleteButton();
        document.getElementById('selectAllQuestions').checked = false;
    }

    let html = '';

    questions.forEach((question, index) => {
        const serial = startSerial + index;
        const questionText = question.questionTextEn.substring(0, 60) + (question.questionTextEn.length > 60 ? '...' : '');
        const isChecked = selectedQuestionIds.has(question._id) ? 'checked' : '';

        // Validate if correct answer is among options (for multiple choice)
        let validationIcon = '';
        if (question.questionType === 'multiple_choice' && question.options && question.options.length > 0) {
            const correctAnswer = question.correctAnswer;
            const isValid = question.options.some(option => option.trim() === correctAnswer.trim());

            if (!isValid) {
                validationIcon = '<i class="bi bi-x-circle-fill text-danger ms-2" title="Correct answer is not among the options!" style="font-size: 1.2rem;"></i>';
            }
        }

       const highlightClass = (currentEditingQuestionId === question._id) ? 'highlight-row' : '';

        html += `
                <tr class="${highlightClass}" data-question-id="${question._id}">

                <td class="px-4 py-3">
                    <input type="checkbox" class="form-check-input question-checkbox"
                           data-question-id="${question._id}"
                           onchange="toggleQuestionSelection('${question._id}')"
                           ${isChecked}>
                </td>
                <td class="px-4 py-3">
                    <strong class="text-muted">${serial}</strong>
                </td>
                <td class="px-4 py-3">
                    <span class="badge bg-info text-capitalize">${question.subject}</span>
                </td>
                <td class="px-4 py-3">
                    ${question.grades && question.grades.length > 0
                        ? question.grades.map(g => `<span class="badge bg-primary me-1">Grade ${g}</span>`).join('')
                        : '<span class="badge bg-secondary">No grade</span>'}
                </td>
                <td class="px-4 py-3">
                    <small class="text-muted text-capitalize">${question.questionType.replace('_', ' ')}</small>
                </td>
                <td class="px-4 py-3">
                    <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${questionText}
                        ${validationIcon}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info" onclick="viewQuestion('${question._id}')" title="View">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="editQuestion('${question._id}')" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteQuestion('${question._id}')" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    if (replace) {
        tbody.innerHTML = html;
    } else {
        tbody.innerHTML += html;
    }
}









// Load more questions
function loadMoreQuestions() {
    loadQuestions(currentPage.questions + 1);
}

// Delete question
async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question?')) {
        return;
    }
    
    const token = checkAdminAuth();
    
    try {
        const response = await fetch(`${API_URL}/admin/questions/${questionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Question deleted successfully');
            loadQuestions(); // Reload questions
            loadStatistics(); // Update stats
        } else {
            alert(data.message || 'Failed to delete question');
        }
    } catch (error) {
        console.error('Delete question error:', error);
        alert('Failed to delete question');
    }
}

// Admin logout
function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        window.location.href = 'admin-login.html';
    }
}


// ========================================
// QUESTION MANAGEMENT
// ========================================

// Open Add Question Modal
function openAddQuestionModal() {
    // Clear editing question ID
    currentEditingQuestionId = null;

    // Remove any highlights
    document.querySelectorAll('.highlight-row').forEach(row => {
        row.classList.remove('highlight-row');
    });
    // Reset form
    document.getElementById('questionForm').reset();
    document.getElementById('questionId').value = '';
    document.getElementById('questionModalTitle').textContent = 'Add Question';

    // Uncheck all grade checkboxes
    document.querySelectorAll('.grade-checkbox').forEach(cb => cb.checked = false);

    // Reset options container
    document.getElementById('optionsContainer').style.display = 'none';

    // Open modal
    const modal = new bootstrap.Modal(document.getElementById('questionModal'));
    modal.show();
}

// Handle question type change
function handleQuestionTypeChange() {
    const type = document.getElementById('questionType').value;
    const optionsContainer = document.getElementById('optionsContainer');
    
    if (type === 'multiple_choice') {
        optionsContainer.style.display = 'block';
        // Make options required
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`option${i}`).required = true;
        }
    } else {
        optionsContainer.style.display = 'none';
        // Remove required from options
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`option${i}`).required = false;
        }
    }
}

// Save Question (Add or Edit)
// Save Question (Add or Edit)
async function saveQuestion() {
    const token = checkAdminAuth();
    const questionId = document.getElementById('questionId').value;
    
    // Get form values
    const subject = document.getElementById('subject').value;
    const grades = Array.from(document.querySelectorAll('.grade-checkbox:checked'))
        .map(cb => parseInt(cb.value));
    const questionType = document.getElementById('questionType').value;
    const questionTextEn = document.getElementById('questionTextEn').value;
    const questionTextAr = document.getElementById('questionTextAr').value;
    const correctAnswer = document.getElementById('correctAnswer').value;
    const imageUrl = document.getElementById('imageUrl').value;
    const imagePosition = document.getElementById('imagePosition').value;

    // Validate required fields
    if (!subject || grades.length === 0 || !questionType || !questionTextEn || !questionTextAr || !correctAnswer) {
        alert('Please fill in all required fields and select at least one grade');
        return;
    }
    
    // Get options (for multiple choice)
    let options = [];
    if (questionType === 'multiple_choice') {
        options = [
            document.getElementById('option1').value,
            document.getElementById('option2').value,
            document.getElementById('option3').value,
            document.getElementById('option4').value
        ].filter(opt => opt.trim() !== '');
        
        if (options.length < 2) {
            alert('Please provide at least 2 options for multiple choice questions');
            return;
        }
    }
    
    // Prepare data
    const questionData = {
        subject,
        grades,
        questionType,
        questionTextEn,
        questionTextAr,
        options,
        correctAnswer,
        imageUrl: imageUrl || null,
        imagePosition: imagePosition || 'below'
    };
    
    try {
        let response;
        
        if (questionId) {
            // Update existing question
            response = await fetch(`${API_URL}/admin/questions/${questionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(questionData)
            });
        } else {
            // Add new question
            response = await fetch(`${API_URL}/admin/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(questionData)
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);

            // Store the question ID for scrolling after reload
            const savedQuestionId = questionId || data.questionId || currentEditingQuestionId;

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('questionModal'));
            modal.hide();

            // Reload questions and scroll to the saved question
            await loadQuestions();
            loadStatistics();

            // After questions are loaded, scroll to the saved question
            if (savedQuestionId) {
                setTimeout(() => {
                    const savedRow = document.querySelector(`tr[data-question-id="${savedQuestionId}"]`);
                    if (savedRow) {
                        savedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Keep highlight for 3 seconds then remove
                        setTimeout(() => {
                            savedRow.classList.remove('highlight-row');
                            currentEditingQuestionId = null;
                        }, 3000);
                    }
                }, 500); // Wait for DOM to update
            } else {
                // Clear highlight if no ID
                currentEditingQuestionId = null;
            }
        } else {
            alert(data.message || 'Failed to save question');
        }
    } catch (error) {
        console.error('Save question error:', error);
        alert('Failed to save question');
    }
}




// Edit Question
async function editQuestion(questionId) {
    const token = checkAdminAuth();

    try {
        // Store the editing question ID for highlighting
        currentEditingQuestionId = questionId;

        // Remove previous highlights and add to current row
        document.querySelectorAll('.highlight-row').forEach(row => {
            row.classList.remove('highlight-row');
        });

        const currentRow = document.querySelector(`tr[data-question-id="${questionId}"]`);
        if (currentRow) {
            currentRow.classList.add('highlight-row');
            // Scroll to the row smoothly
            currentRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Fetch question data
        const response = await fetch(`${API_URL}/admin/questions/${questionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            const question = data.question;

            // Populate form
            document.getElementById('questionId').value = question._id;
            document.getElementById('subject').value = question.subject;

            // Uncheck all grades first
            document.querySelectorAll('.grade-checkbox').forEach(cb => cb.checked = false);
            // Check the grades for this question
            if (question.grades && Array.isArray(question.grades)) {
                question.grades.forEach(g => {
                    const checkbox = document.getElementById(`grade${g}`);
                    if (checkbox) checkbox.checked = true;
                });
            }

            document.getElementById('questionType').value = question.questionType;
            document.getElementById('questionTextEn').value = question.questionTextEn;
            document.getElementById('questionTextAr').value = question.questionTextAr;
            document.getElementById('correctAnswer').value = question.correctAnswer;
            document.getElementById('imageUrl').value = question.imageUrl || '';
                        document.getElementById('imagePosition').value = question.imagePosition || 'below';

            // Handle question type
            handleQuestionTypeChange();

            // Populate options if multiple choice
            if (question.questionType === 'multiple_choice' && question.options) {
                question.options.forEach((option, index) => {
                    const optionInput = document.getElementById(`option${index + 1}`);
                    if (optionInput) {
                        optionInput.value = option;
                    }
                });
            }

            // Update modal title
            document.getElementById('questionModalTitle').textContent = 'Edit Question';

            // Open modal
            const modal = new bootstrap.Modal(document.getElementById('questionModal'));
            modal.show();

        } else {
            alert(data.message || 'Failed to load question');
        }
    } catch (error) {
        console.error('Edit question error:', error);
        alert('Failed to load question');
    }
}











// ========================================
// QUESTION FILTERS
// ========================================

// Current filter state
let questionFilters = {
    subject: '',
    grade: '',
    search: '',
    recent: ''
};

// Filter questions
function filterQuestions() {
    // Get filter values
    questionFilters.subject = document.getElementById('filterSubject').value;
    questionFilters.grade = document.getElementById('filterGrade').value;
    questionFilters.search = document.getElementById('searchQuestion').value;
        questionFilters.recent = document.getElementById('filterRecent').value;

    // Update filter summary
    updateFilterSummary();
    
    // Reset page and reload
    currentPage.questions = 1;
    loadQuestions(1);
}

// Update filter summary text
function updateFilterSummary() {
    const summary = document.getElementById('filterSummary');
    if (!summary) return;
    
    let text = 'Showing ';
    const filters = [];
    
    if (questionFilters.subject) {
        const subjectName = {
            'math': 'Mathematics',
            'science': 'Science',
            'english': 'English',
            'arabic': 'Arabic'
        }[questionFilters.subject];
        filters.push(subjectName);
    }
    
    if (questionFilters.grade) {
        filters.push(`Grade ${questionFilters.grade}`);
    }
    if (questionFilters.recent) {
    const recentName = {
        '15min': 'last 15 minutes',
        '30min': 'last 30 minutes',
        '1hour': 'last hour',
        '2hours': 'last 2 hours',
        '3hours': 'last 3 hours',
        '6hours': 'last 6 hours',
        '12hours': 'last 12 hours',
        '24hours': 'last 24 hours'
    }[questionFilters.recent];
    filters.push(`added ${recentName}`);
}
    if (questionFilters.search) {
        filters.push(`matching "${questionFilters.search}"`);
    }
    
    if (filters.length === 0) {
        text = 'Showing all questions';
    } else {
        text += filters.join(' • ');
    }
    
    summary.textContent = text;
}

// Clear all filters
function clearFilters() {
    document.getElementById('filterSubject').value = '';
    document.getElementById('filterGrade').value = '';
    document.getElementById('searchQuestion').value = '';
        document.getElementById('filterRecent').value = '';

    questionFilters = {
        subject: '',
        grade: '',
        search: '',
                recent: ''

    };
    
    updateFilterSummary();
    currentPage.questions = 1;
    loadQuestions(1);
}









// ========================================
// VIEW QUESTION (PREVIEW)
// ========================================

let currentPreviewQuestionId = null;

async function viewQuestion(questionId) {
    const token = checkAdminAuth();
    
    try {
        // Fetch question data
        const response = await fetch(`${API_URL}/admin/questions/${questionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayQuestionPreview(data.question);
            currentPreviewQuestionId = questionId;
        } else {
            alert(data.message || 'Failed to load question');
        }
    } catch (error) {
        console.error('View question error:', error);
        alert('Failed to load question');
    }
}


function displayQuestionPreview(question) {
    // Update subject badge
    const subjectNames = {
        'math': 'Mathematics',
        'science': 'Science',
        'english': 'English',
        'arabic': 'Arabic'
    };
    document.getElementById('previewSubject').textContent = subjectNames[question.subject] || question.subject;
    
    // Update grade badge (show all grades)
    const gradesText = question.grades && question.grades.length > 0
        ? question.grades.map(g => `Grade ${g}`).join(', ')
        : 'No grade';
    document.getElementById('previewGrade').textContent = gradesText;
    
    // Update type badge
    const typeNames = {
        'multiple_choice': 'Multiple Choice',
        'true_false': 'True/False',
        'text_input': 'Text Input'
    };
    document.getElementById('previewType').textContent = typeNames[question.questionType] || question.questionType;
    
    // Update question text (with LaTeX rendering)
    document.getElementById('previewQuestionEn').innerHTML = question.questionTextEn;
    document.getElementById('previewQuestionAr').innerHTML = question.questionTextAr;
    
    // Update options (if multiple choice)
    const optionsContainer = document.getElementById('previewOptionsContainer');
    const optionsList = document.getElementById('previewOptions');
    
    if (question.questionType === 'multiple_choice' && question.options && question.options.length > 0) {
        optionsContainer.style.display = 'block';
        
        let optionsHtml = '';
        question.options.forEach((option, index) => {
            const isCorrect = option === question.correctAnswer;
            const badgeClass = isCorrect ? 'success' : 'secondary';
            const icon = isCorrect ? '<i class="bi bi-check-circle-fill me-2"></i>' : '';
            
            optionsHtml += `
                <div class="list-group-item d-flex align-items-center">
                    <span class="badge bg-${badgeClass} me-3">${String.fromCharCode(65 + index)}</span>
                    ${icon}
                    <span>${option}</span>
                </div>
            `;
        });
        
        optionsList.innerHTML = optionsHtml;
    } else {
        optionsContainer.style.display = 'none';
    }
    
    // Update correct answer - **CHANGED: Use innerHTML instead of textContent**
    document.getElementById('previewCorrectAnswer').innerHTML = question.correctAnswer;
    
    // Update image (if exists)
    const imageContainer = document.getElementById('previewImageContainer');
    const imageEl = document.getElementById('previewImage');
    
    if (question.imageUrl) {
        imageContainer.style.display = 'block';
        imageEl.src = question.imageUrl;
        imageEl.onerror = function() {
            imageContainer.style.display = 'none';
        };
    } else {
        imageContainer.style.display = 'none';
    }
    
    // Render MathJax for LaTeX - **CHANGED: Added previewCorrectAnswer to the array**
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([
            document.getElementById('previewQuestionEn'),
            document.getElementById('previewQuestionAr'),
            document.getElementById('previewOptions'),
            document.getElementById('previewCorrectAnswer')  // ← Added this line
        ]).catch((err) => console.log('MathJax error:', err));
    }
    
    // Open modal
    const modal = new bootstrap.Modal(document.getElementById('previewModal'));
    modal.show();
}

function editQuestionFromPreview() {
    // Close preview modal
    const previewModal = bootstrap.Modal.getInstance(document.getElementById('previewModal'));
    previewModal.hide();
    
    // Open edit modal
    if (currentPreviewQuestionId) {
        editQuestion(currentPreviewQuestionId);
    }
}









// ========================================
// LATEX CONVERSION FUNCTIONS
// ========================================

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'} me-2"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 2 seconds
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

/**
 * Convert mathematical expressions to LaTeX format (numbers only, preserve text)
 */
/**
 * Convert mathematical expressions to LaTeX format (numbers only, preserve text)
 */


/**
 * Convert mathematical expressions to LaTeX format (numbers only, preserve text)
 */



/**
 * Convert mathematical expressions to LaTeX format (numbers only, preserve text)
 */
// ========================================
// LATEX CONVERSION FUNCTIONS
// ========================================

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'} me-2"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 2 seconds
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

/**
 * Convert mathematical expressions to LaTeX format (numbers only, preserve text)
 */
function convertToLatex(fieldId) {
    const field = document.getElementById(fieldId);
    let text = field.value;

    if (!text.trim()) {
        alert('Please enter some text first');
        return;
    }

    const originalText = text;
    
    // Check if this is the correct answer field
    const isCorrectAnswerField = (fieldId === 'correctAnswer');

    // === Common Mathematical Conversions ===
    const conversions = [
        // Absolute values: |-150| → |150| (keep the bars)
        [/\|([^|]+)\|/g, '|$1|'],
        
        // Fractions: 3/4 → \frac{3}{4}, -8/9 → -\frac{8}{9}
        [/(-?\d+)\/(\d+)/g, '\\frac{$1}{$2}'],

        // Percentages: 40% → 40\% (escape the percent sign)
    [/(\d+)%/g, '$1\\%'],
       
        // Repeating decimals: -0.(8) → -0.\overline{8}
        [/(-?\d+)\.\((\d+)\)/g, '$1.\\overline{$2}'],
        
        // Exponents: 2^3 → 2^{3}
        [/\^(\d+)/g, '^{$1}'],
        [/\^([a-zA-Z])/g, '^{$1}'],

        // Square roots: sqrt(25) → \sqrt{25}
        [/sqrt\(([^)]+)\)/gi, '\\sqrt{$1}'],

        // Multiplication: * or × → \times
        [/\*/g, '\\times'],
        [/×/g, '\\times'],

        // Division: ÷ → \div
        [/÷/g, '\\div'],

        // Plus-minus: ± or +- → \pm
        [/±/g, '\\pm'],
        [/\+\-/g, '\\pm'],

        // Inequalities
        [/<=/g, '\\leq'],
        [/>=/g, '\\geq'],

        // Not equal
        [/!=/g, '\\neq'],
        [/≠/g, '\\neq'],

        // Degrees: ° → ^\circ
        [/(\d+)°/g, '$1^\\circ'],

        // Pi symbol
        [/π/g, '\\pi'],

        // Superscript numbers: ² ³ ⁴ etc
        [/²/g, '^{2}'],
        [/³/g, '^{3}'],
        [/⁴/g, '^{4}'],
        [/⁵/g, '^{5}'],
        [/⁶/g, '^{6}'],
        [/⁷/g, '^{7}'],
        [/⁸/g, '^{8}'],
        [/⁹/g, '^{9}'],

        // Subscript numbers: ₀ ₁ ₂ etc
        [/₀/g, '_{0}'],
        [/₁/g, '_{1}'],
        [/₂/g, '_{2}'],
        [/₃/g, '_{3}'],
        [/₄/g, '_{4}'],
        [/₅/g, '_{5}'],
        [/₆/g, '_{6}'],
        [/₇/g, '_{7}'],
        [/₈/g, '_{8}'],
        [/₉/g, '_{9}']
    ];

    // Apply conversions
    conversions.forEach(([pattern, replacement]) => {
        text = text.replace(pattern, replacement);
    });

    // === Check if any conversions were made ===
    const hasLatexCommands = /\\(frac|sqrt|times|div|pm|leq|geq|neq|circ|pi|overline)/.test(text);
    const hasNumbers = /-?\d+/.test(text);
    
    if (!hasLatexCommands && !hasNumbers && text === originalText) {
        showToast('No mathematical expressions found to convert', 'info');
        return;
    }

    // === Wrap math expressions in $ $ ===
    
    // For correct answer field, don't auto-wrap (user will use wrap button)
    if (isCorrectAnswerField) {
        field.value = text;
        showToast('Converted to LaTeX format (use Wrap button to add delimiters)', 'success');
        return;
    }

    // 1. Wrap math expressions with operators: -10 - (-4) → $-10 - (-4)$
    text = text.replace(
        /(?<!\$)(-?\d+(?:\.\d+)?(?:\\overline\{\d+\})?)(\s*[\+\-×÷\\times\\div]\s*\(?-?\d+(?:\.\d+)?(?:\\overline\{\d+\})?\)?)+(?!\$)/g,
        (match) => `$${match}$`
    );

    // 2. Wrap absolute value expressions: |-150| + |-15| → $|-150| + |-15|$
    text = text.replace(
        /(?<!\$)\|[^|]+\|(\s*[\+\-×÷\\times\\div]\s*\|[^|]+\|)*(?!\$)/g,
        (match) => `$${match}$`
    );

    // 3. Wrap fractions: \frac{3}{4} → $\frac{3}{4}$
    text = text.replace(
        /(?<!\$)\\frac\{[^}]+\}\{[^}]+\}(?!\$)/g,
        (match) => `$${match}$`
    );

    // 4. Wrap square roots: \sqrt{25} → $\sqrt{25}$
    text = text.replace(
        /(?<!\$)\\sqrt\{[^}]+\}(?!\$)/g,
        (match) => `$${match}$`
    );

    // 5. Wrap equations: I = prt → $I = prt$
    text = text.replace(
        /(?<!\$)([a-zA-Z])\s*=\s*([a-zA-Z0-9\+\-\\times\\div\s]+)(?=\s*$|[.?!,])/g,
        (match) => `$${match.trim()}$`
    );

    // 6. Wrap standalone numbers with LaTeX (like overline): -0.\overline{8} → $-0.\overline{8}$
    text = text.replace(
        /(?<!\$)(-?\d+(?:\.\d+)?\\overline\{\d+\})(?!\$)/g,
        (match) => `$${match}$`
    );

  // 7a. Wrap numbers WITH units using \text{}: 0.35 mi/min → $0.35 \text{ mi/min}$
text = text.replace(
    /(?<!\$)(?<!\w)(-?\d+(?:\.\d+)?(?:\\%)?)\s+([a-zA-Z]+(?:\/[a-zA-Z]+)?)(?!\$)/g,
    (match, number, unit) => `$${number} \\text{ ${unit}}$`
);

// 7b. Wrap remaining standalone numbers: 6000 → $6000$, -6000 → $-6000$, 40\% → $40\%$
// 7b. Wrap remaining standalone numbers: 6000 → $6000$, -6000 → $-6000$, 40\% → $40\%$
// BUT skip numbers inside curly braces (like \frac{1}{2})
text = text.replace(
    /(?<!\$)(?<!\w)(?<!\{)(-?\d+(?:\.\d+)?(?:\\%)?)(?!\})(?!\w)(?!\$)/g,
    (match) => `$${match}$`
);


    // Update field
    field.value = text;

    // Show success
    showToast('Converted to LaTeX format', 'success');
}

/**
 * Wrap selected text or entire content in LaTeX delimiters
 */
function wrapInLatex(fieldId) {
    const field = document.getElementById(fieldId);
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selectedText = field.value.substring(start, end);
    
    if (selectedText) {
        // Wrap only selected text
        const before = field.value.substring(0, start);
        const after = field.value.substring(end);
        field.value = before + '\\(' + selectedText + '\\)' + after;
        
        // Restore cursor position
        field.selectionStart = start + 2;
        field.selectionEnd = end + 2;
    } else {
        // Wrap entire content
        if (field.value.trim()) {
            field.value = '\\(' + field.value + '\\)';
        } else {
            alert('Please enter some text or select text to wrap');
            return;
        }
    }
    
    field.focus();
    showToast('Wrapped in LaTeX delimiters', 'success');
}










/**
 * Wrap selected text or entire content in LaTeX delimiters
 */
function wrapInLatex(fieldId) {
    const field = document.getElementById(fieldId);
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selectedText = field.value.substring(start, end);
    
    if (selectedText) {
        // Wrap only selected text
        const before = field.value.substring(0, start);
        const after = field.value.substring(end);
        field.value = before + '\\(' + selectedText + '\\)' + after;
        
        // Restore cursor position
        field.selectionStart = start + 2;
        field.selectionEnd = end + 2;
    } else {
        // Wrap entire content
        if (field.value.trim()) {
            field.value = '\\(' + field.value + '\\)';
        } else {
            alert('Please enter some text or select text to wrap');
            return;
        }
    }
    
    field.focus();
    showToast('Wrapped in LaTeX delimiters', 'success');
}
// ========================================
// EXCEL IMPORT FUNCTIONS
// ========================================

function openUploadModal() {
    const modal = new bootstrap.Modal(document.getElementById('uploadModal'));
    document.getElementById('excelFile').value = '';
    document.getElementById('uploadResult').innerHTML = '';
    document.getElementById('uploadProgress').style.display = 'none';
    modal.show();
}

async function uploadExcel() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an Excel file');
        return;
    }

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
        alert('Please select a valid Excel file (.xlsx or .xls)');
        return;
    }

    const token = checkAdminAuth();
    const formData = new FormData();
    formData.append('file', file);

    // Show progress
    document.getElementById('uploadProgress').style.display = 'block';
    document.getElementById('uploadResult').innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/admin/import-questions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        // Hide progress
        document.getElementById('uploadProgress').style.display = 'none';

        if (data.success) {
            let resultHTML = `
                <div class="alert alert-success">
                    <h6 class="alert-heading"><i class="bi bi-check-circle me-2"></i>Import Successful!</h6>
                    <p class="mb-2">${data.message}</p>
                    <hr>
                    <p class="mb-0">
                        <strong>✅ Successfully imported:</strong> ${data.successCount} questions<br>
                        ${data.errorCount > 0 ? `<strong>❌ Errors:</strong> ${data.errorCount} questions` : ''}
                    </p>
                </div>
            `;

            // Show errors if any
            if (data.errors && data.errors.length > 0) {
                resultHTML += `
                    <div class="alert alert-warning">
                        <h6 class="alert-heading">Errors Found:</h6>
                        <ul class="mb-0 small">
                `;
                data.errors.forEach(err => {
                    resultHTML += `<li>Row ${err.row}: ${err.error}${err.question ? ' - ' + err.question : ''}</li>`;
                });
                resultHTML += `</ul></div>`;
            }

            document.getElementById('uploadResult').innerHTML = resultHTML;

            // Refresh questions list and statistics
            if (currentPage.questions) {
                currentPage.questions = 1;
                loadQuestions();
            }
            loadStatistics();

        } else {
            document.getElementById('uploadResult').innerHTML = `
                <div class="alert alert-danger">
                    <strong><i class="bi bi-x-circle me-2"></i>Import Failed:</strong> ${data.message}
                </div>
            `;
        }

    } catch (error) {
        console.error('Upload error:', error);
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('uploadResult').innerHTML = `
            <div class="alert alert-danger">
                <strong><i class="bi bi-x-circle me-2"></i>Connection Error:</strong> Failed to upload file. Please try again.
            </div>
        `;
    }
}



// ========================================
// EXPORT QUESTIONS TO EXCEL
// ========================================
async function exportQuestions(event) {
    const token = checkAdminAuth();

    
    // Get current filters
    const subject = document.getElementById('filterSubject')?.value || '';
    const grade = document.getElementById('filterGrade')?.value || '';
    
    // Build query string
    let queryParams = [];
    if (subject) queryParams.push(`subject=${subject}`);
    if (grade) queryParams.push(`grade=${grade}`);
    const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
    
    try {
        // Show loading indicator
        const originalText = event.target.innerHTML;
        event.target.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Exporting...';
        event.target.disabled = true;
        
        const response = await fetch(`${API_URL}/admin/export-questions${queryString}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            // Get the blob from response
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Get filename from response headers or generate one
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'questions_export.xlsx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) filename = filenameMatch[1];
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // Show success message
            showToast('Questions exported successfully!', 'success');
        } else {
            const error = await response.json();
            showToast('Export failed: ' + error.message, 'error');
        }
        
        // Restore button
        event.target.innerHTML = originalText;
        event.target.disabled = false;
        
    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed. Please try again.', 'error');
        
        // Restore button
        event.target.innerHTML = '<i class="bi bi-download me-2"></i>Export to Excel';
        event.target.disabled = false;
    }
}


/**
 * Insert a line break at cursor position
 */
function insertLineBreak(fieldId) {
    const field = document.getElementById(fieldId);
    const start = field.selectionStart;
    const end = field.selectionEnd;
    
    // Insert <br> tag at cursor position
    const before = field.value.substring(0, start);
    const after = field.value.substring(end);
    field.value = before + '<br>' + after;
    
    // Move cursor after the inserted <br>
    const newCursorPos = start + 4; // length of '<br>'
    field.selectionStart = newCursorPos;
    field.selectionEnd = newCursorPos;
    
    field.focus();
    showToast('Line break inserted', 'success');
}

// ========================================
// TEXT COLORIZATION FUNCTION
// ========================================

/**
 * Colorize selected text in a field
 */
function colorizeText(fieldId, color) {
    const field = document.getElementById(fieldId);
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selectedText = field.value.substring(start, end);
    
    if (!selectedText) {
        alert('Please select some text first');
        return;
    }
    
    // Map color names to hex values
    const colorMap = {
        'red': '#dc3545',
        'blue': '#0d6efd',
        'green': '#198754',
        'orange': '#fd7e14',
        'black': '#000000'
    };
    
    const colorHex = colorMap[color] || color;
    
    // Wrap selected text in span with color
    const before = field.value.substring(0, start);
    const after = field.value.substring(end);
    const coloredText = `<span style="color: ${colorHex};">${selectedText}</span>`;
    
    field.value = before + coloredText + after;
    
    // Restore cursor position
    const newCursorPos = start + coloredText.length;
    field.selectionStart = newCursorPos;
    field.selectionEnd = newCursorPos;
    
    field.focus();
    showToast(`Text colored ${color}`, 'success');
}


/**
 * Make selected text bold
 */
function boldText(fieldId) {
    const field = document.getElementById(fieldId);
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selectedText = field.value.substring(start, end);
    
    if (!selectedText) {
        alert('Please select some text first');
        return;
    }
    
    // Wrap selected text in strong tag
    const before = field.value.substring(0, start);
    const after = field.value.substring(end);
    const boldedText = `<strong>${selectedText}</strong>`;
    
    field.value = before + boldedText + after;
    
    // Restore cursor position
    const newCursorPos = start + boldedText.length;
    field.selectionStart = newCursorPos;
    field.selectionEnd = newCursorPos;
    
    field.focus();
    showToast('Text made bold', 'success');
}

/**
 * Underline selected text
 */
function underlineText(fieldId) {
    const field = document.getElementById(fieldId);
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selectedText = field.value.substring(start, end);

    if (!selectedText) {
        alert('Please select some text first');
        return;
    }

    // Wrap selected text in u tag
    const before = field.value.substring(0, start);
    const after = field.value.substring(end);
    const underlinedText = `<u>${selectedText}</u>`;

    field.value = before + underlinedText + after;

    // Restore cursor position
    const newCursorPos = start + underlinedText.length;
    field.selectionStart = newCursorPos;
    field.selectionEnd = newCursorPos;

    field.focus();
    showToast('Text underlined', 'success');
}


// ========================================
// BATCH DELETE FUNCTIONS
// ========================================

/**
 * Toggle selection of a single question
 */
function toggleQuestionSelection(questionId) {
    if (selectedQuestionIds.has(questionId)) {
        selectedQuestionIds.delete(questionId);
    } else {
        selectedQuestionIds.add(questionId);
    }

    updateDeleteButton();
    updateSelectAllCheckbox();
}

/**
 * Toggle select all questions
 */
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllQuestions');
    const checkboxes = document.querySelectorAll('.question-checkbox');

    if (selectAllCheckbox.checked) {
        // Select all
        checkboxes.forEach(cb => {
            cb.checked = true;
            selectedQuestionIds.add(cb.dataset.questionId);
        });
    } else {
        // Deselect all
        checkboxes.forEach(cb => {
            cb.checked = false;
            selectedQuestionIds.delete(cb.dataset.questionId);
        });
    }

    updateDeleteButton();
}

/**
 * Update the "Select All" checkbox state
 */
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllQuestions');
    const checkboxes = document.querySelectorAll('.question-checkbox');
    const checkedCount = document.querySelectorAll('.question-checkbox:checked').length;

    if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === checkboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

/**
 * Update the delete button visibility and count
 */
function updateDeleteButton() {
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const countSpan = document.getElementById('selectedCount');
    const count = selectedQuestionIds.size;

    if (count > 0) {
        deleteBtn.style.display = 'inline-block';
        countSpan.textContent = count;
    } else {
        deleteBtn.style.display = 'none';
        countSpan.textContent = '0';
    }
}

/**
 * Delete all selected questions
 */
async function deleteSelectedQuestions() {
    const count = selectedQuestionIds.size;

    if (count === 0) {
        alert('No questions selected');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${count} selected question(s)? This action cannot be undone.`)) {
        return;
    }

    const token = checkAdminAuth();
    const questionIds = Array.from(selectedQuestionIds);

    try {
        // Show loading state
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        const originalHTML = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';
        deleteBtn.disabled = true;

        const response = await fetch(`${API_URL}/admin/questions/batch-delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ questionIds })
        });

    
       
       
       
        const data = await response.json();

        if (data.success) {
            showToast(`Successfully deleted ${data.deletedCount} question(s)`, 'success');

            // Clear selection
            selectedQuestionIds.clear();

            // Hide button and reset (no need to call updateDeleteButton)
            deleteBtn.style.display = 'none';
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Delete Selected (<span id="selectedCount">0</span>)';

            // Reload questions and statistics
            currentPage.questions = 1;
            loadQuestions();
            loadStatistics();
        } else {
            alert(data.message || 'Failed to delete questions');
            deleteBtn.innerHTML = originalHTML;
            deleteBtn.disabled = false;
        }

    } catch (error) {
        console.error('Batch delete error:', error);
        alert('Failed to delete questions');

        // Restore button
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        deleteBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Delete Selected (<span id="selectedCount">' + count + '</span>)';
        deleteBtn.disabled = false;
    }
}
