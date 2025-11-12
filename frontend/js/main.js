/* ============================================
   UAE Schools Competition - Main JavaScript
   ============================================ */

// ===== Global Variables =====
let currentLanguage = 'en'; // Default language









/*// ===== Language Toggle Function =====
function toggleLanguage() {
    const html = document.documentElement;
    const langText = document.getElementById('langText');
    const bootstrapRTL = document.getElementById('bootstrap-rtl');
    
    if (currentLanguage === 'en') {
        // Switch to Arabic
        currentLanguage = 'ar';
        html.setAttribute('lang', 'ar');
        html.setAttribute('dir', 'rtl');
        langText.textContent = 'English';
        
        // Enable RTL Bootstrap
        if (bootstrapRTL) {
            bootstrapRTL.disabled = false;
        }
        
    } else {
        // Switch to English
        currentLanguage = 'en';
        html.setAttribute('lang', 'en');
        html.setAttribute('dir', 'ltr');
        langText.textContent = 'العربية';
        
        // Disable RTL Bootstrap
        if (bootstrapRTL) {
            bootstrapRTL.disabled = true;
        }
    }
    
    // Update all bilingual text elements
    updateBilingualText();
    
    // Save language preference
    localStorage.setItem('preferredLanguage', currentLanguage);
}*/

function toggleLanguage() {
    const html = document.documentElement;
    const langText = document.getElementById('langText');
    const bootstrapRTL = document.getElementById('bootstrap-rtl');
    
    if (currentLanguage === 'en') {
        // Switch to Arabic
        currentLanguage = 'ar';
        html.setAttribute('lang', 'ar');
        html.setAttribute('dir', 'rtl');
        langText.textContent = 'English';
        
        // Enable RTL Bootstrap
        if (bootstrapRTL) {
            bootstrapRTL.disabled = false;
        }
        
    } else {
        // Switch to English
        currentLanguage = 'en';
        html.setAttribute('lang', 'en');
        html.setAttribute('dir', 'ltr');
        langText.textContent = 'العربية';
        
        // Disable RTL Bootstrap
        if (bootstrapRTL) {
            bootstrapRTL.disabled = true;
        }
    }
    
    // Update all bilingual text elements
    updateBilingualText();
    
    // Force update navbar brand specifically
    const navbarBrand = document.querySelector('.navbar-brand span[data-en]');
    if (navbarBrand) {
        navbarBrand.textContent = currentLanguage === 'ar' 
            ? navbarBrand.getAttribute('data-ar')
            : navbarBrand.getAttribute('data-en');
    }
    
    // Update all placeholders
    updatePlaceholders();
    
    // Dispatch custom event for language change
    document.dispatchEvent(new CustomEvent('languageChanged'));
    
    // Save language preference
    localStorage.setItem('preferredLanguage', currentLanguage);
    
    // If on quiz page, refresh the current question to show translated text
    if (typeof currentQuizData !== 'undefined' && currentQuizData.questions.length > 0) {
        displayQuestion(currentQuizData.currentIndex);
    }
}




// ===== Update Bilingual Text =====
function updateBilingualText() {
    const elements = document.querySelectorAll('[data-en][data-ar]');
    
    elements.forEach(element => {
        // Check if element has child elements that should be preserved (icons, buttons, etc.)
        const hasPreservableChildren = element.querySelector('i, img, svg, button, input, select, br') !== null;
        
        // If element has preservable children, find and update only the text span inside
        if (hasPreservableChildren) {
            // Look for a span with data-en/data-ar inside
            const textSpan = element.querySelector('span[data-en], span[data-ar]');
            if (textSpan) {
                // Update only the inner span, preserving all other children
                if (currentLanguage === 'en') {
                    textSpan.textContent = textSpan.getAttribute('data-en');
                } else {
                    textSpan.textContent = textSpan.getAttribute('data-ar');
                }
            } else {
                // No span found, try to find and update only text nodes
                const walker = document.createTreeWalker(
                    element,
                    {
                        acceptNode: function(node) {
                            // Only accept text nodes that are direct children or in simple containers
                            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                            return NodeFilter.FILTER_REJECT;
                        }
                    },
                    false
                );
                
                let textNode = walker.nextNode();
                if (textNode && textNode.textContent.trim()) {
                    if (currentLanguage === 'en') {
                        textNode.textContent = element.getAttribute('data-en');
                    } else {
                        textNode.textContent = element.getAttribute('data-ar');
                    }
                }
            }
        } else {
            // Simple text element - update directly (safe to use textContent)
            if (currentLanguage === 'en') {
                element.textContent = element.getAttribute('data-en');
            } else {
                element.textContent = element.getAttribute('data-ar');
            }
        }
    });
    
    // Update placeholders
    updatePlaceholders();
}

// ===== Update Input Placeholders =====
function updatePlaceholders() {
    // Update all inputs with data-en-placeholder and data-ar-placeholder
    const inputs = document.querySelectorAll('input[data-en-placeholder], input[data-ar-placeholder]');
    
    inputs.forEach(input => {
        const enPlaceholder = input.getAttribute('data-en-placeholder');
        const arPlaceholder = input.getAttribute('data-ar-placeholder');
        
        if (enPlaceholder && arPlaceholder) {
            input.placeholder = currentLanguage === 'en' ? enPlaceholder : arPlaceholder;
        }
    });
    
    // Update select options
    const selects = document.querySelectorAll('select option[data-en], select option[data-ar]');
    selects.forEach(option => {
        if (currentLanguage === 'en') {
            option.textContent = option.getAttribute('data-en') || option.textContent;
        } else {
            option.textContent = option.getAttribute('data-ar') || option.textContent;
        }
    });
}

// ===== Toggle Password Visibility =====
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('bi-eye');
        toggleIcon.classList.add('bi-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('bi-eye-slash');
        toggleIcon.classList.add('bi-eye');
    }
}

// ===== Handle Login Form Submission =====
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showAlert('error', currentLanguage === 'en' ? 'Please fill in all fields' : 'يرجى ملء جميع الحقول');
        return false;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        console.log('Login response:', data); // Debug
        
        showLoading(false);
        
        if (data.success) {
            // Store data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Verify it was saved
            console.log('Token saved:', localStorage.getItem('token'));
            console.log('User saved:', localStorage.getItem('user'));
            
            showAlert('success', currentLanguage === 'en' ? 'Login successful!' : 'تم تسجيل الدخول بنجاح!');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showAlert('error', data.message);
        }
    } catch (error) {
        showLoading(false);
        console.error('Login error:', error);
        showAlert('error', 'Connection error');
    }
    
    return false;
}

// ===== Show Alert Message =====
function showAlert(type, message) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert-custom');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show alert-custom`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// ===== Show/Hide Loading Spinner =====
function showLoading(show) {
    let spinner = document.querySelector('.spinner-wrapper');
    
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.className = 'spinner-wrapper';
        spinner.innerHTML = `
            <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(spinner);
    }
    
    if (show) {
        spinner.classList.add('active');
    } else {
        spinner.classList.remove('active');
    }
}

// ===== Initialize on Page Load =====
document.addEventListener('DOMContentLoaded', function() {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && savedLanguage !== currentLanguage) {
        toggleLanguage();
    }
    
    // Update placeholders
    updatePlaceholders();
    
    console.log('UAE Schools Competition - System Ready');
});
// ===== Handle Registration =====
async function handleRegister(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const grade = document.getElementById('grade').value;
    
    // Get school from either the select or search input
    const schoolSelect = document.getElementById('school');
    const schoolSearch = document.getElementById('schoolSearch');
    const school = schoolSelect ? schoolSelect.value : (schoolSearch ? schoolSearch.value : '');
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!fullName || !username || !email || !grade || !school || !password) {
        showAlert('error', currentLanguage === 'en' ? 'Please fill in all fields' : 'يرجى ملء جميع الحقول');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('error', currentLanguage === 'en' ? 'Passwords do not match' : 'كلمات المرور غير متطابقة');
        return;
    }
    
    if (password.length < 6) {
        showAlert('error', currentLanguage === 'en' ? 'Password must be at least 6 characters' : 'يجب أن تكون كلمة المرور 6 أحرف على الأقل');
        return;
    }
    
    // Validate school is from the list
    if (schoolSearch && window.UAE_SCHOOLS && !window.UAE_SCHOOLS.includes(school)) {
        showAlert('error', currentLanguage === 'en' ? 'Please select a school from the list' : 'يرجى اختيار مدرسة من القائمة');
        return;
    }
    
    // Show loading state on button
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        const btnContent = submitBtn.querySelector('.btn-content');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        if (btnContent) btnContent.classList.add('d-none');
        if (btnLoading) btnLoading.classList.remove('d-none');
        submitBtn.disabled = true;
    }
    
    showLoading(true);
    
    try {
        const apiUrl = window.API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, username, email, grade, school, password })
        });
        
        const data = await response.json();
        
        showLoading(false);
        
        // Reset button state
        if (submitBtn) {
            const btnContent = submitBtn.querySelector('.btn-content');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            if (btnContent) btnContent.classList.remove('d-none');
            if (btnLoading) btnLoading.classList.add('d-none');
            submitBtn.disabled = false;
        }
        
        if (data.success) {
            showAlert('success', currentLanguage === 'en' ? 'Registration successful! Redirecting to login...' : 'تم التسجيل بنجاح! جاري التحويل...');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            showAlert('error', data.message);
        }
    } catch (error) {
        showLoading(false);
        
        // Reset button state
        if (submitBtn) {
            const btnContent = submitBtn.querySelector('.btn-content');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            if (btnContent) btnContent.classList.remove('d-none');
            if (btnLoading) btnLoading.classList.add('d-none');
            submitBtn.disabled = false;
        }
        
        showAlert('error', currentLanguage === 'en' ? 'Connection error. Please try again.' : 'خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    }
}
function logout() {
    const confirmMsg = currentLanguage === 'en' 
        ? 'Are you sure you want to logout?' 
        : 'هل أنت متأكد من تسجيل الخروج؟';
    
    if (confirm(confirmMsg)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}