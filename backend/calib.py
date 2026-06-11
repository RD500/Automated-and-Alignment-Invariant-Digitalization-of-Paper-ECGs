import cv2
import numpy as np
from scipy.signal import find_peaks
from scipy.ndimage import gaussian_filter1d


def calibrate_from_vertical_grids(image_path):

    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    if img is None:
        raise ValueError("Could not load image")

    inv = 255 - img

    profile = np.mean(inv, axis=0)

    profile = gaussian_filter1d(profile, sigma=8)

    peaks, props = find_peaks(
        profile,
        prominence=np.std(profile) * 0.3
    )

    if len(peaks) < 2:
        raise RuntimeError(
            f"Only {len(peaks)} peaks detected"
        )

    gaps = np.diff(peaks)

    median_spacing = np.median(gaps)

    mm_per_px = 5.0 / median_spacing

    sec_per_px = mm_per_px / 25.0
    mV_per_px = mm_per_px / 10.0

    return {
        "image": img,
        "major_grid_positions": peaks,
        "major_spacing_px": float(median_spacing),
        "mm_per_px": float(mm_per_px),
        "sec_per_px": float(sec_per_px),
        "mV_per_px": float(mV_per_px)
    }


result = calibrate_from_vertical_grids(
    "filled_ecg.jpeg"
)

for k, v in result.items():

    if k == "image":
        continue

    if isinstance(v, np.ndarray):
        print(k, ":", v.tolist())
    else:
        print(k, ":", v)


# -----------------------------
# Draw detected vertical lines
# -----------------------------

img = result["image"]

overlay = cv2.cvtColor(
    img,
    cv2.COLOR_GRAY2BGR
)

positions = result["major_grid_positions"]

for i, x in enumerate(positions):

    x = int(round(x))

    cv2.line(
        overlay,
        (x, 0),
        (x, overlay.shape[0] - 1),
        (0, 0, 255),
        2
    )

    cv2.putText(
        overlay,
        str(i),
        (x + 2, 20),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.4,
        (255, 0, 0),
        1
    )

cv2.imwrite(
    "major_grid_overlay.png",
    overlay
)

print(
    "\nSaved overlay image as "
    "'major_grid_overlay.png'"
)