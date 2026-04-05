import io
import os
import sys
import torch
import numpy as np
from PIL import Image

# Add the directory containing 'src' to sys.path to resolve internal imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from src.inpainter import WatermarkInpainter

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

def remove_watermark_ai(image_bytes: bytes, mask_bytes: bytes) -> bytes:
    """
    Interface function for the main FastAPI app.
    Converts bytes to PIL images, processes them using LaMA, and returns processed bytes.
    """
    try:
        # 1. Convert bytes to PIL images
        print("Converting bytes to PIL images...")
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        mask = Image.open(io.BytesIO(mask_bytes)).convert("L")
        print(f"Image size: {image.size}, Mask size: {mask.size}")
        
        # 2. Use inpainter
        print("Getting inpainter instance...")
        inpainter_instance = get_inpainter()
        print("Running watermark removal...")
        result_pil = inpainter_instance.remove_watermark(image, mask)
        
        # 3. Convert back to bytes
        print("Converting result back to bytes...")
        buf = io.BytesIO()
        result_pil.save(buf, format="PNG")
        return buf.getvalue()
    except Exception as e:
        print(f"Error in remove_watermark_ai: {e}")
        import traceback
        traceback.print_exc()
        raise
