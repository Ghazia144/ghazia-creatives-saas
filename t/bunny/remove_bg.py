# Makes the white background of img/4.webp transparent.
# Install once:  pip install pillow numpy scipy
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

SRC, DST = "img/4.webp", "img/4.webp"   # change DST if you want to keep the original
THRESH = 235                            # how "white" a pixel must be to count as background

im  = Image.open(SRC).convert("RGB")
rgb = np.array(im)

# 1. pixels that are nearly white
white = (rgb >= THRESH).all(axis=2)

# 2. keep only the white that touches the image border (the real background),
#    so white parts INSIDE the bunnies / text are not removed
labels, _ = ndi.label(white)
border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
bg = np.isin(labels, border[border != 0])

# 3. grow the background by 1px to kill the white fringe, then soften the edge
bg = ndi.binary_dilation(bg, iterations=0) if False else bg
alpha = ndi.gaussian_filter((~bg).astype(float), 0.5)
alpha = (alpha * 255).clip(0, 255).astype(np.uint8)

out = np.dstack([rgb, alpha])
Image.fromarray(out, "RGBA").save(DST, "WEBP", lossless=True, method=6)
print("done ->", DST)
