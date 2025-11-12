# Quick Deployment Checklist

Follow these steps to deploy your UAE Schools Competition app:

## Step 1: Set Up MongoDB

**Option A: MongoDB Atlas (Recommended - Free)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a cluster (free tier)
4. Create database user
5. Whitelist IP: `0.0.0.0/0` (or your server IP)
6. Copy connection string

**Option B: Local MongoDB**
- Install MongoDB on your server
- Use: `mongodb://localhost:27017/uae-schools-competition`

---

## Step 2: Deploy Backend

### For Render.com (Recommended - Free & Easy):

1. **Go to https://render.com and sign up**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure:**
   - Name: `uae-schools-backend`
   - Root Directory: `backend` ⚠️ **IMPORTANT**
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Add Environment Variables:**
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = random secret key (32+ chars)
   - `JWT_EXPIRE` = `7d`
   - `NODE_ENV` = `production`
6. **Click "Create Web Service"**
7. **Wait for deployment** (2-5 minutes)

Your backend URL: `https://your-app-name.onrender.com`

📖 **See `RENDER_DEPLOY.md` for detailed Render.com instructions!**

### For Heroku:

```bash
cd backend
heroku login
heroku create your-app-name
heroku config:set MONGODB_URI="your-mongodb-connection-string"
heroku config:set JWT_SECRET="your-random-secret-key-min-32-chars"
heroku config:set JWT_EXPIRE="7d"
git init
git add .
git commit -m "Deploy backend"
git push heroku main
```

Your backend URL: `https://your-app-name.herokuapp.com`

### For Railway:

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select `backend` folder
4. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRE=7d`
   - `PORT` (auto-set)

---

## Step 3: Update Frontend API URL

**IMPORTANT:** Update `frontend/js/config.js`:

```javascript
window.API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'  // Development
    : 'https://your-backend-url.herokuapp.com';  // ← CHANGE THIS!
```

Replace `https://your-backend-url.herokuapp.com` with your actual backend URL.

---

## Step 4: Deploy Frontend

### Option A: Render.com (Recommended - Same Platform)

1. **In Render dashboard, click "New +" → "Static Site"**
2. **Connect your GitHub repository**
3. **Configure:**
   - Name: `uae-schools-frontend`
   - Root Directory: `frontend` ⚠️ **IMPORTANT**
   - Build Command: (leave empty)
   - Publish Directory: `.`
4. **Click "Create Static Site"**
5. **Wait for deployment** (1-2 minutes)

Your frontend URL: `https://your-frontend-name.onrender.com`

### Option B: Netlify

1. Go to https://www.netlify.com
2. Sign up/login
3. "Add new site" → "Deploy manually"
4. Drag and drop the `frontend` folder
5. Done! Your site is live.

### Option C: Vercel

```bash
cd frontend
npm install -g vercel
vercel
```

### Option D: GitHub Pages

1. Push code to GitHub
2. Go to Settings → Pages
3. Select source: `main` branch
4. Select folder: `/frontend`
5. Save

---

## Step 5: Test Everything

1. ✅ Visit your frontend URL
2. ✅ Register a new account
3. ✅ Login
4. ✅ Take a quiz
5. ✅ Check leaderboard
6. ✅ Test admin login (create admin first via `/admin/setup`)

---

## Environment Variables Summary

**Backend needs:**
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Random secret key (min 32 characters)
- `JWT_EXPIRE` - Token expiration (e.g., "7d")
- `PORT` - Server port (usually auto-set by hosting)

**Frontend needs:**
- Update `frontend/js/config.js` with your backend URL

---

## Common Issues

**CORS Errors:**
- Backend already has CORS enabled
- If issues persist, check backend allows your frontend domain

**Connection Errors:**
- Verify backend URL in `config.js` is correct
- Check backend is running
- Ensure MongoDB connection string is correct

**Database Errors:**
- Verify MongoDB connection string
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

---

## Need Help?

Check the full `DEPLOYMENT.md` guide for detailed instructions.


