from fastapi import FastAPI, UploadFile, File, Response, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os
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

# ─── STARTUP: Pre-load the AI model ─────────────────────
@app.on_event("startup")
async def startup_event():
    """
    Load the LaMA model at startup so the first user request
    doesn't have to wait for model initialization (~5-15s).
    Runs in a thread to avoid blocking the event loop.
    """
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, get_inpainter)
    print("✅ AI model loaded and ready.")

# ─── ROUTES ──────────────────────────────────────────────
@app.get("/")
async def read_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"message": "index.html not found in static folder."}, status_code=404)

@app.get("/health")
async def health_check():
    """Frontend polls this to know when the model is ready."""
    return JSONResponse({"status": "ok", "model": "lama"})

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

    try:
        # Run the CPU/GPU-heavy work in a thread pool so we don't block
        # FastAPI's async event loop.
        loop = asyncio.get_event_loop()
        processed_bytes = await loop.run_in_executor(
            None, remove_watermark_ai, image_bytes, mask_bytes
        )
    except Exception as e:
        print(f"❌ Processing error: {e}")
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

    return Response(
        content=processed_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename=\"justremove-result.png\""}
    )



# ─── STATIC FILES ─────────────────────────────────────────
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
