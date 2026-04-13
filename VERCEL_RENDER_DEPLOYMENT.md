# JustRemove - Deployment Guide

Deploy your watermark remover to Vercel (UI) + Render (Backend) in 15 minutes.

## Prerequisites

1. **GitHub Repository** - Push all code to GitHub
2. **Render Account** - Sign up at https://render.com
3. **Vercel Account** - Sign up at https://vercel.com
4. **.tech Domain** - Register at any domain provider (Namecheap, Google Domains, etc.)

---

## Step 1: Deploy Backend to Render (10 min)

### 1.1 Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Fill in details:
   - **Name**: `watermark-api`
   - **Environment**: Python 3
   - **Region**: Choose closest to users
   - **Build Command**: (leave empty - Render auto-detects)
   - **Start Command**: (leave empty - Render uses Procfile)
   - **Plan**: Free tier

### 1.2 Set Environment Variables

In Render dashboard for your service, add:
- No special vars needed (all dependencies in requirements.txt)

### 1.3 Deploy

Click **"Create Web Service"** - Render will auto-deploy from `Procfile`

**⏳ Wait 3-5 minutes** for build to complete.

**Once deployed, you'll get a URL like:**
```
https://watermark-api.onrender.com
```
✅ **Copy this URL** - you need it for the next step.

### 1.4 Test Backend

Open in browser:
```
https://watermark-api.onrender.com/health
```

Should see: `{"status":"ready"}`

⚠️ **Cold start warning**: First request will take 30-60 seconds (model loading). Subsequent requests within 30 min are faster.

---

## Step 2: Deploy Frontend to Vercel (5 min)

### 2.1 Update Backend URL

Edit `config.js` in your repo:

```javascript
// Change this line to your Render URL:
return 'https://watermark-api.onrender.com'; // ← YOUR URL HERE
```

### 2.2 Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repo
4. Settings:
   - **Framework Preset**: Other (or leave blank)
   - **Build Command**: (leave blank)
   - **Output Directory**: `.`
   - **Root Directory**: `.`
5. Click **"Deploy"**

**⏳ Wait 1-2 minutes** for deployment.

✅ You'll get a URL like: `https://watermark-justremove.vercel.app`

---

## Step 3: Connect .tech Domain (5 min)

### 3.1 Point Domain to Vercel

1. In **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Add your domain (e.g., `watermark.tech`)
3. Vercel shows 4 nameservers, e.g.:
   - `ns1.vercel.com`
   - `ns2.vercel.com`
   - `ns3.vercel.com`
   - `ns4.vercel.com`

### 3.2 Update Registrar

1. Go to your domain registrar (Namecheap, Google Domains, etc.)
2. Find DNS/Nameservers settings
3. Replace current nameservers with Vercel's 4 nameservers
4. Save

⏳ **Wait 24-48 hours** for DNS propagation (usually 15 minutes though).

### 3.3 Verify

Once DNS propagates, visit:
```
https://watermark.tech
```

---

## Step 4: Test the Full App

1. Open https://watermark.tech
2. Upload an image
3. Draw mask around watermark
4. Click "Remove"

**First request timing:**
- Backend spin-up: 30-60 seconds
- Model load: included in above
- Processing: 5-15 seconds
- **Total first request: 1-2 minutes**

Subsequent requests: 5-15 seconds (no model reload)

---

## Troubleshooting

### "Cannot reach backend" error
- ✅ Check Render service status in dashboard
- ✅ Verify `config.js` has correct URL
- ✅ Check CORS is enabled (it is in `app/main.py`)
- ✅ Test `/health` endpoint directly

### Very slow processing
- ✅ First request always slow (model loads)
- ✅ Render free tier has CPU throttling
- ✅ Consider upgrading to Render paid plan (~$7/mo) for better performance

### Domain not working
- ✅ DNS changes take 24-48 hours
- ✅ Clear browser cache: Ctrl+Shift+Delete (or Cmd+Shift+Delete)
- ✅ Try different browser/device
- ✅ Verify nameservers actually changed at registrar

### 502 Bad Gateway
- ✅ Render service might be restarting - try again in 2 min
- ✅ Check Render logs for errors
- ✅ Increase memory on Render (might help)

---

## Performance Tips

1. **Upgrade Render:** Free tier gets CPU throttled after 2-3 concurrent users
   - Suitable for: Small testing groups
   - Not suitable for: Public launch with 100+ users

2. **Enable Caching:** Add this to `vercel.json` for faster static load
   ```json
   "headers": [
     {
       "source": "/static/(.*)",
       "headers": [
         {"key": "Cache-Control", "value": "public, max-age=31536000"}
       ]
     }
   ]
   ```

3. **Model Optimization:** Consider caching model between requests on Render

---

## Next Steps (Optional Upgrades)

- **Better Backend:** Railway or Hugging Face Spaces ($0-5/mo)
- **CDN:** Cloudflare (free) for faster global delivery
- **Monitoring:** Render + Vercel have dashboards under "Analytics"
- **Custom Email:** If you add user accounts, use SendGrid/Mailgun

---

## Quick Reference

| Component | URL | Status Check |
|-----------|-----|------|
| **Frontend** | https://watermark.tech | Visit site |
| **Backend** | https://watermark-api.onrender.com | Check `/health` |
| **Vercel Dashboard** | https://vercel.com/dashboard | Deployment logs |
| **Render Dashboard** | https://dashboard.render.com | Service logs |

---

**Need help?**
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com/
