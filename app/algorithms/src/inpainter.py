import torch
import os
import gc
from PIL import Image
from simple_lama_inpainting import SimpleLama
import numpy as np

# Force CPU execution at the environment level
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:512"

# Memory optimization
torch.set_float32_matmul_precision('medium')

# Monkeypatch torch.jit.load to fix "Found no NVIDIA driver" error during model loading
_original_jit_load = torch.jit.load
def _patched_jit_load(f, map_location=None, *args, **kwargs):
    return _original_jit_load(f, map_location='cpu', *args, **kwargs)
torch.jit.load = _patched_jit_load

class WatermarkInpainter:
    def __init__(self, device=None):
        """
        Initialize the LaMA inpainter.
        :param device: torch device (cuda or cpu).
        """
        if device is None:
            self.device = torch.device('cpu')  # Force CPU
        else:
            self.device = device
            
        print(f"Initializing LaMA on {self.device}")
        try:
            self.simple_lama = SimpleLama(device=self.device)
        except RuntimeError as e:
            if "NVIDIA driver" in str(e) or "CUDA" in str(e):
                print(f"⚠️ GPU error detected: {e}. Falling back to CPU...")
                self.device = torch.device('cpu')
                self.simple_lama = SimpleLama(device=self.device)
            else:
                raise e

    def remove_watermark(self, image, mask):
        """
        Remove watermark using LaMA.
        :param image: PIL Image or numpy array (H, W, 3).
        :param mask: PIL Image or numpy array (H, W) - 255 for mask, 0 for background.
        :return: Clean PIL Image.
        """
        if isinstance(image, np.ndarray):
            image = Image.fromarray(image)
        if isinstance(mask, np.ndarray):
            mask = Image.fromarray(mask)
            
        # Ensure mask is L mode
        if mask.mode != 'L':
            mask = mask.convert('L')
        
        # Process with no_grad to save memory
        with torch.no_grad():
            result = self.simple_lama(image, mask)
        
        # Clean up
        gc.collect()
        
        return result
