# ✅ Complete Deployment Fix Guide

## 📋 Files Fixed

| File | Issue | Fix |
|------|-------|-----|
| `vercel.json` | ❌ Empty build commands | ✅ Proper Python builds configured |
| `.vercelignore` | ❌ Ignored all Python | ✅ Include app code, exclude large models |
| `requirements.txt` | ⚠️ Unversioned deps | ✅ Pinned versions with comments |
| `package.json` | ❌ No start/build scripts | ✅ Added proper npm scripts |
| `app/main.py` | ⚠️ No port from env | ✅ Dynamic port + production mode |
| `start.sh` | ❌ Missing | ✅ Created startup script |
| `Procfile` | ❌ Missing | ✅ Created for Render/Heroku |

---

## 🎯 CHOOSE YOUR DEPLOYMENT PATH

### **OPTION A: Use Render (Recommended) ⭐**

**Why Render?**
- ✅ Supports PyTorch natively
- ✅ Free tier: 750 hours/month
- ✅ Handles large dependencies
- ✅ Auto-deploys from GitHub
- ✅ Already configured in `render.yaml`

**Steps:**
1. Push code to GitHub
2. Go to https://render.com
3. Click "New +" → "Web Service"
4. Connect GitHub repository
5. Build command: Already in `render.yaml`
6. Start command: Already in `render.yaml`
7. Deploy!

**What happens:**
```
1. Render checks render.yaml
2. Installs: pip install -r requirements.txt (2-3 min)
3. Starts: python3 -m uvicorn app.main:app
4. Your app runs at https://your-app.onrender.com
```

### **OPTION B: Split Deployment (Vercel + Render)**

**Deploy Frontend to Vercel, Backend to Render:**

**Step 1: Deploy Backend to Render** (Same as Option A)

**Step 2: Get Render Backend URL**
- After deployment, you'll see: `https://your-api.onrender.com`

**Step 3: Update Frontend (static/script.js)**
```javascript
// Find this line:
const response = await fetch('/remove-watermark', {

// Change to:
const response = await fetch('https://your-api.onrender.com/remove-watermark', {

// Also update the health check:
fetch('/health', ...)
// Change to:
fetch('https://your-api.onrender.com/health', ...)
```

**Step 4: Update CORS (app/main.py)**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-vercel-domain.vercel.app",
        "http://localhost:3000"  # development
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Step 5: Deploy Frontend to Vercel**
```bash
npm install -g vercel
vercel --prod
```

### **OPTION C: Railway (Alternative)**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Connect & deploy
railway link
railway deploy
```

**No configuration needed** - Railway auto-detects Python + requirements.txt

---

## ❌ Why Vercel Alone Doesn't Work

**PyTorch Bloat:**
```
Vercel Function Limit:        50 MB
Your dependencies:           2+ GB
  ├─ torch:        1.8 GB
  ├─ torchvision:  800 MB
  ├─ opencv:       200 MB
  └─ others:       200 MB

Result: ❌ DEPLOYMENT FAILS
```

**Build Timeout:**
```
Vercel Timeout:              120 seconds
PyTorch Installation:     5-10 minutes

Result: ❌ TIMEOUT ERROR
```

---

## 🔧 Local Testing

Before deploying, test locally:

```bash
# Activate venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the app
python app/main.py

# OR using the script
bash start.sh

# Visit http://localhost:8000
```

Open browser: `http://localhost:8000`

---

## 📝 Environment Variables (Optional)

Create `.env.production` for Render:

```env
PORT=8000
ENVIRONMENT=production
PYTHONUNBUFFERED=1
PYTORCH_ENABLE_MPS_FALLBACK=1
OMP_NUM_THREADS=1
TORCH_NUM_THREADS=1
```

In Render dashboard:
- Settings → Environment Variables
- Add each variable

---

## 🚨 Common Errors & Fixes

### Error: "Build timeout after 120 seconds"
**Cause:** Vercel trying to install PyTorch
**Fix:** Use Render instead (see Option A)

### Error: "Function size limit exceeded (50MB)"
**Cause:** PyTorch won't fit
**Fix:** Use Render (no size limit) or split frontend/backend

### Error: "Module not found: torch"
**Cause:** Environment not using Python 3.10
**Fix:** Verify runtime.txt exists with `python-3.10.15`

### Error: CORS blocked request
**Cause:** Frontend and backend on different domains
**Fix:** Update `allow_origins` in `app/main.py` OR use same origin

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] App loads at main URL
- [ ] Health check responds: `GET /health`
- [ ] Upload form appears
- [ ] Can select image file
- [ ] Processing works
- [ ] Download result works
- [ ] No console errors

**Test endpoints:**
```bash
# Check if running
curl https://your-app.onrender.com/health

# Check API status
curl https://your-app.onrender.com/api/status
```

---

## 📞 Support & Resources

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **FastAPI Docs:** https://fastapi.tiangolo.com/deployment/
- **PyTorch:** https://pytorch.org/

---

## 🎓 Summary

| Need | Solution |
|------|----------|
| Full app (Frontend + AI) | **Use Render** |
| Fast frontend only | Use Vercel (remove backend) |
| Frontend + External AI | Vercel + Render |
| Maximum speed | Railway |
| Future scaling | AWS/GCP |

**Recommendation: Start with Render for simplicity.**
