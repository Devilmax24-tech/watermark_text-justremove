#!/bin/bash

# Startup script for AI Watermark Remover
# Works for: Vercel, Render, Railway, Heroku, etc.

# Set Python optimization flags
export PYTHONUNBUFFERED=1
export PYTHONDONTWRITEBYTECODE=1
export OMP_NUM_THREADS=1
export TORCH_NUM_THREADS=1
export PYTORCH_ENABLE_MPS_FALLBACK=1

# Use provided PORT or default to 8000
PORT=${PORT:-8000}

# Start the application
exec python3 -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port $PORT \
  --workers 1 \
  --loop uvloop \
  --log-level info
