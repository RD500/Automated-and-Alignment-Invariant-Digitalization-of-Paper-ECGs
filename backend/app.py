from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image
import io
import base64
import subprocess
import json
import shutil
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')

# Enable GPU if available
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Using device: {DEVICE}")
if DEVICE == 'cuda':
    print(f"GPU: {torch.cuda.get_device_name(0)}")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Configuration
WORKING_DIR = os.path.join(os.path.dirname(__file__), 'working')
UPLOAD_FOLDER = os.path.join(WORKING_DIR, 'uploads')
INPUT_FOLDER = os.path.join(WORKING_DIR, 'input')
OUTPUT_FOLDER = os.path.join(WORKING_DIR, 'output-ensemble')
RESULTS_FOLDER = os.path.join(WORKING_DIR, 'results')

FREQUENCY = 500
LONG_SIGNAL_LENGTH_SEC = 10
SHORT_SIGNAL_LENGTH_SEC = 2.5

for folder in [UPLOAD_FOLDER, INPUT_FOLDER, OUTPUT_FOLDER, RESULTS_FOLDER]:
    os.makedirs(folder, exist_ok=True)

os.environ["nnUNet_raw"] = os.path.join(WORKING_DIR, "nnUNet_raw")
os.environ["nnUNet_preprocessed"] = os.path.join(WORKING_DIR, "nnUNet_preprocessed")
os.environ["nnUNet_results"] = os.path.join(WORKING_DIR, "nnUNet_results")


def run_nnunet_inference(input_folder, output_folder):
    env = os.environ.copy()

    cmd = [
        'nnUNetv2_predict',
        '-i', input_folder,
        '-o', output_folder,
        '-d', '1',
        '-c', '2d',
        '-f', '0', '1', '2', '3', '4',
        '-tr', 'nnUNetTrainer',
        '-p', 'nnUNetPlans'
    ]

    if DEVICE == 'cuda':
        env["CUDA_VISIBLE_DEVICES"] = "0"

        # 🔥 CRITICAL FIXES
        env["nnUNet_use_amp"] = "False"
        env["OMP_NUM_THREADS"] = "1"

        # OPTIONAL but helps stability
        env["MKL_NUM_THREADS"] = "1"

    try:
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
            env=env
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr
    
def load_mask(mask_path):
    print(f"Loading mask: {mask_path}")

    if mask_path.endswith('.npy'):
        mask = np.load(mask_path)
    elif mask_path.endswith('.npz'):
        mask = np.load(mask_path)['arr_0']
    elif mask_path.endswith('.nii.gz') or mask_path.endswith('.nii'):
        import nibabel as nib
        mask = nib.load(mask_path).get_fdata()
    else:
        mask = np.array(Image.open(mask_path))

    mask_tensor = torch.from_numpy(mask).float().to(DEVICE)

    if mask_tensor.dim() == 2:
        mask_tensor = mask_tensor.unsqueeze(0).unsqueeze(0)
    elif mask_tensor.dim() == 3:
        mask_tensor = mask_tensor.unsqueeze(0)

    if mask_tensor.shape[1] > 1:
        mask_tensor = torch.argmax(mask_tensor, dim=1, keepdim=True).float()

    return mask_tensor


# ==============================
# VECTORIZE (UNCHANGED)
# ==============================
def vectorise(image_rotated, mask, signal_cropped,
              sec_per_pixel, mV_per_pixel, y_shift_ratio):

    H, W = mask.shape[2], mask.shape[3]

    total_seconds_from_mask = round(sec_per_pixel * W, 1)

    if total_seconds_from_mask > (LONG_SIGNAL_LENGTH_SEC / 2):
        total_seconds = LONG_SIGNAL_LENGTH_SEC
    else:
        total_seconds = SHORT_SIGNAL_LENGTH_SEC

    values_needed = int(total_seconds * FREQUENCY)

    non_zero_mean = torch.tensor([
        torch.mean(torch.nonzero(mask[0, 0, :, x]).float())
        if torch.count_nonzero(mask[0, 0, :, x]) > 0 else 0.0
        for x in range(W)
    ]).to(DEVICE)

    signal_cropped_shifted = ((1 - y_shift_ratio) * H - signal_cropped)

    predicted_signal = (signal_cropped_shifted - non_zero_mean) * mV_per_pixel
    predicted_signal = predicted_signal - torch.median(predicted_signal)

    resampled = F.interpolate(
        predicted_signal.view(1, 1, -1),
        size=values_needed,
        mode="linear",
        align_corners=False,
    )

    return resampled.view(-1)


def extract_signal_from_mask(image, mask, calibration):
    sec_per_pixel = calibration['sec_per_pixel']
    mV_per_pixel = calibration['mV_per_pixel']
    y_shift_ratio = calibration['y_shift_ratio']

    image_tensor = torch.from_numpy(np.array(image)).float().unsqueeze(0).unsqueeze(0).to(DEVICE)
    signal_trace = torch.tensor([
        torch.mean(torch.nonzero(mask[0, 0, :, i]).float())
        if torch.count_nonzero(mask[0, 0, :, i]) > 0 else 0.0
        for i in range(mask.shape[3])
    ]).to(DEVICE)

    signal = vectorise(
        image_tensor,
        mask,
        signal_trace,
        sec_per_pixel,
        mV_per_pixel,
        y_shift_ratio
    )

    return signal.detach().cpu().numpy().tolist()
def plot_signal(signal, lead_name, output_path, img_width_px, img_height_px):
    DPI = 100
    fig_width_in = img_width_px / DPI
    fig_height_in = img_height_px / DPI

    fig, ax = plt.subplots(figsize=(fig_width_in, fig_height_in), dpi=DPI)

    time = np.arange(len(signal)) / FREQUENCY
    ax.plot(time, signal, 'g-', linewidth=1.2)

    ax.set_xlabel('Time (s)')
    ax.set_ylabel('Amplitude (mV)')
    ax.set_title('Digitized ECG Signal')
    ax.grid(True, linestyle='--', alpha=0.3)

    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
def mask_to_base64(mask_tensor):
    mask_np = mask_tensor.detach().cpu().squeeze().numpy()

    if mask_np.max() > mask_np.min():
        mask_np = (mask_np - mask_np.min()) / (mask_np.max() - mask_np.min()) * 255
    else:
        mask_np = mask_np * 255

    mask_np = mask_np.astype(np.uint8)

    mask_img = Image.fromarray(mask_np)

    buffer = io.BytesIO()
    mask_img.save(buffer, format='PNG')
    buffer.seek(0)

    return base64.b64encode(buffer.read()).decode()

# ==============================
# MAIN API
# ==============================
@app.route('/api/digitize', methods=['POST'])
def digitize_ecg():

    file = request.files['ecg_image']

    import uuid
    timestamp = str(uuid.uuid4())

    upload_path = os.path.join(UPLOAD_FOLDER, f"{timestamp}.png")
    input_path = os.path.join(INPUT_FOLDER, f"{timestamp}_0000.png")
    if os.path.exists(INPUT_FOLDER):
        shutil.rmtree(INPUT_FOLDER)
    os.makedirs(INPUT_FOLDER, exist_ok=True)

    file.save(upload_path)
    Image.open(upload_path).convert('L').save(input_path)
    # Clear old predictions (VERY IMPORTANT)
    if os.path.exists(OUTPUT_FOLDER):
        shutil.rmtree(OUTPUT_FOLDER)
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    success, msg = run_nnunet_inference(INPUT_FOLDER, OUTPUT_FOLDER)
    if not success:
        return jsonify({'error': msg}), 500

    files = os.listdir(OUTPUT_FOLDER)
    print("OUTPUT FILES:", files)

    mask_path = None

    # 1. Prefer ecg_* (if exists)
    for f in files:
        if f.startswith("ecg_") and f.endswith(".png"):
            mask_path = os.path.join(OUTPUT_FOLDER, f)
            break

    # 2. Otherwise use ANY png (including 0.png)
    if mask_path is None:
        for f in files:
            if f.endswith(".png"):
                mask_path = os.path.join(OUTPUT_FOLDER, f)
                break

    if mask_path is None:
        return jsonify({'error': 'No valid mask found', 'files': files}), 500

    print("SELECTED MASK:", mask_path)

# 🔍 DEBUG CHECK (ADD HERE)
    mask_np = np.array(Image.open(mask_path))
    print("Mask min/max:", mask_np.min(), mask_np.max())

    # Now load it normally
    mask = load_mask(mask_path)

    calibration = {
        'sec_per_pixel': float(request.form.get('sec_per_pixel', 0.004)),
        'mV_per_pixel': float(request.form.get('mV_per_pixel', 0.01)),
        'y_shift_ratio': float(request.form.get('y_shift_ratio', 0.5))
    }

    # Load original image (needed for plot sizing)
    original_image = Image.open(input_path)
    img_width_px, img_height_px = original_image.size

    # Extract signal
    signal = extract_signal_from_mask(original_image, mask, calibration)

    # Create result folder
    result_folder = os.path.join(RESULTS_FOLDER, f"ecg_{timestamp}")
    os.makedirs(result_folder, exist_ok=True)

    # Save CSV
    csv_path = os.path.join(result_folder, 'signal.csv')
    with open(csv_path, 'w') as f:
        f.write('Time(s),Amplitude(mV)\n')
        for i, value in enumerate(signal):
            time = i / FREQUENCY
            f.write(f'{time:.4f},{value}\n')

    # Plot
    plot_path = os.path.join(result_folder, 'waveform.png')
    plot_signal(signal, None, plot_path, img_width_px, img_height_px)

    # Convert plot → base64
    with open(plot_path, 'rb') as f:
        plot_base64 = base64.b64encode(f.read()).decode()

    # Mask preview
    mask_base64 = mask_to_base64(mask)

    # Metadata
    metadata = {
        'sampling_rate': FREQUENCY,
        'duration': len(signal) / FREQUENCY,
        'signal_length': len(signal),
        'mV_per_pixel': calibration['mV_per_pixel'],
        'sec_per_pixel': calibration['sec_per_pixel'],
        'y_shift_ratio': calibration['y_shift_ratio']
    }
    os.remove(upload_path)
    os.remove(input_path)


# Final response
    return jsonify({
            'success': True,
            'signal': signal,
            'metadata': metadata,
            'plot': plot_base64,
            'mask_preview': mask_base64
        })
if __name__ == '__main__':
    app.run(debug=True, port=5001)