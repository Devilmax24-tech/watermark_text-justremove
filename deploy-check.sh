#!/bin/bash

# Quick Deployment Checklist
# Copy & paste commands to verify setup

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  JustRemove - Pre-Deployment Checklist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check 1: Git setup
echo -e "\n✓ Check 1: Git Repository"
if [ -d .git ]; then
    echo "  ✅ Git repo exists"
    echo "  Remote: $(git config --get remote.origin.url)"
else
    echo "  ❌ No git repo. Run: git init && git remote add origin <url>"
fi

# Check 2: Required files exist
echo -e "\n✓ Check 2: Deployment Files"
files=("Procfile" "render.yaml" ".vercelignore" "vercel.json" "config.js")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ Missing $file"
    fi
done

# Check 3: Backend config
echo -e "\n✓ Check 3: Backend Files"
if [ -d "app" ] && [ -f "app/main.py" ]; then
    echo "  ✅ FastAPI app found (app/main.py)"
else
    echo "  ❌ FastAPI app not found"
fi

if [ -f "requirements.txt" ]; then
    echo "  ✅ requirements.txt exists"
    echo "  Dependencies: $(cat requirements.txt | wc -l) packages"
else
    echo "  ❌ requirements.txt missing"
fi

# Check 4: Frontend files
echo -e "\n✓ Check 4: Frontend Files"
frontend_files=("index.html" "script.js" "style.css" "config.js")
for file in "${frontend_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ Missing $file"
    fi
done

# Check 5: Config verification
echo -e "\n✓ Check 5: Configuration"
if grep -q "CONFIG.API_URL" "script.js"; then
    echo "  ✅ script.js uses CONFIG.API_URL"
else
    echo "  ❌ script.js not using CONFIG.API_URL"
fi

if grep -q "config.js" "index.html"; then
    echo "  ✅ index.html includes config.js"
else
    echo "  ❌ index.html missing config.js script"
fi

# Check 6: CORS enabled
echo -e "\n✓ Check 6: CORS Configuration"
if grep -q "CORSMiddleware" "app/main.py"; then
    echo "  ✅ CORS enabled in app/main.py"
else
    echo "  ❌ CORS not configured"
fi

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Push to GitHub:"
echo "   git add -A && git commit -m 'Add deployment configs' && git push"
echo ""
echo "2. Read deployment guide:"
echo "   cat VERCEL_RENDER_DEPLOYMENT.md"
echo ""
echo "3. Create Render service:"
echo "   - Go to https://dashboard.render.com"
echo "   - New Web Service"
echo "   - Connect GitHub repo"
echo ""
echo "4. Create Vercel project:"
echo "   - Go to https://vercel.com/dashboard"
echo "   - Import project from GitHub"
echo ""
echo "5. Update config.js with Render URL once deployed"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
