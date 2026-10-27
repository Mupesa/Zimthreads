import os
import numpy as np
from PIL import Image, ImageChops

output_dir = 'public/images/bracelets'
os.makedirs(output_dir, exist_ok=True)

paths = {
  'zimbabwe': 'C:/Users/AnesuMetaBox/.gemini/antigravity/brain/90861c0d-e6f7-4084-9ee0-135b60a721b2/.user_uploaded/media_1792035049225_894e5ae0.jpg',
  'ghana': 'C:/Users/AnesuMetaBox/.gemini/antigravity/brain/2cbab337-7b3a-4fae-94a1-170ddc616bac/.user_uploaded/media_1793120815509_f775f50c.jpg',
  'mauritius': 'C:/Users/AnesuMetaBox/.gemini/antigravity/brain/2cbab337-7b3a-4fae-94a1-170ddc616bac/.user_uploaded/media_1793120815509_dce14d97.jpg',
  'nigeria': 'C:/Users/AnesuMetaBox/.gemini/antigravity/brain/2cbab337-7b3a-4fae-94a1-170ddc616bac/.user_uploaded/media_1793120815508_de62e023.jpg',
}

target_dim = 1024

for name, p in paths.items():
    im = Image.open(p).convert('RGB')
    arr = np.array(im, dtype=np.float32)
    
    # Smooth background fade to pure 255 for near-white borders
    brightness = np.min(arr, axis=2)
    factor = np.clip((brightness - 232) / (255 - 232), 0.0, 1.0)
    for c in range(3):
        arr[:, :, c] = arr[:, :, c] * (1.0 - factor) + 255.0 * factor
        
    cleaned = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    
    # Determine bounding box
    bg = Image.new('RGB', cleaned.size, (255, 255, 255))
    diff = ImageChops.difference(cleaned, bg)
    diff = ImageChops.add(diff, diff, 2.0, -10)
    bbox = diff.getbbox()
    
    subj_cx = (bbox[0] + bbox[2]) / 2.0
    subj_cy = (bbox[1] + bbox[3]) / 2.0
    
    canvas = Image.new('RGB', (target_dim, target_dim), (255, 255, 255))
    
    paste_x = int(target_dim / 2.0 - subj_cx)
    paste_y = int(target_dim / 2.0 - subj_cy)
    
    canvas.paste(cleaned, (paste_x, paste_y))
    
    out_path = os.path.join(output_dir, f'bracelet-{name}.jpg')
    canvas.save(out_path, 'JPEG', quality=95, optimize=True)
    print(f'Processed {name} -> {out_path} ({canvas.size}, {os.path.getsize(out_path)} bytes)')
