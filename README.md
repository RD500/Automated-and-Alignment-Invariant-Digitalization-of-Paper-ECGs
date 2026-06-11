
# ECG Digitizer

This project presents ECG Digitizer, a full-stack web application that transforms ECG (electrocardiogram) images into precise numerical signal data using deep learning segmentation with nnU-Net. The system addresses the critical need for digitizing legacy ECG recordings and printed electrocardiograms in clinical and research environments. The application employs a 5-fold ensemble nnU-Net model trained specifically for ECG trace segmentation, coupled with a React-based frontend for intuitive user interaction and a Flask backend for efficient processing. The system provides real-time processing capabilities, interactive visualization, and multiple export formats, making it suitable for both clinical applications and research purposes. Experimental validation demonstrates accurate signal extraction with customizable calibration parameters, supporting various ECG formats and resolutions with processing times of 10-30 seconds per image.

---

## Project Structure

```
ecg-digitizer/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── run_backend.sh
│   ├── run_backend.bat
│   ├── venv/                          # Virtual environment (created locally)
│   └── working/
│       ├── nnUNet_raw/
│       ├── nnUNet_preprocessed/
│       ├── nnUNet_results/
│       │   └── Dataset001_ECG/
│       │       └── nnUNetTrainer__nnUNetPlans__2d/
│       │           ├── fold_0/
│       │           │   └── checkpoint_final.pth
│       │           ├── fold_1/
│       │           │   └── checkpoint_final.pth
│       │           ├── fold_2/
│       │           │   └── checkpoint_final.pth
│       │           ├── fold_3/
│       │           │   └── checkpoint_final.pth
│       │           └── fold_4/
│       │               └── checkpoint_final.pth
│       ├── uploads/                   # Temporary uploads
│       ├── input/                     # Preprocessed inputs
│       ├── output-ensemble/           # Model outputs
│       └── results/                   # Final digitized ECG signals
│
└── frontend/
    ├── public/
    │   ├── index.html
    │   ├── frames/                    # Scroll animation frames
    │   │   ├── frame-001.png
    │   │   ├── frame-002.png
    │   │   ├── ...
    │   │   └── frame-240.png
    │   └── favicon.ico
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.jsx
    │   └── index.css
    ├── package.json
    ├── package-lock.json
    └── node_modules/                  # Installed locally (ignored in git)
```

---

## File Descriptions

### Backend Files

| File | Description |
|------|-------------|
| `app.py` | Flask backend server handling nnU-Net inference, ECG image preprocessing, and signal extraction |
| `requirements.txt` | Python dependencies for backend and nnU-Net inference |
| `working/` | Workspace containing nnU-Net data, trained models, intermediate files, and results |

### Frontend Files

| File | Description |
|------|-------------|
| `public/index.html` | Landing page with scroll-based animation |
| `public/frames/` | PNG image sequence used for scroll animation (typically 240 frames) |
| `src/App.jsx` | Main React component for ECG upload, processing, and visualization |
| `src/App.css` | Styling for the React application |
| `src/index.jsx` | React entry point |
| `src/index.css` | Global styles |
| `package.json` | Node.js dependencies and scripts |

---

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- Git

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install git+https://github.com/FelixKrones/nnUNet.git
```

**Copy the trained nnU-Net models into:**
```
backend/working/nnUNet_results/
```

**Start backend server:**
```bash
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Access the Application

- **Frontend (UI):** http://localhost:3000
- **Backend API:** http://localhost:5001

---

## Important Notes

### Frames Folder
If you don't have all 240 frames, you can:
- Create placeholder images
- Reduce frame count and update the frontend logic
- Disable the scroll animation entirely

### Model Files
All 5 nnU-Net folds must be present for ensemble inference.


### Port Conflicts
- **Frontend:** 3000
- **Backend:** 5001

Update ports in configuration files if already in use.

---

## Technologies Used

- **Backend:** Flask, nnU-Net, PyTorch
- **Frontend:** React, HTML5, CSS3
- **Deep Learning:** nnU-Net (medical image segmentation)

---


## Automated and Alignment-Invariant Digitalization of Paper ECGs

Electrocardiograms (ECGs) are a pivotal tool for monitoring heart activity, but the prevalence of paper-based records presents significant challenges, including data degradation, difficult retrieval, and an inability to perform computational analysis. A significant problem with existing digitization methods is their dependency on high-quality inputs; most perform well only with high-resolution, properly illuminated, and well-aligned images, failing on scans with common real-world imperfections. To address these issues, this study introduces a robust, data-centric training methodology to build a deep learning model resilient to real-world image imperfections. A large-scale, diverse training dataset is synthetically generated using 1D time-series signals from the public PTB-XL dataset as ground truth. Our method introduces an automated pipeline where bounding box metadata is programmatically created to identify and isolate individual lead regions. This strategy decomposes the complex full-page digitization task into simpler binary segmentation problems. The dataset of pre-cropped image-mask pairs is used to train the nnU-Net framework, a self-configuring deep learning pipeline that automatically optimizes a 2D U-Net architecture for this task.


## Problem Statement

The electrocardiogram (ECG) is a fundamental diagnostic tool for monitoring the electrical activity of the heart and detecting cardiovascular abnormalities. Despite the widespread adoption of digital ECG recording devices in modern healthcare systems, millions of paper-based ECG records continue to exist in hospitals, clinics, and research institutions worldwide, particularly in resource-limited settings. These paper ECGs represent valuable clinical and epidemiological data that remain largely inaccessible for computational analysis and machine learning applications.

Paper-based ECG records have been, and continue to be, the predominant choice for clinical record keeping due to their widespread availability and established clinical workflows. However, this analog storage method suffers from significant limitations that impede modern healthcare data management. Physical paper ECGs are vulnerable to degradation through paper deterioration, ink fading, and environmental damage. Additionally, these records face challenges related to physical storage requirements, difficulty in retrieval and sharing, lack of digital backup systems, and insufficient security measures.

Most critically, since paper ECGs are stored as images rather than structured time-series data, they cannot be directly subjected to computational analysis, automated diagnostic algorithms, or machine learning-based classification methods. Signal degradation from printing, scanning, and physical deterioration further complicates downstream clinical interpretation.

### Current Challenges

The effectiveness of current ECG digitization methods remains highly dependent on image quality and characteristics. Most traditional approaches demonstrate strong performance only when provided with high-resolution, properly illuminated, and well-aligned ECG images, while their accuracy degrades substantially with variations in input quality. Existing methods often require specific orientations, alignments, or standardized formatting of ECG signals to function accurately. Additionally, many approaches are sensitive to variations in ECG manufacturer standards, printing techniques, and image capture environments.

Several key technical challenges complicate the reliable digitization of paper-based ECGs:

1. **Image Quality Variability**: Differences in scanning resolution, paper degradation, and printing standards
2. **Grid Removal and Background Subtraction**: ECG signals must be separated from background grid lines without loss of critical waveform information
3. **Multi-lead Extraction**: Robust methods to localize and process all 12 leads from single full-page images
4. **Noise and Artifacts**: Management of wrinkles, creases, handwritten annotations, and environmental factors
5. **Signal Reconstruction**: Precise conversion of pixel coordinates to physiologically meaningful voltage values

## Methodology

Our digitization pipeline is structured into three sequential stages: (A) label-guided lead cropping, (B) signal trace segmentation, and (C) signal vectorization and calibration.

### Label-Guided Lead Cropping

To accommodate diverse ECG layouts (e.g., 3×4 or 2×6) and correct for rotational skew, our methodology begins by isolating each of the 12 leads. We employ an object detection model to first identify the text label for each lead (e.g., "I," "II," "V1") within the scanned image. These detected labels serve as dynamic reference points. By calculating the relative horizontal and vertical distances between these labels, we programmatically infer the precise bounding box for each lead's signal region, effectively creating an adaptive cropping grid for every scan.

Following the crop, a post-processing step is applied to clean each resulting image. We perform a connected-component analysis on the pixel data and retain only the largest component, which corresponds to the primary ECG trace. This procedure effectively eliminates noise and signal fragments from adjacent leads. The output of this stage is a set of 12 standardized, clean lead images, which simplifies the subsequent segmentation task.

### Signal Trace Segmentation

The extraction of the signal from each cropped image is framed as a binary segmentation problem, which aims to separate the foreground signal trace from the background grid and paper. For this task, we employ nnU-Net, a self-configuring deep learning framework designed for biomedical image segmentation.

The nnU-Net model was trained on a large-scale synthetic dataset generated by the `ecg-image-kit` library. This generator uses the 1D time-series data from the PTB-XL dataset to render realistic 2D ECG images and their corresponding, pixel-perfect ground-truth masks. This synthetic training approach circumvents the laborious and error-prone process of manual annotation.

The fully trained nnU-Net model processes each of the 12 cropped lead images, outputting a precise binary mask that isolates the signal pixels for the final vectorization stage. The primary loss function used to train the nnU-Net segmentation model is the Soft Dice Loss, which quantifies the overlap between the predicted mask and the ground truth mask.

The Dice loss encourages maximum spatial overlap between the predicted segmentation and ground truth and is especially effective for handling class imbalance in biomedical images. nnU-Net uses 5-fold cross-validation, where the dataset is divided into five partitions, and five U-Nets are trained, each time using four partitions for training and the remaining one as the validation fold.

### Vectorization and Calibration

The final stage converts the 2D binary masks from the segmentation step into a 1D time-series signal through a two-stage process.

#### Vectorization (Mask-to-Pixel Coordinates)

The output mask from nnU-Net may be several pixels in thickness. To derive a single time-series, we iterate along the horizontal (time) axis, column by column. For any given x-coordinate containing signal pixels, we compute the median y-coordinate. This "median-trace" algorithm generates a 1-pixel-thick line of (px, py) coordinates representing the signal's center.

#### Calibration (Pixel-to-Physical Units)

The pixel coordinates are then calibrated to standard physical units. Per clinical standards, we assume a paper speed of 25 mm/s (where 1 mm = 40 ms) and a gain of 10 mm/mV (where 1 mm = 0.1 mV). To apply this, we first determine the pixel-to-millimeter scaling factors by analyzing the 1 mm grid present in the cropped images.


### System Architecture

The ECG Digitizer employs a three-tier architecture designed for scalability, accuracy, and ease of use:

#### Frontend Layer (React + Vite)
- **User Interface**: Responsive web interface with drag-and-drop functionality
- **Real-time Controls**: Interactive calibration parameter adjustment
- **Visualization**: Live preview of digitized waveforms and segmentation masks
- **Export System**: Multiple format support (CSV, JSON, PNG)

#### Backend Layer (Flask + PyTorch)
- **Image Processing Pipeline**: Automated preprocessing and validation
- **nnU-Net Integration**: Deep learning inference orchestration
- **Signal Extraction**: Advanced vectorization algorithms
- **API Services**: RESTful endpoints for seamless frontend communication

#### Deep Learning Layer (nnU-Net)
- **Model Architecture**: 2D U-Net with residual connections
- **Training Dataset**: Dataset001_ECG (custom ECG image collection)
- **Ensemble Prediction**: 5-fold cross-validation for robust results
- **Device Optimization**: CPU/GPU/MPS adaptive processing

### Processing Pipeline

The digitization process follows a systematic four-stage pipeline:

#### Stage 1: Image Preprocessing
```
Input Image → Format Validation → Grayscale Conversion → Noise Reduction → Quality Assessment
```

#### Stage 2: Deep Learning Segmentation
```
Preprocessed Image → nnU-Net Inference → Ensemble Prediction → Segmentation Mask → Post-processing
```

#### Stage 3: Signal Vectorization
```
Segmentation Mask → Trace Detection → Centerline Extraction → Calibration Application → Time-series Generation
```

#### Stage 4: Export and Visualization
```
Digital Signal → Metadata Generation → Visualization Creation → Multi-format Export → Quality Metrics
```

## Novelty and Key Contributions

### Technical Innovations

1. **nnU-Net Adaptation for ECG Segmentation**: Implementation of nnU-Net specifically trained for ECG trace extraction with custom synthetic data generation and 5-fold ensemble prediction for enhanced robustness.

2. **Automated Label-Guided Cropping**: Dynamic reference point system using detected ECG lead labels to programmatically infer precise bounding boxes for each lead's signal region, creating adaptive cropping grids.

3. **Synthetic Data Generation Pipeline**: Large-scale synthetic dataset creation using the `ecg-image-kit` library with 1D time-series data from PTB-XL dataset to render realistic 2D ECG images with pixel-perfect ground-truth masks.

4. **Binary Segmentation Decomposition**: Strategy that decomposes complex full-page digitization tasks into simpler binary segmentation problems by processing individual lead regions separately.


## Results

### Segmentation Model Performance

The quantitative evaluation focused on the efficacy of the proposed deep learning framework in segmenting ECG signal traces from pre-isolated regions of interest. Performance metrics were computed on the validation set following the 5-fold stratified cross-validation process. The primary metrics used to assess the overlap between the predicted segmentation masks and the ground truth were the Dice Similarity Coefficient (DSC) and Intersection over Union (IoU).

The model achieved a **mean Dice Score of 0.9246** and a **mean IoU of 0.8609**. These values indicate a high degree of concordance between the predicted signal traces and the ground truth annotations. The strong performance metrics confirm that the methodology of decomposing full-page images into individual lead-specific bounding boxes prior to segmentation effectively reduces background complexity, allowing the model to precisely isolate signal pixels.

### Classification Metrics

To further assess the pixel-level classification capabilities, Precision and Recall were derived to evaluate the model's sensitivity and specificity in distinguishing signal traces from the grid and background noise.

- **Precision (0.9315)**: The high precision score reflects a low rate of false positives, indicating that pixels classified as "signal" by the model were highly likely to be part of the actual ECG trace
- **Recall (0.9122)**: The recall score demonstrates that the model successfully captured the vast majority of signal pixels, ensuring morphological integrity of the ECG waveform

### Performance Variability by Lead

The model demonstrated consistent stability across standard limb leads, with distinct variations observed that correlated with signal amplitude and complexity:

- **Maximum Performance**: Lead aVR achieved the highest segmentation accuracy with a Dice Score of 0.9667 and IoU of 0.9355
- **Minimum Performance**: Lead V4 showed the lowest performance with a Dice Score of 0.7853 and IoU of 0.6465
- **Lead-Specific Consistency**: Standard limb leads demonstrated high reliability, with Lead I and Lead II achieving average Dice scores of 0.9289 and 0.9446, respectively


## Usage Guide

### Step-by-Step Workflow

#### 1. **Upload ECG Image**
- **Method 1**: Click the upload area and select your ECG image
- **Method 2**: Drag and drop the image directly onto the upload zone
- **Supported formats**: PNG, JPG, JPEG (automatically converted to grayscale if needed)
- **File size limit**: Recommended under 10MB for optimal performance

#### 2. **Configure Calibration Parameters** *(Optional)*
Fine-tune the digitization process with these parameters:

| Parameter | Description | Default | Range |
|-----------|-------------|---------|-------|
| **Lead Name** | Identifier for the ECG lead (e.g., "Lead I", "V1") | None | Any text |
| **sec/pixel** | Time calibration - seconds per pixel width | 0.004 | 0.001-0.01 |
| **mV/pixel** | Voltage calibration - millivolts per pixel height | 0.01 | 0.001-0.1 |
| **Y-shift ratio** | Baseline position (0=bottom, 1=top) | 0.5 | 0.0-1.0 |

#### 3. **Process the Image**
- Click **"Digitize ECG"** button
- Wait for the AI processing (typically 10-30 seconds)
- Monitor progress through real-time status updates

#### 4. **Review Results**
The application provides comprehensive output:
- **Digitized Waveform**: Interactive plot of the extracted signal
- **Segmentation Mask**: Visual overlay showing detected ECG traces
- **Signal Metadata**: Sampling rate, duration, and calibration info
- **Quality Metrics**: Processing statistics and confidence scores

#### 5. **Export Data**
- **CSV Download**: Time-series data in `Time(s), Amplitude(mV)` format
- **Metadata JSON**: Complete processing parameters and statistics
- **Visualization PNG**: High-resolution plot of the digitized signal




