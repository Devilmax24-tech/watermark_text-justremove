from fastapi import FastAPI, UploadFile, File, Response, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os
import gc
import uvicorn
from app.algorithms import remove_watermark_ai, get_inpainter

app = FastAPI(title="AI Watermark Remover")

# ─── CORS ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Determine project root and static directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")

if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)

# Global model cache
_model_cache = None

def get_model():
    """Lazy load model on first use to save memory at startup"""
    global _model_cache
    if _model_cache is None:
        print("Model will be loaded on first request.")
        _model_cache = get_inpainter()
    return _model_cache

# ─── ROUTES ──────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """Frontend polls this to know when the model is ready."""
    try:
        # Try to get inpainter to check if model is loaded
        inpainter = get_inpainter()
        return JSONResponse({
            "status": "ok",
            "model": "lama",
            "message": "AI model is ready"
        })
    except Exception as e:
        print(f"Health check warning: {e}")
        return JSONResponse({
            "status": "loading",
            "model": "lama",
            "message": "Model is loading..."
        }, status_code=202)

@app.post("/remove-watermark")
async def remove_watermark(
    image: UploadFile = File(...),
    mask:  UploadFile = File(...),
):
    # Validate file types
    allowed = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
    if image.content_type not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {image.content_type}")

    image_bytes = await image.read()
    mask_bytes  = await mask.read()

    if not image_bytes or not mask_bytes:
        raise HTTPException(status_code=400, detail="Empty file received.")
    
    # Check file sizes (max 20MB)
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 20MB)")
    if len(mask_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Mask too large (max 20MB)")

    try:
        # Force garbage collection
        gc.collect()
        
        # Run the CPU/GPU-heavy work in a thread pool
        print(f"Processing image: {len(image_bytes)} bytes, mask: {len(mask_bytes)} bytes")
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        processed_bytes = await loop.run_in_executor(
            None, remove_watermark_ai, image_bytes, mask_bytes
        )
        print(f"✅ Processing complete: {len(processed_bytes)} bytes")
        
        # Clean up
        del image_bytes, mask_bytes
        gc.collect()
    except Exception as e:
        print(f"❌ Processing error: {e}")
        import traceback
        traceback.print_exc()
        gc.collect()
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

    return Response(
        content=processed_bytes,
        media_type="image/png",
        headers={"Content-Disposition": 'attachment; filename="justremove-result.png"'}
    )

@app.get("/api/status")
async def status_check():
    """Diagnostic endpoint to check deployment status."""
    import sys
    try:
        inpainter = get_inpainter()
        return JSONResponse({
            "status": "operational",
            "model": "lama",
            "python_version": sys.version,
            "torch_available": True,
        })
    except Exception as e:
        return JSONResponse({
            "status": "error",
            "error": str(e),
            "python_version": sys.version,
        }, status_code=500)


# ─── STATIC FILES ─────────────────────────────────────────
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
