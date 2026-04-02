# Watermark AI Remover

An advanced AI-powered tool to remove watermarks from images using deep learning (LaMA) and YOLO models.

## Project Structure

- `app/`: Contains the backend FastAPI application and AI algorithms.
  - `main.py`: Entry point for the FastAPI server and REST API endpoints.
  - `algorithms/`: Core AI logic and model management.
- `static/`: Frontend assets (HTML, CSS, JavaScript).
- `requirements.txt`: Python dependencies.
- `Dockerfile`: Containerization configuration for deployment.

## Getting Started

### Local Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Download Models**:
   Ensure you have the required YOLO and LaMA models placed in `app/algorithms/models/`.

3. **Run the Application**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   The app will be available at `http://localhost:8000`.

### Deployment

This project is ready for deployment on platforms like:
- **Docker**: `docker build -t watermark-ai .`
- **Heroku/Render**: Using the provided `Procfile`.
- **Other Cloud Providers**: Utilizing the included `Dockerfile`.
