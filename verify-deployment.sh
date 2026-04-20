#!/bin/bash

# Deployment Verification Script
# Run this before deploying to verify everything is configured correctly

echo "🔍 AI Watermark Remover - Deployment Verification"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to check if file exists and has content
check_file() {
    if [ -f "$1" ]; then
        if [ -s "$1" ]; then
            echo -e "${GREEN}✓${NC} $1 exists and has content"
            return 0
        else
            echo -e "${RED}✗${NC} $1 exists but is empty"
            ((ERRORS++))
            return 1
        fi
    else
        echo -e "${RED}✗${NC} $1 does not exist"
        ((ERRORS++))
        return 1
    fi
}

# Function to check if string exists in file (case-insensitive)
check_content() {
    if grep -qi "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 contains '$2'"
        return 0
    else
        echo -e "${RED}✗${NC} $1 missing '$2'"
        ((ERRORS++))
        return 1
    fi
}

echo "📁 Configuration Files:"
check_file "vercel.json"
check_file "render.yaml"
check_file "runtime.txt"
check_file "requirements.txt"
check_file "Procfile"
check_file "start.sh"
check_file "package.json"
echo ""

echo "🔧 Configuration Content:"
check_content "vercel.json" '"src": "app/main.py"'
check_content "render.yaml" "startCommand"
check_content "runtime.txt" "python-3.10"
check_content "requirements.txt" "fastapi"
check_content "requirements.txt" "torch"
check_content "package.json" '"start"'
echo ""

echo "📝 App Structure:"
check_file "app/main.py"
check_file "app/__init__.py"
check_file "app/algorithms/__init__.py"
check_file "static/index.html"
check_file "static/script.js"
check_file "static/style.css"
echo ""

echo "🐍 Python Environment:"
if [ -d "venv" ]; then
    echo -e "${GREEN}✓${NC} Virtual environment exists"
    
    if [ -f "venv/bin/python" ]; then
        echo -e "${GREEN}✓${NC} Python executable found"
        PYTHON_VERSION=$(venv/bin/python --version)
        echo -e "  Version: $PYTHON_VERSION"
    else
        echo -e "${RED}✗${NC} Python executable not found"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Virtual environment not found (create with: python -m venv venv)"
fi
echo ""

echo "📦 Dependency Checks:"
if [ -f "requirements.txt" ]; then
    PACKAGES=$(wc -l < requirements.txt)
    echo -e "${GREEN}✓${NC} $PACKAGES packages specified in requirements.txt"
    
    # Check for critical packages
    check_content "requirements.txt" "fastapi"
    check_content "requirements.txt" "uvicorn"
    check_content "requirements.txt" "torch"
    check_content "requirements.txt" "pillow"
else
    echo -e "${RED}✗${NC} requirements.txt not found"
    ((ERRORS++))
fi
echo ""

echo "🌐 Server Configuration:"
check_content "app/main.py" "FastAPI"
check_content "app/main.py" "CORSMiddleware"
check_content "app/main.py" "@app.post"
echo ""

echo "📋 Deployment Guides:"
check_file "VERCEL_DEPLOYMENT_GUIDE.md"
check_file "COMPLETE_DEPLOYMENT_FIX.md"
check_file "DEPLOYMENT_GUIDE.md"
echo ""

echo "=================================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Read COMPLETE_DEPLOYMENT_FIX.md"
    echo "2. Choose deployment platform (Render recommended)"
    echo "3. Run: bash start.sh (to test locally)"
    echo "4. Deploy!"
else
    echo -e "${RED}❌ Found $ERRORS issue(s). Please fix before deploying.${NC}"
fi

exit $ERRORS
