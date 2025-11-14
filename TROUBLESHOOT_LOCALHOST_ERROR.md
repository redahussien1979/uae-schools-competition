# 🔧 Troubleshooting "localhost:5000" Errors

If you're still seeing `POST http://localhost:5000/login net::ERR_CONNECTION_REFUSED`, follow these steps:

## ✅ Quick Fixes

### 1. Clear Browser Cache (Most Common Fix)

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the page with `Ctrl + Shift + R` (hard refresh)

**Or use Hard Refresh:**
- Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

### 2. Check You're on the Deployed Site

Make sure you're visiting:
- ✅ **Production**: https://uae-schools-frontend.onrender.com/
- ❌ **NOT Local**: http://localhost:8000/ (this will use localhost:5000)

### 3. Check Browser Console

1. Open browser console (F12)
2. Look for this message:
   ```
   🌐 API Configuration:
     Hostname: uae-schools-frontend.onrender.com
     API URL: https://uae-schools-backend.onrender.com
   ```

**If you see `localhost:5000` in the API URL:**
- The deployment might not be complete yet
- Or browser is using cached files

### 4. Verify Deployment Status

1. Go to https://dashboard.render.com
2. Click on "uae-schools-frontend"
3. Check "Events" tab
4. Make sure latest deployment shows "Live" (green)

### 5. Wait for Deployment

If you just pushed changes:
- Wait 2-5 minutes for Render to redeploy
- Check Render dashboard for deployment status
- Once "Live", clear cache and refresh

---

## 🔍 Debug Steps

### Step 1: Check What API URL is Being Used

Open browser console (F12) and type:
```javascript
console.log('API URL:', window.API_URL);
```

**Expected on production:**
```
API URL: https://uae-schools-backend.onrender.com
```

**If it shows `localhost:5000`:**
- Browser is using cached files
- Or config.js isn't loading

### Step 2: Check if config.js is Loading

In browser console, check:
```javascript
// Should show the config object
console.log('Config loaded:', typeof window.API_URL !== 'undefined');
```

### Step 3: Check Network Tab

1. Open browser DevTools (F12)
2. Go to "Network" tab
3. Refresh the page
4. Look for `config.js` - should load successfully
5. Check the response - should contain your backend URL

---

## 🚨 Common Causes

### Cause 1: Browser Cache
**Solution:** Clear cache and hard refresh

### Cause 2: Testing Locally
**Problem:** Opening `http://localhost:8000/` will use `localhost:5000` for API
**Solution:** Test on deployed site: https://uae-schools-frontend.onrender.com/

### Cause 3: Deployment Not Complete
**Problem:** Changes just pushed, Render still deploying
**Solution:** Wait 2-5 minutes, check Render dashboard

### Cause 4: Old JavaScript Files Cached
**Problem:** Browser cached old `main.js` with hardcoded localhost
**Solution:** Clear cache or use incognito/private window

---

## ✅ Verification Checklist

After clearing cache, verify:

- [ ] Visiting: https://uae-schools-frontend.onrender.com/
- [ ] Browser console shows: `API URL: https://uae-schools-backend.onrender.com`
- [ ] No `localhost:5000` in console logs
- [ ] Network tab shows requests to `uae-schools-backend.onrender.com`
- [ ] Login/Registration works

---

## 🎯 Quick Test

1. **Open in Incognito/Private Window:**
   - This bypasses cache
   - Chrome: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
   - Edge: `Ctrl + Shift + N`

2. **Visit:** https://uae-schools-frontend.onrender.com/

3. **Open Console (F12)** and check:
   - Should see: `API URL: https://uae-schools-backend.onrender.com`
   - Should NOT see: `localhost:5000`

4. **Try to login** - should work now!

---

## 📝 If Still Not Working

1. **Check Render Deployment:**
   - Go to Render dashboard
   - Verify frontend is "Live"
   - Check for any deployment errors

2. **Verify Files:**
   - Check that `config.js` exists in deployed site
   - Visit: https://uae-schools-frontend.onrender.com/js/config.js
   - Should see your backend URL in the file

3. **Check Backend:**
   - Visit: https://uae-schools-backend.onrender.com/
   - Should see API message
   - If not, backend might be down

---

**Most likely fix: Clear browser cache and hard refresh!** 🎯

