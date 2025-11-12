# Deploy to Render.com - Step by Step Guide

This guide will walk you through deploying your UAE Schools Competition app on Render.com.

## 🎯 Overview

Render.com is a modern cloud platform that offers:
- ✅ Free tier for both backend and frontend
- ✅ Automatic deployments from GitHub
- ✅ Easy environment variable management
- ✅ HTTPS by default
- ✅ No credit card required for free tier

---

## 📋 Prerequisites

1. **GitHub Account** - Your code should be on GitHub
2. **MongoDB Atlas Account** - Free tier available
3. **Render.com Account** - Sign up at https://render.com (free)

---

## Step 1: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (choose the free M0 tier)
4. Wait for cluster to be created (2-3 minutes)
5. Click "Connect" → "Connect your application"
6. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/...`)
7. **Important**: Replace `<password>` with your actual database password
8. Click "Network Access" → "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)

**Save your connection string** - you'll need it in Step 3!

---

## Step 2: Prepare Your Code for GitHub

If your code isn't on GitHub yet:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/your-username/uae-schools-competition.git
git branch -M main
git push -u origin main
```

**Important**: Make sure you have a `.gitignore` file that excludes:
- `node_modules/`
- `.env` files
- Any sensitive data

---

## Step 3: Deploy Backend on Render

### 3.1 Create a New Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account (if not already connected)
4. Select your repository: `uae-schools-competition`
5. Click **"Connect"**

### 3.2 Configure Backend Service

Fill in the following settings:

**Basic Settings:**
- **Name**: `uae-schools-backend` (or any name you prefer)
- **Region**: Choose closest to your users (e.g., `Singapore` for UAE)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend` ⚠️ **IMPORTANT: Set this to `backend`**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment Variables:**
Click "Add Environment Variable" and add these:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A random secret key (min 32 characters). Generate one at https://randomkeygen.com |
| `JWT_EXPIRE` | `7d` |
| `NODE_ENV` | `production` |
| `PORT` | Leave empty (Render sets this automatically) |

**Example JWT_SECRET**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### 3.3 Create the Service

1. Scroll down and click **"Create Web Service"**
2. Render will start building and deploying your backend
3. Wait for deployment to complete (2-5 minutes)
4. Once deployed, you'll see: **"Your service is live at https://your-app-name.onrender.com"**

**Save this URL** - you'll need it for the frontend!

### 3.4 Verify Backend is Working

1. Visit your backend URL: `https://your-app-name.onrender.com`
2. You should see: `{"success":true,"message":"UAE Schools Competition API","version":"1.0.0"}`
3. If you see this, your backend is working! ✅

---

## Step 4: Update Frontend Configuration

Before deploying the frontend, update the API URL:

1. Open `frontend/js/config.js`
2. Update the production URL:

```javascript
window.API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'  // Development
    : 'https://your-app-name.onrender.com';  // ← CHANGE THIS to your Render backend URL!
```

3. Commit and push to GitHub:
```bash
git add frontend/js/config.js
git commit -m "Update API URL for production"
git push origin main
```

---

## Step 5: Deploy Frontend on Render

### 5.1 Create a Static Site

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. Select your repository: `uae-schools-competition`
3. Click **"Connect"**

### 5.2 Configure Frontend

Fill in the settings:

**Basic Settings:**
- **Name**: `uae-schools-frontend` (or any name)
- **Branch**: `main`
- **Root Directory**: `frontend` ⚠️ **IMPORTANT: Set this to `frontend`**
- **Build Command**: Leave empty (no build needed for static site)
- **Publish Directory**: `.` (current directory)

**Environment Variables:**
- No environment variables needed for static site

### 5.3 Create the Site

1. Click **"Create Static Site"**
2. Render will deploy your frontend
3. Wait for deployment (1-2 minutes)
4. Your frontend will be live at: `https://your-frontend-name.onrender.com`

---

## Step 6: Test Your Deployment

1. ✅ Visit your frontend URL
2. ✅ Try registering a new account
3. ✅ Login with your account
4. ✅ Take a quiz
5. ✅ Check the leaderboard
6. ✅ Test admin features (create admin via `/admin/setup`)

---

## 🔧 Troubleshooting

### Backend Issues

**"Application Error" or 503:**
- Check Render logs: Click on your service → "Logs" tab
- Common issues:
  - MongoDB connection string incorrect
  - Missing environment variables
  - Build errors

**MongoDB Connection Errors:**
- Verify connection string is correct
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Ensure database user password is correct

**Build Fails:**
- Check that `Root Directory` is set to `backend`
- Verify `package.json` exists in backend folder
- Check build logs for specific errors

### Frontend Issues

**"Cannot connect to backend":**
- Verify `frontend/js/config.js` has correct backend URL
- Check backend is running and accessible
- Open browser console (F12) to see specific errors

**404 Errors:**
- Ensure `Root Directory` is set to `frontend`
- Check that `index.html` exists in frontend folder

**CORS Errors:**
- Backend already has CORS enabled
- If issues persist, check backend allows your frontend domain

---

## 📊 Monitoring Your App

### View Logs

1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. View real-time logs and errors

### Check Service Status

- Green dot = Running
- Yellow dot = Building/Deploying
- Red dot = Error (check logs)

---

## 🔄 Updating Your App

### Automatic Deployments

Render automatically deploys when you push to your GitHub repository!

1. Make changes to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. Render will automatically detect changes and redeploy
4. Wait 2-5 minutes for deployment to complete

### Manual Deploy

1. Go to your service in Render dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 💰 Free Tier Limits

Render.com free tier includes:
- ✅ 750 hours/month (enough for 24/7 operation)
- ✅ 512 MB RAM
- ✅ Automatic SSL (HTTPS)
- ⚠️ Services spin down after 15 minutes of inactivity (first request may be slow)

**Note**: Free tier services may take 30-60 seconds to wake up if inactive.

---

## 🎉 You're Done!

Your app is now live on Render.com! 

**Backend URL**: `https://your-backend-name.onrender.com`  
**Frontend URL**: `https://your-frontend-name.onrender.com`

---

## 📝 Quick Reference

**Backend Environment Variables:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-key-min-32-characters
JWT_EXPIRE=7d
NODE_ENV=production
```

**Frontend Config:**
- File: `frontend/js/config.js`
- Update: `window.API_URL` to your backend URL

---

## 🆘 Need Help?

1. Check Render logs for errors
2. Verify all environment variables are set
3. Test backend URL directly in browser
4. Check browser console (F12) for frontend errors
5. Review MongoDB Atlas connection settings

**Happy Deploying! 🚀**

