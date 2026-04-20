# ⚠️ Vercel Deployment - IMPORTANT LIMITATIONS

## The Problem: Why Your App Won't Deploy on Vercel

Your project has **PyTorch** as a dependency, which creates a **fundamental incompatibility** with Vercel:

| Factor | Vercel Limit | Your App | Status |
|--------|-------------|----------|--------|
| **Max serverless function size** | 50 MB | ✅ Small | OK |
| **Max all dependencies** | 50 MB | ❌ **5+ GB** | **FAILS** |
| **Python packages** | Basic only | PyTorch (1.8GB) + others | **FAILS** |
| **Build timeout** | 60-120 sec | PyTorch install (5+ min) | **FAILS** |
| **Memory per function** | 3 GB max | ~2.5 GB needed | ✅ Marginal |

**PyTorch alone is 1.8+ GB. Vercel will reject your deployment.**

---

## ✅ RECOMMENDED SOLUTION: Use Render instead (Free tier available)

Your `Dockerfile` and `render.yaml` are already set up for **Render**, which:
- ✅ Supports Python + PyTorch natively
- ✅ Runs applications (not just serverless functions)
- ✅ Free tier with 750 hours/month
- ✅ Handles all your requirements.txt
- ✅ Docker-ready

**See `DEPLOYMENT_GUIDE.md` for Render setup.**

---

## ⚠️ If You MUST Use Vercel (Not Recommended)

### Option 1: Remove PyTorch (Defeats Your Purpose)
Create a Vercel version without AI features - only for frontend + basic backend.

### Option 2: Use Vercel with External AI Service
- Deploy only the FastAPI backend to **Render** (runs the PyTorch model)
- Deploy frontend to **Vercel** (static)
- Frontend calls your Render backend API

**Implementation:**

1. **Edit `static/script.js`** - Change API endpoint:
```javascript
// OLD:
const response = await fetch('/remove-watermark', {...})

// NEW:
const response = await fetch('https://your-render-app.onrender.com/remove-watermark', {...})
```

2. **Update CORS in `app/main.py`**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-vercel-app.vercel.app"],  # Add your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

3. Deploy frontend to Vercel, backend to Render.

---

## ❌ What Was Wrong with Your vercel.json

**Before:**
```json
{
  "buildCommand": "",                    // ❌ Empty - doesn't build anything
  "installCommand": "",                  // ❌ Empty - no dependencies installed
  "outputDirectory": "static",           // ❌ Wrong context
  "cleanUrls": true                      // ❌ Confusing for dynamic app
}
```

**After (Still Won't Work Due to PyTorch):**
```json
{
  "buildCommand": "pip install -r requirements.txt",
  "python": { "version": "3.10" },
  "builds": [
    { "src": "app/main.py", "use": "@vercel/python" },
    { "src": "static/**", "use": "@vercel/static" }
  ],
  "routes": [...]
}
```

The config is now correct, but **will still fail** when pip tries to install PyTorch (50MB limit).

---

## Quick Commands for Deployment

### 🎯 Recommended: Deploy to Render (Default Choice)
```bash
git push origin main
# Render auto-deploys from GitHub
```

### Alternative: Deploy Frontend Only to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# If deploying only static files:
vercel --prod
```

---

## Summary

| Platform | Frontend | Backend (PyTorch) | Recommendation |
|----------|----------|------------------|-----------------|
| **Vercel** | ✅ | ❌ | Use for frontend only |
| **Render** | ✅ | ✅ | **USE THIS** |
| **Railway** | ✅ | ✅ | Alternative |
| **Heroku** | ✅ | ⚠️ | Paid tier needed |

**Move to Render for full-stack deployment with PyTorch support.**
