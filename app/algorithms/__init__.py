import io
import os
import sys
import torch
import numpy as np
import gc
from PIL import Image

# Memory optimization flags
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:512"
torch.set_float32_matmul_precision('medium')

# Add the directory containing 'src' to sys.path to resolve internal imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from src.inpainter import WatermarkInpainter

# Constants for memory management
MAX_IMAGE_SIZE = 1024  # Max dimension (will resize if larger)
MIN_IMAGE_SIZE = 64

# Initialize inpainter (singleton)
_inpainter = None

def get_inpainter():
    global _inpainter
    if _inpainter is None:
        print("Loading inpainter model...")
        try:
            _inpainter = WatermarkInpainter()
            print("✅ Inpainter loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load inpainter: {e}")
            import traceback
            traceback.print_exc()
            raise
    return _inpainter

def resize_image_if_needed(image: Image.Image, max_size: int = MAX_IMAGE_SIZE) -> Image.Image:
    """Resize image if it's too large to save memory."""
    width, height = image.size
    if width > max_size or height > max_size:
        scale = min(max_size / width, max_size / height)
        new_size = (int(width * scale), int(height * scale))
        print(f"Resizing image from {image.size} to {new_size}")
        image = image.resize(new_size, Image.LANCZOS)
    return image

def remove_watermark_ai(image_bytes: bytes, mask_bytes: bytes) -> bytes:
    """
    Interface function for the main FastAPI app.
    Converts bytes to PIL images, processes them using LaMA, and returns processed bytes.
    """
    try:
        # Force garbage collection before processing
        gc.collect()
        
        # 1. Convert bytes to PIL images
        print("Converting bytes to PIL images...")
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        mask = Image.open(io.BytesIO(mask_bytes)).convert("L")
        print(f"Image size: {image.size}, Mask size: {mask.size}")
        
        # 2. Resize if too large
        image = resize_image_if_needed(image, MAX_IMAGE_SIZE)
        mask = resize_image_if_needed(mask, MAX_IMAGE_SIZE)
        
        # Ensure they match
        if image.size != mask.size:
            mask = mask.resize(image.size, Image.LANCZOS)
            print(f"Resized mask to match image: {mask.size}")
        
        # 3. Use inpainter with no_grad to save memory
        print("Getting inpainter instance...")
        inpainter_instance = get_inpainter()
        print("Running watermark removal...")
        
        with torch.no_grad():
            result_pil = inpainter_instance.remove_watermark(image, mask)
        
        # 4. Convert back to bytes
        print("Converting result back to bytes...")
        buf = io.BytesIO()
        result_pil.save(buf, format="PNG", optimize=True)
        result_bytes = buf.getvalue()
        
        # 5. Clean up
        del image, mask, result_pil, buf
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        print(f"Processing complete: {len(result_bytes)} bytes")
        return result_bytes
    except Exception as e:
        print(f"Error in remove_watermark_ai: {e}")
        import traceback
        traceback.print_exc()
        # Clean up on error
        gc.collect()
        raise
