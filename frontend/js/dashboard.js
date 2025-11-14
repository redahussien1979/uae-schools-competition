/* ============================================
   Dashboard Functionality - COMPLETE VERSION
   ============================================ */

   // Use API_URL from config.js (set globally)
   const API_URL = window.API_URL || 'http://localhost:5000';

   // Load and display user information
   async function loadUserInfo() {
       const token = localStorage.getItem('token');
       
       // Check if logged in
       if (!token) {
           window.location.href = 'login.html';
           return;
       }
       
       if (typeof showLoading === 'function') {
           showLoading(true);
       }
       
       try {
           // Fetch FRESH data from server
           const response = await fetch(`${API_URL}/me`, {
               method: 'GET',
               headers: {
                   'Authorization': `Bearer ${token}`,
                   'Content-Type': 'application/json'
               }
           });
           
           const data = await response.json();
           
           if (typeof showLoading === 'function') {
               showLoading(false);
           }
           
           if (data.success) {
               displayUserData(data.user);
           } else {
               // Token invalid or expired
               localStorage.removeItem('token');
               localStorage.removeItem('user');
               window.location.href = 'login.html';
           }
       } catch (error) {
           if (typeof showLoading === 'function') {
               showLoading(false);
           }
           console.error('Load user error:', error);
           alert('Failed to load dashboard. Please try again.');
       }
   }
   
   // Display user data on dashboard
   function displayUserData(user) {
       console.log('Displaying user data:', user);
       
       // Update user info in header
       const fullNameEl = document.getElementById('userFullName');
       const infoEl = document.getElementById('userInfo');
       
       if (fullNameEl) {
           fullNameEl.textContent = user.fullName;
       }
       
       if (infoEl) {
           infoEl.textContent = `Grade ${user.grade} • ${user.school}`;
       }
       
       // Calculate and display overall score with animation
       const totalBestScore = user.totalBestScore || 0;
       const overallPercentage = Math.round((totalBestScore / 40) * 100);
       
       const totalScoreEl = document.getElementById('totalScore');
       if (totalScoreEl) {
           animateNumber(totalScoreEl, 0, overallPercentage, '%', 1000);
       }
       
       // Update total attempts with animation
       const totalAttemptsEl = document.getElementById('totalAttempts');
       if (totalAttemptsEl) {
           const attempts = user.totalAttempts || 0;
           animateNumber(totalAttemptsEl, 0, attempts, '', 800);
       }
       
       // Update subject scores
       updateSubjectScores(user);
       
       // Update rankings
       updateRankings(user);
   }
   
   // Update subject scores on dashboard
   function updateSubjectScores(user) {
       const subjects = ['math', 'science', 'english', 'arabic'];
       
       subjects.forEach(subject => {
           const score = user.bestScores?.[subject] || 0;
           const attempts = user.subjectAttempts?.[subject] || 0;
           const percentage = (score / 10) * 100;
           
           console.log(`${subject}: score=${score}, attempts=${attempts}, percentage=${percentage}%`);
           
           // Update score display with animation
           const scoreEl = document.getElementById(`${subject}Score`);
           if (scoreEl) {
               const currentScore = parseInt(scoreEl.textContent.split('/')[0]) || 0;
               animateNumber(scoreEl, currentScore, score, '/10', 600);
           }
           
           // Update progress bar with animation
           const progressEl = document.getElementById(`${subject}Progress`);
           if (progressEl) {
               const currentWidth = parseFloat(progressEl.style.width) || 0;
               animateProgress(progressEl, currentWidth, percentage, 800);
           }
           
           // Update attempts with animation
           const attemptsEl = document.getElementById(`${subject}Attempts`);
           if (attemptsEl) {
               const currentAttempts = parseInt(attemptsEl.textContent) || 0;
               animateNumber(attemptsEl, currentAttempts, attempts, '', 600);
           }
       });
   }
   
   // Update rankings
   function updateRankings(user) {
       const overallRankEl = document.getElementById('overallRank');
       const gradeRankEl = document.getElementById('gradeRank');
       const schoolRankEl = document.getElementById('schoolRank');
       
       if (overallRankEl) {
           if (user.overallRank && user.overallRank > 0) {
               overallRankEl.textContent = `#${user.overallRank}`;
           } else {
               overallRankEl.textContent = '--';
           }
       }
       
       if (gradeRankEl) {
           if (user.gradeRank && user.gradeRank > 0) {
               gradeRankEl.textContent = `#${user.gradeRank}`;
           } else {
               gradeRankEl.textContent = '--';
           }
       }
       
       if (schoolRankEl) {
           if (user.schoolRank && user.schoolRank > 0) {
               schoolRankEl.textContent = `#${user.schoolRank}`;
           } else {
               schoolRankEl.textContent = '--';
           }
       }
   }
   
   // Start quiz function
   function startQuiz(subject) {
       console.log('Starting quiz for subject:', subject);
       
       // Save selected subject
       localStorage.setItem('selectedSubject', subject);
       
       // Redirect to quiz page
       window.location.href = `quiz.html?subject=${subject}`;
   }
   
   // Logout function
   async function logout() {
       const confirmMsg = (typeof currentLanguage !== 'undefined' && currentLanguage === 'ar')
           ? 'هل أنت متأكد من تسجيل الخروج؟'
           : 'Are you sure you want to logout?';
       
       if (!confirm(confirmMsg)) return;
       
       const token = localStorage.getItem('token');
       
       try {
           // Call logout endpoint
           await fetch(`${API_URL}/logout`, {
               method: 'POST',
               headers: {
                   'Authorization': `Bearer ${token}`,
                   'Content-Type': 'application/json'
               }
           });
       } catch (error) {
           console.error('Logout error:', error);
       }
       
       // Clear local storage
       localStorage.removeItem('token');
       localStorage.removeItem('user');
       
       // Redirect to login
       window.location.href = 'login.html';
   }
   
   // Animate number counting
   function animateNumber(element, start, end, suffix = '', duration = 1000) {
       if (!element) return;
       
       const startTime = performance.now();
       const difference = end - start;
       
       function update(currentTime) {
           const elapsed = currentTime - startTime;
           const progress = Math.min(elapsed / duration, 1);
           
           // Easing function (ease-out)
           const easeOut = 1 - Math.pow(1 - progress, 3);
           const current = Math.round(start + (difference * easeOut));
           
           element.textContent = `${current}${suffix}`;
           
           if (progress < 1) {
               requestAnimationFrame(update);
           } else {
               element.textContent = `${end}${suffix}`;
           }
       }
       
       requestAnimationFrame(update);
   }
   
   // Animate progress bar
   function animateProgress(element, startWidth, endWidth, duration = 800) {
       if (!element) return;
       
       const startTime = performance.now();
       const difference = endWidth - startWidth;
       
       function update(currentTime) {
           const elapsed = currentTime - startTime;
           const progress = Math.min(elapsed / duration, 1);
           
           // Easing function (ease-out)
           const easeOut = 1 - Math.pow(1 - progress, 3);
           const current = startWidth + (difference * easeOut);
           
           element.style.width = `${current}%`;
           
           if (progress < 1) {
               requestAnimationFrame(update);
           } else {
               element.style.width = `${endWidth}%`;
           }
       }
       
       requestAnimationFrame(update);
   }
   
   // Initialize when page loads
   window.addEventListener('DOMContentLoaded', function() {
       console.log('Dashboard loading...');
       
       loadUserInfo();
       
       // Update language
       const savedLanguage = localStorage.getItem('preferredLanguage');
       if (savedLanguage && savedLanguage === 'ar' && typeof currentLanguage !== 'undefined' && currentLanguage === 'en') {
           if (typeof toggleLanguage === 'function') {
               toggleLanguage();
           }
       }
   });