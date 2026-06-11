import json
import cv2
import numpy as np
from pathlib import Path
import os

# Configuration
# Do this for the test set as well
images_folder = "labelsTr"
output_folder = "labelTr_crop"

# Create output folder
Path(output_folder).mkdir(parents=True, exist_ok=True)

# Get all files in the folder
all_files = os.listdir(images_folder)

# Find all JSON files
json_files = [f for f in all_files if f.endswith('.json')]

print(f"Found {len(json_files)} JSON files to process")

for json_file in json_files:
    json_path = os.path.join(images_folder, json_file)
    png_file = json_file.replace('.json', '.png')
    png_path = os.path.join(images_folder, png_file)

    if not os.path.exists(png_path):
        print(f"Warning: No matching PNG for {json_file}")
        continue

    try:
        # Read JSON data
        with open(json_path, 'r') as f:
            data = json.load(f)

        # Read image data
        image = cv2.imread(png_path)
        if image is None:
            print(f"Error: Could not decode image {png_file}")
            continue

        base_name = Path(json_file).stem

        # Process each lead
        for lead in data['leads']:
            if 'lead_name' not in lead:
                continue

            lead_name = lead['lead_name']
            bbox = lead['lead_bounding_box']

            # Coordinates are [y, x], not [x, y]
            points = [bbox[str(i)] for i in range(4)]
            y_coords = [p[0] for p in points]
            x_coords = [p[1] for p in points]

            x_min = int(min(x_coords))
            x_max = int(max(x_coords))
            y_min = int(min(y_coords))
            y_max = int(max(y_coords))

            cropped = image[y_min:y_max, x_min:x_max]

            output_path = Path(output_folder) / f"{base_name}_{lead_name}.png"
            cv2.imwrite(str(output_path), cropped)

        print(f"Processed {base_name} - {len(data['leads'])} leads extracted")

    except Exception as e:
        print(f"Error processing {json_file}: {str(e)}")
        continue

print(f"\nDone! All cropped leads saved to {output_folder}")
