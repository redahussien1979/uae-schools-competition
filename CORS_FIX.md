# Fixing CORS Errors

## The Problem

You're seeing this error:
```
Access to fetch at 'https://your-backend-url.com/register' from origin 'null' has been blocked by CORS policy
```

## Common Causes

### 1. **Opening HTML file directly (file:// protocol)**
If you're opening `register.html` directly in the browser (double-clicking the file), the origin will be `null`.

**Solution:** Use a local web server instead.

### 2. **Config.js has placeholder URL**
The `frontend/js/config.js` still has `https://your-backend-url.com` instead of your actual backend URL.

**Solution:** Update the config file with your real backend URL.

---

## Solutions

### Solution 1: Update Config.js (IMPORTANT!)

Edit `frontend/js/config.js` and replace the placeholder:

```javascript
window.API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'  // Development
    : 'https://your-actual-backend-url.onrender.com';  // ← CHANGE THIS!
```

**Replace `https://your-actual-backend-url.onrender.com` with your actual Render.com backend URL!**

### Solution 2: Use a Local Web Server (For Testing)

**Option A: Using Python (if installed)**
```bash
cd frontend
python -m http.server 8000
```
Then open: `http://localhost:8000`

**Option B: Using Node.js (if installed)**
```bash
# Install http-server globally
npm install -g http-server

# Run it
cd frontend
http-server -p 8000
```
Then open: `http://localhost:8000`

**Option C: Using VS Code Live Server Extension**
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html` → "Open with Live Server"

### Solution 3: Backend CORS Configuration

The backend has been updated to allow all origins. Make sure:
1. Your backend is running
2. You've restarted the backend after the CORS changes
3. The backend URL in config.js matches your actual backend

---

## Quick Checklist

- [ ] Updated `frontend/js/config.js` with your actual backend URL
- [ ] Backend is running and accessible
- [ ] Using a web server (not opening files directly)
- [ ] Backend CORS is configured (already done in server.js)

---

## Testing Locally

1. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```
   Backend runs on: `http://localhost:5000`

2. **Start Frontend Server:**
   ```bash
   cd frontend
   python -m http.server 8000
   ```
   Frontend runs on: `http://localhost:8000`

3. **Open Browser:**
   Go to: `http://localhost:8000/register.html`

4. **Test Registration:**
   - Fill in the form
   - Select a school from dropdown
   - Submit

---

## For Production (Render.com)

1. **Backend is deployed** on Render.com
2. **Update `frontend/js/config.js`:**
   ```javascript
   window.API_URL = 'https://your-backend-name.onrender.com';
   ```
3. **Deploy frontend** to Render.com (Static Site)
4. **Test** - CORS should work automatically

---

## Still Having Issues?

1. **Check browser console** (F12) for exact error
2. **Verify backend URL** is correct in config.js
3. **Test backend directly** - visit `https://your-backend-url.com` in browser
4. **Check backend logs** on Render.com dashboard
5. **Verify CORS headers** - backend should send `Access-Control-Allow-Origin: *`

---

## Common Mistakes

❌ Opening HTML files directly (file://)  
✅ Use a web server

❌ Wrong backend URL in config.js  
✅ Use exact URL from Render.com

❌ Backend not running  
✅ Check backend is deployed and running

❌ Typo in backend URL  
✅ Double-check the URL matches exactly

