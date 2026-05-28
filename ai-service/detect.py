"""
=============================================================
  Civica — YOLOv8 Object Detection Script
  Author : Antigravity (AI Pair Programmer)
  Purpose: Run inference on one or more images using a trained
           YOLOv8 model and classify each as "Correct" (object
           detected) or "Incorrect" (no object detected).

  Usage (interactive):
      python detect.py

  Usage (CLI — single image):
      python detect.py path/to/image.jpg

  Usage (CLI — multiple images):
      python detect.py img1.jpg img2.jpg img3.jpg

  Output images with bounding boxes are saved to: outputs/
=============================================================
"""

import sys
import os
import argparse
from pathlib import Path
from datetime import datetime

# ── Dependency check ───────────────────────────────────────────────────────────
try:
    import cv2
except ImportError:
    print("[ERROR] opencv-python is not installed.")
    print("        Run: pip install opencv-python")
    sys.exit(1)

try:
    from ultralytics import YOLO
except ImportError:
    print("[ERROR] ultralytics is not installed.")
    print("        Run: pip install ultralytics")
    sys.exit(1)

# ══════════════════════════════════════════════════════════════════════════════
#  CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════

MODEL_PATH        = Path(__file__).parent / "best.pt"   # Path to trained weights
OUTPUT_DIR        = Path(__file__).parent / "outputs"   # Output folder for annotated images
CONFIDENCE_THRESH = 0.25                                # Minimum confidence to count a detection
IOU_THRESH        = 0.45                                # IoU threshold for NMS


# ══════════════════════════════════════════════════════════════════════════════
#  HELPER: PRETTY PRINT
# ══════════════════════════════════════════════════════════════════════════════

SEPARATOR = "=" * 65

def print_header():
    """Print a styled header for the tool."""
    print("\n" + SEPARATOR)
    print("   YOLOv8 Object Detection — Civica AI Module")
    print(SEPARATOR)
    print(f"   Model  : {MODEL_PATH.name}")
    print(f"   Min Confidence: {CONFIDENCE_THRESH}")
    print(f"   Output Folder : outputs/")
    print(SEPARATOR + "\n")


def print_result_block(image_path: str, detections: list, verdict: str, output_path: str):
    """
    Print a clean, professor-ready result block for one image.

    Args:
        image_path  : Original input image path (str)
        detections  : List of dicts — each has 'class', 'confidence', 'bbox'
        verdict     : "Correct" or "Incorrect"
        output_path : Where the annotated image was saved
    """
    print(SEPARATOR)
    print(f"  Image  : {image_path}")
    print(f"  Verdict: {'Correct (Object Detected)' if verdict == 'Correct' else 'Incorrect (No Object Detected)'}")
    print()

    if detections:
        print(f"  {'#':<4} {'Class':<20} {'Confidence':>12}   Bounding Box [x1,y1,x2,y2]")
        print("  " + "-" * 60)
        for i, det in enumerate(detections, start=1):
            bbox_str = "[{x1}, {y1}, {x2}, {y2}]".format(**det["bbox"])
            print(f"  {i:<4} {det['class']:<20} {det['confidence']:>11.2%}   {bbox_str}")
    else:
        print("  No detections above confidence threshold.")

    print()
    print(f"  Annotated image saved → {output_path}")
    print(SEPARATOR + "\n")


# ══════════════════════════════════════════════════════════════════════════════
#  CORE: MODEL LOADER
# ══════════════════════════════════════════════════════════════════════════════

def load_model() -> YOLO:
    """
    Load the YOLOv8 model from best.pt.

    Returns:
        YOLO model instance

    Raises:
        SystemExit on failure so the user gets a clear message.
    """
    if not MODEL_PATH.exists():
        print(f"[ERROR] Model file not found: {MODEL_PATH}")
        print("        Ensure 'best.pt' is in the same folder as this script.")
        sys.exit(1)

    print(f"[INFO] Loading model from '{MODEL_PATH}' …", end=" ", flush=True)
    try:
        model = YOLO(str(MODEL_PATH))
        print("Done ✔")
        print(f"[INFO] Classes ({len(model.names)}): {', '.join(model.names.values())}\n")
        return model
    except Exception as exc:
        print()
        print(f"[ERROR] Failed to load model: {exc}")
        sys.exit(1)


# ══════════════════════════════════════════════════════════════════════════════
#  CORE: INFERENCE ON A SINGLE IMAGE
# ══════════════════════════════════════════════════════════════════════════════

def detect_image(model: YOLO, image_path: str) -> dict:
    """
    Run YOLOv8 inference on one image.

    Args:
        model      : Loaded YOLO model
        image_path : Path to the input image (str)

    Returns:
        dict with keys:
            verdict      – "Correct" | "Incorrect"
            detections   – list of detection dicts
            output_path  – path of the saved annotated image
    """
    # ── 1. Validate image path ─────────────────────────────────────────────────
    img_path = Path(image_path)
    if not img_path.exists():
        print(f"[ERROR] Image not found: '{image_path}'")
        return None

    valid_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}
    if img_path.suffix.lower() not in valid_extensions:
        print(f"[ERROR] Unsupported file type '{img_path.suffix}'. Supported: {valid_extensions}")
        return None

    # ── 2. Run YOLO inference ──────────────────────────────────────────────────
    print(f"[INFO] Running inference on '{img_path.name}' …", end=" ", flush=True)
    try:
        results = model.predict(
            source=str(img_path),
            conf=CONFIDENCE_THRESH,
            iou=IOU_THRESH,
            verbose=False          # suppress YOLO's own verbose output
        )
    except Exception as exc:
        print()
        print(f"[ERROR] Inference failed on '{image_path}': {exc}")
        return None

    print("Done ✔")

    result = results[0]   # Single-image result object

    # ── 3. Parse detections ────────────────────────────────────────────────────
    detections = []
    if result.boxes is not None and len(result.boxes) > 0:
        for box in result.boxes:
            class_id   = int(box.cls[0].item())
            class_name = model.names[class_id]
            confidence = float(box.conf[0].item())
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]

            detections.append({
                "class"     : class_name,
                "confidence": confidence,
                "bbox"      : {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
            })

    # Sort by confidence descending so the best detection is listed first
    detections.sort(key=lambda d: d["confidence"], reverse=True)

    # ── 4. Determine verdict ───────────────────────────────────────────────────
    verdict = "Correct" if len(detections) > 0 else "Incorrect"

    # ── 5. Save annotated image ────────────────────────────────────────────────
    output_path = save_annotated_image(result, img_path)

    return {
        "verdict"    : verdict,
        "detections" : detections,
        "output_path": str(output_path),
    }


# ══════════════════════════════════════════════════════════════════════════════
#  HELPER: SAVE ANNOTATED IMAGE
# ══════════════════════════════════════════════════════════════════════════════

def save_annotated_image(result, original_path: Path) -> Path:
    """
    Save the YOLO-annotated image (with bounding boxes) to outputs/.

    Args:
        result        : YOLO result object for the image
        original_path : Path object for the source image

    Returns:
        Path where the annotated image was saved
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Build a unique output filename: <stem>_detected_<timestamp>.jpg
    timestamp   = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_name = f"{original_path.stem}_detected_{timestamp}.jpg"
    output_path = OUTPUT_DIR / output_name

    # result.plot() returns an annotated BGR numpy array
    annotated_frame = result.plot()
    cv2.imwrite(str(output_path), annotated_frame)

    return output_path


# ══════════════════════════════════════════════════════════════════════════════
#  SUMMARY TABLE (multiple images)
# ══════════════════════════════════════════════════════════════════════════════

def print_summary(all_results: list):
    """
    Print a consolidated summary table when processing multiple images.

    Args:
        all_results: list of tuples (image_path, result_dict | None)
    """
    correct   = sum(1 for _, r in all_results if r and r["verdict"] == "Correct")
    incorrect = sum(1 for _, r in all_results if r and r["verdict"] == "Incorrect")
    errors    = sum(1 for _, r in all_results if r is None)

    print(SEPARATOR)
    print("  SUMMARY")
    print(SEPARATOR)
    print(f"  Total images processed : {len(all_results)}")
    print(f"  Correct (detected)  : {correct}")
    print(f"  Incorrect (empty)   : {incorrect}")
    if errors:
        print(f"  Errors / Skipped   : {errors}")
    print(SEPARATOR + "\n")


# ══════════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def get_image_paths() -> list:
    """
    Determine list of image paths from CLI arguments or interactive prompt.

    Returns:
        List of image path strings
    """
    # If arguments were provided, use them directly
    if len(sys.argv) > 1:
        # Filter out script name
        paths = sys.argv[1:]
        return paths

    # Otherwise prompt the user interactively
    print("Enter image path(s). You can enter one path, or multiple paths separated by commas.")
    print("Example: photo.jpg  OR  img1.jpg, img2.png, img3.bmp\n")
    raw = input("Image path(s): ").strip()

    if not raw:
        print("[ERROR] No image path provided. Exiting.")
        sys.exit(1)

    # Support comma or space separated paths
    if "," in raw:
        paths = [p.strip() for p in raw.split(",") if p.strip()]
    else:
        paths = raw.split()

    return paths


def main():
    print_header()

    # ── Load model once ────────────────────────────────────────────────────────
    model = load_model()

    # ── Collect image paths ────────────────────────────────────────────────────
    image_paths = get_image_paths()

    print(f"\n[INFO] Processing {len(image_paths)} image(s) …\n")

    # ── Run inference on each image ────────────────────────────────────────────
    all_results = []
    for img_path in image_paths:
        result = detect_image(model, img_path.strip())
        all_results.append((img_path, result))

        if result:
            print_result_block(
                image_path  = img_path,
                detections  = result["detections"],
                verdict     = result["verdict"],
                output_path = result["output_path"],
            )

    # ── Print summary (always shown, even for 1 image) ─────────────────────────
    print_summary(all_results)


if __name__ == "__main__":
    main()
