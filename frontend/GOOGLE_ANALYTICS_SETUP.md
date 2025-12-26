# Google Analytics Setup Guide

## Step 1: Create Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Start measuring"
4. Enter your account details:
   - Account Name: `UAE Schools Competition`
   - Choose data sharing settings as needed

## Step 2: Set Up Property

1. Property Name: `UAE Schools Competition`
2. Reporting Time Zone: `(GMT+04:00) Gulf Standard Time - Dubai`
3. Currency: `AED - United Arab Emirates Dirham`

## Step 3: Set Up Data Stream

1. Choose platform: **Web**
2. Website URL: `https://www.uaeschoolcup.com`
3. Stream name: `UAE Schools Competition Website`
4. Enable Enhanced Measurement (recommended)

## Step 4: Get Your Measurement ID

After creating the data stream, you'll receive a **Measurement ID** that looks like: `G-XXXXXXXXXX`

## Step 5: Add Tracking Code to Website

### Option A: Add to All Pages (Recommended)

Add this code to the `<head>` section of **EVERY** HTML page, right after the opening `<head>` tag:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    'language': document.documentElement.lang,
    'page_title': document.title
  });
</script>
```

**Replace `G-XXXXXXXXXX` with your actual Measurement ID**

### Option B: Create Shared Analytics File

1. Create a file: `frontend/js/analytics.js`

```javascript
// Google Analytics Configuration
// Replace 'G-XXXXXXXXXX' with your actual Measurement ID

(function() {
    // Only load analytics in production (not localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Analytics disabled on localhost');
        return;
    }

    // Load Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    // Configure GA4
    gtag('config', 'G-XXXXXXXXXX', {
        'language': document.documentElement.lang,
        'page_title': document.title,
        'send_page_view': true
    });

    // Track language changes
    window.trackLanguageChange = function(newLang) {
        gtag('event', 'language_change', {
            'new_language': newLang
        });
    };

    // Track quiz starts
    window.trackQuizStart = function(subject) {
        gtag('event', 'quiz_start', {
            'subject': subject
        });
    };

    // Track quiz completions
    window.trackQuizComplete = function(subject, score) {
        gtag('event', 'quiz_complete', {
            'subject': subject,
            'score': score
        });
    };

    // Track registrations
    window.trackRegistration = function() {
        gtag('event', 'sign_up', {
            'method': 'email'
        });
    };

    // Track logins
    window.trackLogin = function() {
        gtag('event', 'login', {
            'method': 'email'
        });
    };
})();
```

2. Add this line to the `<head>` of all pages:
```html
<script defer src="js/analytics.js"></script>
```

## Step 6: Custom Events to Track

Add these event tracking calls to your existing JavaScript:

### In `js/main.js` - Track Language Toggle
```javascript
function toggleLanguage() {
    // ... existing code ...
    if (window.trackLanguageChange) {
        trackLanguageChange(currentLang === 'en' ? 'ar' : 'en');
    }
}
```

### In `js/quiz.js` - Track Quiz Events
```javascript
function startQuiz(subject) {
    // ... existing code ...
    if (window.trackQuizStart) {
        trackQuizStart(subject);
    }
}

function submitQuiz() {
    // ... existing code ...
    if (window.trackQuizComplete) {
        trackQuizComplete(currentSubject, score);
    }
}
```

### In `register.html` - Track Registrations
```javascript
function handleRegister(event) {
    // ... existing code ...
    if (window.trackRegistration) {
        trackRegistration();
    }
}
```

### In `login.html` - Track Logins
```javascript
function handleLogin(event) {
    // ... existing code ...
    if (window.trackLogin) {
        trackLogin();
    }
}
```

## Step 7: Verify Installation

1. Go to Google Analytics dashboard
2. Navigate to **Reports** → **Realtime**
3. Open your website in a new tab
4. You should see yourself in the realtime report

## Important Metrics to Monitor

### User Engagement
- Active users (daily, weekly, monthly)
- Average engagement time
- Pages per session

### Conversion Events
- Sign ups (registrations)
- Quiz completions
- Leaderboard views

### Traffic Sources
- Where users are coming from
- Which marketing channels work best
- Geographic distribution (which Emirates)

### Popular Content
- Most visited pages
- Most popular subjects (Math, Science, English, Arabic)
- Peak usage times

## Privacy Compliance

Since you're targeting UAE users, consider:

1. **Add Privacy Policy** - Mention Google Analytics usage
2. **Cookie Consent** (optional but recommended)
3. **IP Anonymization** - Already enabled by default in GA4

## Tips for Better Insights

1. **Set up Goals** in GA4:
   - Registration as a conversion
   - Quiz completion as a conversion
   - Time on site benchmarks

2. **Create Custom Reports** for:
   - Subject popularity (Math vs Science vs English vs Arabic)
   - School performance comparison
   - Student engagement patterns

3. **Link to Google Search Console** for SEO insights

## Need Help?

- [Google Analytics Help Center](https://support.google.com/analytics)
- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)

---

**Note:** Remember to replace `G-XXXXXXXXXX` with your actual Measurement ID in all code snippets!
