# Localhost Development Setup

## Quick Start for Local Testing

### Step 1: Start Backend Server

Open a terminal and run:

```bash
cd backend
npm install  # Only needed first time
npm start
```

You should see:
```
✅ MongoDB Connected Successfully
🚀 Server running on http://localhost:5000
```

**Keep this terminal open!**

### Step 2: Start Frontend Server

Open a **NEW** terminal window and run:

**Option A: Using Python (Recommended)**
```bash
cd frontend
python -m http.server 8000
```

**Option B: Using Node.js**
```bash
cd frontend
npx http-server -p 8000
```

**Option C: Using VS Code Live Server**
1. Install "Live Server" extension in VS Code
2. Right-click on `frontend/index.html`
3. Click "Open with Live Server"

### Step 3: Open in Browser

Go to: **http://localhost:8000/register.html**

**IMPORTANT:** 
- ✅ Use `http://localhost:8000` (web server)
- ❌ Don't open files directly (file:// protocol)

---

## Troubleshooting CORS Errors

### Error: "origin 'null'"

**Cause:** Opening HTML file directly (double-clicking)

**Solution:** Use a web server (see Step 2 above)

### Error: "Failed to fetch" or "Network error"

**Possible causes:**
1. Backend not running
2. Backend on wrong port
3. MongoDB not connected

**Check:**
```bash
# In backend terminal, you should see:
✅ MongoDB Connected Successfully
🚀 Server running on http://localhost:5000
```

### Error: "CORS policy" error

**Solution:** 
1. Make sure backend is running
2. Check backend terminal for errors
3. Restart backend: `Ctrl+C` then `npm start`

---

## Testing the Connection

### Test 1: Check Backend is Running

Open browser and go to: **http://localhost:5000**

You should see:
```json
{
  "success": true,
  "message": "UAE Schools Competition API",
  "version": "1.0.0"
}
```

### Test 2: Check Frontend Config

1. Open browser console (F12)
2. Go to Console tab
3. You should see:
```
🌐 API Configuration:
  Hostname: localhost
  Protocol: http:
  Is Localhost: true
  API URL: http://localhost:5000
```

### Test 3: Try Registration

1. Go to: http://localhost:8000/register.html
2. Fill in the form
3. Select a school from dropdown
4. Submit
5. Check browser console for any errors

---

## Common Issues

### Backend won't start

**Error: "Port 5000 already in use"**
```bash
# Find what's using port 5000
# Windows:
netstat -ano | findstr :5000

# Kill the process or change port in backend/.env
PORT=5001
```

**Error: "MongoDB connection failed"**
- Check your `.env` file in `backend/` folder
- Make sure `MONGODB_URI` is correct
- For local MongoDB: `mongodb://localhost:27017/uae-schools-competition`

### Frontend shows blank page

- Check browser console (F12) for errors
- Make sure all files are in correct folders
- Verify you're using `http://localhost:8000` not `file://`

### Can't find school in dropdown

- Make sure `js/schools.js` is loaded
- Check browser console for errors
- Try typing school name to search

---

## Development Workflow

1. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   python -m http.server 8000
   ```

3. **Open Browser**
   - Go to: http://localhost:8000
   - Open DevTools (F12) to see console logs

4. **Make Changes**
   - Edit frontend files → Refresh browser
   - Edit backend files → Restart backend (Ctrl+C, then npm start)

---

## Ports Used

- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:8000 (or any available port)

You can change these ports if needed:
- Backend: Edit `backend/.env` → `PORT=5001`
- Frontend: Use different port → `python -m http.server 3000`

---

## Quick Commands Reference

```bash
# Start Backend
cd backend && npm start

# Start Frontend (Python)
cd frontend && python -m http.server 8000

# Start Frontend (Node)
cd frontend && npx http-server -p 8000

# Check if backend is running
curl http://localhost:5000

# Check MongoDB connection
# Look for "✅ MongoDB Connected Successfully" in backend terminal
```

---

## Still Having Issues?

1. **Check browser console** (F12 → Console tab)
2. **Check backend terminal** for errors
3. **Verify both servers are running** (backend on 5000, frontend on 8000)
4. **Test backend directly**: http://localhost:5000
5. **Clear browser cache** (Ctrl+Shift+Delete)

---

**Happy Coding! 🚀**

