# Deployment Guide - UAE Schools Competition

This guide will help you deploy your UAE Schools Competition application to a live server.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [Deployment Platforms](#deployment-platforms)

---

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database (local or cloud)
- Git (for version control)
- A hosting provider account (see options below)

---

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend` folder with the following variables:

```env
# Server Configuration
PORT=5000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/uae-schools-competition
# OR for MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

**⚠️ IMPORTANT:** 
- Never commit `.env` files to Git
- Use strong, random strings for `JWT_SECRET` in production
- Keep your MongoDB credentials secure

---

## Database Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Whitelist your IP address (or use `0.0.0.0/0` for all IPs - less secure)
6. Get your connection string and add it to `.env` as `MONGODB_URI`

### Option 2: Local MongoDB

1. Install MongoDB on your server
2. Start MongoDB service
3. Use `mongodb://localhost:27017/uae-schools-competition` as `MONGODB_URI`

---

## Backend Deployment

### Option A: Deploy to Render.com (Recommended)

Render.com offers a free tier with automatic deployments from GitHub.

1. **Sign up at [Render.com](https://render.com)** (free account)

2. **Create a New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your repository: `uae-schools-competition`
   - Click "Connect"

3. **Configure the Service:**
   - **Name**: `uae-schools-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend` ⚠️ **CRITICAL: Set this to `backend`**
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Add Environment Variables:**
   Click "Add Environment Variable" for each:
   - `MONGODB_URI` = Your MongoDB Atlas connection string
   - `JWT_SECRET` = Random secret key (min 32 characters)
   - `JWT_EXPIRE` = `7d`
   - `NODE_ENV` = `production`
   - `PORT` = Leave empty (Render sets this automatically)

5. **Create and Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Wait 2-5 minutes for first deployment
   - Your backend will be live at: `https://your-app-name.onrender.com`

6. **Verify Deployment:**
   - Visit your backend URL
   - You should see: `{"success":true,"message":"UAE Schools Competition API"}`

**Note**: Free tier services may take 30-60 seconds to wake up after inactivity.

📖 **For detailed Render.com instructions, see `RENDER_DEPLOY.md`**

### Option B: Deploy to Heroku

1. **Install Heroku CLI** and login:
   ```bash
   heroku login
   ```

2. **Create a Heroku app:**
   ```bash
   cd backend
   heroku create your-app-name
   ```

3. **Add MongoDB Atlas:**
   - Go to Heroku dashboard → Add-ons → MongoDB Atlas
   - Or manually set `MONGODB_URI` in Heroku config vars

4. **Set environment variables:**
   ```bash
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set JWT_EXPIRE=7d
   heroku config:set MONGODB_URI=your-mongodb-connection-string
   ```

5. **Deploy:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

6. **Your backend will be live at:** `https://your-app-name.herokuapp.com`

### Option B: Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Select the `backend` folder
5. Add environment variables in Railway dashboard
6. Deploy automatically

### Option C: Deploy to VPS (DigitalOcean, AWS EC2, etc.)

1. **SSH into your server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone your repository:**
   ```bash
   git clone https://github.com/your-username/uae-schools-competition.git
   cd uae-schools-competition/backend
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Create .env file:**
   ```bash
   nano .env
   # Add your environment variables
   ```

6. **Install PM2 (Process Manager):**
   ```bash
   sudo npm install -g pm2
   ```

7. **Start the server:**
   ```bash
   pm2 start server.js --name uae-schools-backend
   pm2 save
   pm2 startup
   ```

8. **Set up Nginx reverse proxy** (optional but recommended):
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/default
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

---

## Frontend Deployment

### Step 1: Update API URL (Easy - One File!)

**Before deploying**, update the API URL in your frontend configuration.

The frontend now uses a centralized configuration file. You only need to update **ONE file**:

**File to update:** `frontend/js/config.js`

**Change this line:**
```javascript
window.API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'  // Development
    : 'https://your-backend-url.com';  // Production - UPDATE THIS!
```

**Replace `https://your-backend-url.com` with your actual backend URL.**

All other JavaScript files will automatically use this configuration. The config.js file is already included in all HTML pages.

### Option A: Deploy to Render.com (Recommended)

Deploy your frontend as a Static Site on Render.com:

1. **In Render Dashboard:**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository (if not already connected)
   - Select repository: `uae-schools-competition`

2. **Configure Static Site:**
   - **Name**: `uae-schools-frontend` (or your preferred name)
   - **Branch**: `main`
   - **Root Directory**: `frontend` ⚠️ **CRITICAL: Set this to `frontend`**
   - **Build Command**: Leave empty (no build needed)
   - **Publish Directory**: `.` (current directory)

3. **Create and Deploy:**
   - Click "Create Static Site"
   - Render will deploy automatically
   - Wait 1-2 minutes for deployment
   - Your frontend will be live at: `https://your-frontend-name.onrender.com`

4. **Verify:**
   - Visit your frontend URL
   - Test registration and login
   - Ensure it connects to your backend

**Benefits:**
- ✅ Same platform as backend (easier management)
- ✅ Automatic deployments from GitHub
- ✅ Free tier available
- ✅ HTTPS by default

### Option B: Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy:**
   ```bash
   cd frontend
   netlify deploy
   ```

3. **Or connect via GitHub:**
   - Go to [Netlify](https://www.netlify.com)
   - Connect your repository
   - Set build directory to `frontend`
   - Deploy

### Option B: Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

### Option C: Deploy to GitHub Pages

1. **Update API URLs** (see Step 1 above)

2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Update API URLs for production"
   git push origin main
   ```

3. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Select source branch (usually `main`)
   - Select folder: `/frontend`
   - Save

### Option D: Deploy to VPS with Nginx

1. **Copy frontend files to server:**
   ```bash
   scp -r frontend/* user@your-server:/var/www/html/
   ```

2. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/default
   ```
   
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/html;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
   
   ```bash
   sudo systemctl restart nginx
   ```

---

## Quick Deployment Checklist

- [ ] Set up MongoDB (Atlas or local)
- [ ] Create `.env` file in backend with all required variables
- [ ] Deploy backend to hosting provider
- [ ] Update all API URLs in frontend files
- [ ] Deploy frontend to hosting provider
- [ ] Test registration and login
- [ ] Test quiz functionality
- [ ] Set up SSL certificate (HTTPS) - recommended
- [ ] Configure CORS if needed (backend already has CORS enabled)

---

## CORS Configuration

If you encounter CORS errors, make sure your backend allows requests from your frontend domain. The backend already has CORS enabled, but you may need to restrict it:

In `backend/server.js`, you can update:
```javascript
app.use(cors({
    origin: 'https://your-frontend-domain.com',
    credentials: true
}));
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

1. **Install Certbot:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal:**
   ```bash
   sudo certbot renew --dry-run
   ```

---

## Monitoring & Maintenance

### Check Backend Logs (if using PM2)
```bash
pm2 logs uae-schools-backend
```

### Restart Backend
```bash
pm2 restart uae-schools-backend
```

### Update Application
```bash
git pull
npm install
pm2 restart uae-schools-backend
```

---

## Troubleshooting

### Backend won't start
- Check if MongoDB is running and accessible
- Verify all environment variables are set
- Check server logs for errors

### Frontend can't connect to backend
- Verify API URLs are correct
- Check CORS settings
- Ensure backend is running and accessible

### Database connection errors
- Verify MongoDB connection string
- Check network/firewall settings
- Ensure MongoDB Atlas IP whitelist includes your server IP

---

## Support

For issues or questions, check:
- Server logs
- Browser console for frontend errors
- Network tab in browser DevTools

---

## Recommended Hosting Providers

### Backend:
- **Heroku** - Easy deployment, free tier available
- **Railway** - Simple setup, good free tier
- **DigitalOcean** - VPS, more control
- **AWS EC2** - Scalable, enterprise-grade

### Frontend:
- **Netlify** - Free, automatic deployments
- **Vercel** - Fast, great for static sites
- **GitHub Pages** - Free, simple
- **Cloudflare Pages** - Free, fast CDN

### Database:
- **MongoDB Atlas** - Free tier available, managed
- **Self-hosted MongoDB** - Full control

---

**Good luck with your deployment! 🚀**

