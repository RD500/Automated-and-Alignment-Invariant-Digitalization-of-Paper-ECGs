import cv2
import numpy as np


def directional_fill_ecg(image, mask):
    """
    Parameters
    ----------
    image : np.ndarray
        Input image (grayscale or color)

    mask : np.ndarray
        Binary mask
        1 / 255 = signal pixels to fill
        0 = valid pixels

    Returns
    -------
    np.ndarray
        Filled grayscale image
    """

    # Convert to grayscale
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()

    gray = gray.astype(np.float32)

    # Normalize mask to boolean
    #mask = mask > 0
    mask = mask.astype(np.uint8)

    kernel = np.ones((7, 7), np.uint8)  # radius = 3 pixels
    mask = cv2.dilate(mask, kernel, iterations=1)

    mask = mask.astype(bool)
    h, w = gray.shape
    output = gray.copy()

    for y in range(h):
        for x in range(w):

            if not mask[y, x]:
                continue

            up_val = None
            down_val = None
            left_val = None
            right_val = None

            # Search upward
            yy = y - 1
            while yy >= 0:
                if not mask[yy, x]:
                    up_val = gray[yy, x]
                    break
                yy -= 1

            # Search downward
            yy = y + 1
            while yy < h:
                if not mask[yy, x]:
                    down_val = gray[yy, x]
                    break
                yy += 1

            # Search left
            xx = x - 1
            while xx >= 0:
                if not mask[y, xx]:
                    left_val = gray[y, xx]
                    break
                xx -= 1

            # Search right
            xx = x + 1
            while xx < w:
                if not mask[y, xx]:
                    right_val = gray[y, xx]
                    break
                xx += 1

            vertical_estimate = None
            horizontal_estimate = None

            vertical_conf = 0.0
            horizontal_conf = 0.0

            if up_val is not None and down_val is not None:
                vertical_estimate = (up_val + down_val) / 2.0

                # Agreement score
                vertical_conf = 1.0 / (1.0 + abs(up_val - down_val))

            elif up_val is not None:
                vertical_estimate = up_val
                vertical_conf = 1.0

            elif down_val is not None:
                vertical_estimate = down_val
                vertical_conf = 1.0

            if left_val is not None and right_val is not None:
                horizontal_estimate = (left_val + right_val) / 2.0

                # Agreement score
                horizontal_conf = 1.0 / (1.0 + abs(left_val - right_val))

            elif left_val is not None:
                horizontal_estimate = left_val
                horizontal_conf = 1.0

            elif right_val is not None:
                horizontal_estimate = right_val
                horizontal_conf = 1.0

            # Final fill according to confidence
            if vertical_estimate is not None and horizontal_estimate is not None:

                output[y, x] = (
                    vertical_conf * vertical_estimate
                    + horizontal_conf * horizontal_estimate
                ) / (vertical_conf + horizontal_conf)

            elif vertical_estimate is not None:
                output[y, x] = vertical_estimate

            elif horizontal_estimate is not None:
                output[y, x] = horizontal_estimate

    return output.astype(np.uint8)
if __name__=='__main__':
    img = cv2.imread("noisy_image.png")
    mask = cv2.imread("ecg_greynscale.png", 0)

    filled = directional_fill_ecg(img, mask)

    cv2.imwrite("filled_ecg.png", filled)