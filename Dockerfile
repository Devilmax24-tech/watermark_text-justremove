# Use Python 3.12 slim
FROM python:3.12-slim

# Install system dependencies (needed for OpenCV and some AI libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and static assets
COPY app/ app/
COPY static/ static/

# Environment variable for port
ENV PORT=8000

# Expose the default port
EXPOSE 8000

# Run the app using uvicorn
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
