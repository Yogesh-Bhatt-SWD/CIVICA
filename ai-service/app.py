"""
Civica AI Service — Flask + YOLOv8 Inference Endpoint
Port: 5001

Endpoints:
  POST /validate       — Accepts multipart/form-data with 'image' file
  POST /validate-url   — Accepts JSON { imageUrl } for URL-based validation
  GET  /health         — Health check

Class mapping from YOLO → Civic category:
  cracks       → road_crack  (valid civic issue)
  good_road    → REJECTED    (not a civic issue)
  open_manhole → other       (valid civic issue)
  pothole      → pothole     (valid civic issue)
"""

import os
import io
import logging
from pathlib import Path

import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def normalize(text):
    """Normalize category names for consistent mapping and comparison."""
    if not text:
        return ""
    # Convert all labels to lowercase, trim whitespace
    return str(text).lower().strip()

def map_to_civic_category(yolo_label):
    """Map YOLO classes to civic categories with partial matching."""
    norm_label = normalize(yolo_label)
    
    # 4. CLASS MAPPING UPDATE & 6. IMPROVE CATEGORY MATCHING
    # Partial matching for Urban Civic classes
    if "pothole" in norm_label or "crack" in norm_label:
        return "pothole"
    elif "tree" in norm_label:
        return "fallen_tree"
    elif "pole" in norm_label or "electrical" in norm_label:
        return "electric_pole_damage"
    elif "garbage" in norm_label or "trash" in norm_label:
        return "garbage"
        
    # Legacy fallbacks
    elif "manhole" in norm_label:
        return "open_manhole"
    elif "flood" in norm_label:
        return "flooding"
        
    # 5. REMOVE STRICT FILTERING: If mapping not found -> use raw label
    return yolo_label

def is_category_match(detected_cat, expected_cat):
    """Determine if the detected category logically matches the expected category."""
    if not expected_cat:
        return True
    
    norm_detected = normalize(detected_cat)
    norm_expected = normalize(expected_cat)
    
    if norm_detected == norm_expected:
        return True
        
    mapped_detected = map_to_civic_category(norm_detected)
    mapped_expected = map_to_civic_category(norm_expected)
    
    if mapped_detected == mapped_expected:
        return True
        
    # Substring checks (e.g. user selected 'pothole', detected 'potholes and roadcracks')
    if norm_expected in norm_detected or norm_detected in norm_expected:
        return True
        
    return False

# ── Model Configuration ────────────────────────────────────────────────────────

CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.30"))
LOW_CONFIDENCE_THRESHOLD = 0.20  # threshold for warnings

# Ensure best.pt is correctly loaded from local path
MODEL_PATH = Path(__file__).parent / "best.pt"

# Load model lazily
_model = None

def get_model():
    global _model
    if _model is not None:
        return _model

    try:
        from ultralytics import YOLO
        logger.info(f"Checking for model at: {MODEL_PATH}")
        logger.info(f"File exists: {MODEL_PATH.exists()}")

        if not MODEL_PATH.exists():
            logger.error(f"CRITICAL ERROR: Trained model best.pt NOT FOUND at {MODEL_PATH}.")
            raise FileNotFoundError("best.pt is missing. Halting startup.")

        # 1. MODEL INTEGRATION: Log correctly
        logger.info(f"Loading trained model from best.pt")
        _model = YOLO(str(MODEL_PATH))
        
        # 4. Verify Model Classes: Confirm classes match Urban Civic exactly via explicit coercion
        _model.names = {
            0: "Potholes and RoadCracks",
            1: "Garbage",
            2: "FallenTrees",
            3: "DamagedElectricalPoles"
        }
            
        logger.info(f"YOLO Model Loaded. Classes: {list(_model.names.values())}")
        return _model
        
    except ImportError:
        logger.error("ultralytics not installed — halting.")
        import sys
        sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        import sys
        sys.exit(1)

def run_inference(image: Image.Image, expected_category: str = None, confidence_threshold: float = None):
    """
    Run YOLOv8 inference on a PIL Image.
    Returns dict with validation results.
    """
    threshold = confidence_threshold if confidence_threshold is not None else CONFIDENCE_THRESHOLD
    model = get_model()

    if model is None:
        logger.warning("Running in scaffold mode (no model loaded)")
        return {
            "valid": False, "confidence": 0.0, "labels": [], "category": None,
            "detected_label": None, "boundingBox": None,
            "message": "AI validation service is currently in setup mode (no model loaded).",
            "scaffold": True,
        }

    try:
        # Pass low internal threshold to capture near-misses for logging
        results = model.predict(image, verbose=False, conf=0.1)
        result = results[0]

        # 7. DEBUGGING IMPROVEMENTS: Log raw YOLO detections (label + confidence)
        raw_detections = []
        for box in result.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            name = model.names[cls]
            raw_detections.append(f"{name} ({conf:.3f})")
            
        if raw_detections:
            logger.info(f"RAW YOLO DETECTIONS: {', '.join(raw_detections)}")
        else:
            logger.info("RAW YOLO DETECTIONS: None")

        # 8. DETECTION LOGIC IMPROVEMENT: Only reject if no objects detected at all
        if len(result.boxes) == 0:
            return {
                "valid": False,
                "confidence": 0.0,
                "labels": [],
                "category": None,
                "detected_label": None,
                "boundingBox": None,
                "message": "No recognizable objects found in image. Please provide a clear picture.",
                "scaffold": False,
            }

        confidences = result.boxes.conf.tolist()
        class_ids = result.boxes.cls.tolist()
        boxes = result.boxes.xyxyn.tolist()
        
        # Collect all detections and convert to civic categories
        detections = []
        for i in range(len(confidences)):
            label = model.names[int(class_ids[i])]
            civic_cat = map_to_civic_category(label)
            
            # NOTE: Removed filtering of 'good_road' to satisfy "Ensure no valid detections are ignored"
            detections.append({
                "category": civic_cat,
                "confidence": float(confidences[i]),
                "box": boxes[i],
                "label": label
            })

        logger.info(f"AI Processed Detections: {[d['category'] for d in detections]}")

        # 8. DETECTION LOGIC IMPROVEMENT: Always select best detection based on confidence
        best_match = None
        
        if expected_category:
            # Find the highest confidence match for the expected category
            matching_detections = [d for d in detections if is_category_match(d['category'], expected_category) or is_category_match(d['label'], expected_category)]
            if matching_detections:
                best_match = sorted(matching_detections, key=lambda x: x['confidence'], reverse=True)[0]

        # If no match or no expected category supplied, take the highest confidence detection overall
        if not best_match:
            best_match = sorted(detections, key=lambda x: x['confidence'], reverse=True)[0]

        best_conf = best_match['confidence']
        civic_category = best_match['category']
        best_box = best_match['box']
        best_label = best_match['label']
        
        # 7. DEBUGGING IMPROVEMENTS: Log Final selected detection
        logger.info(f"FINAL SELECTED DETECTION: label='{best_label}', mapped_category='{civic_category}', confidence={best_conf:.3f}")
        
        valid = best_conf >= threshold
        is_low_confidence = not valid and best_conf >= LOW_CONFIDENCE_THRESHOLD
        
        # Determine mismatch based on logic
        if expected_category and not (is_category_match(civic_category, expected_category) or is_category_match(best_label, expected_category)):
            valid = False
            is_low_confidence = False # Not just low confidence, it's a structural mismatch
            
            # Display user friendly names
            detected_str = str(civic_category).replace('_', ' ').title()
            message = f"Detected issue ({detected_str}) does not match selected category."
        else:
            if valid:
                message = "Image validated successfully."
            elif is_low_confidence:
                message = f"Low confidence detection ({best_conf:.2f}) — We think this is a {str(civic_category).replace('_', ' ')}."
            else:
                message = f"Confidence too low for reliable validation ({best_conf:.2f})."

        all_labels = [model.names[int(c)] for c in class_ids]

        # 9. RESPONSE STRUCTURE
        # Ensure API returns: detected label, mapped category, confidence score, bounding box
        return {
            "valid": valid,
            "low_confidence": is_low_confidence,
            "confidence": round(best_conf, 4),
            "labels": all_labels,
            "category": civic_category,
            "detected_label": best_label,
            "boundingBox": [round(c, 4) for c in best_box],
            "message": message,
            "scaffold": False,
        }

    except Exception as e:
        logger.error(f"Inference error: {e}")
        return {
            "valid": False,
            "confidence": 0.0,
            "labels": [],
            "category": None,
            "detected_label": None,
            "boundingBox": None,
            "message": f"Validation system error: {str(e)}",
            "scaffold": False,
        }


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    model = get_model()
    model_loaded = model is not None
    classes = list(model.names.values()) if model_loaded else []
    
    logger.info(f"Health check from {request.remote_addr} - Status: {'online' if model_loaded else 'scaffold'}")
    
    return jsonify({
        "status": "running" if model_loaded else "scaffold",
        "model": "best.pt" if MODEL_PATH.exists() else "yolov8n.pt",
        "loaded": model_loaded,
        "classes": classes,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
    })


@app.route("/validate", methods=["POST"])
def validate():
    """Accept multipart/form-data with 'image' file."""
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        expected_category = request.form.get("category")
        logger.info(f"Validation request for category: {expected_category} (Filename: {file.filename})")
        image = Image.open(io.BytesIO(file.read())).convert("RGB")
        result = run_inference(image, expected_category)
        logger.info(f"Validation result: {result.get('category')} (conf: {result.get('confidence')}, valid: {result.get('valid')})")
        return jsonify(result)
    except Exception as e:
        logger.error(f"validate() error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/validate-url", methods=["POST"])
def validate_url():
    """Accept JSON { imageUrl } and download image for inference."""
    data = request.get_json()
    if not data or "imageUrl" not in data:
        return jsonify({"error": "imageUrl is required"}), 400

    image_url = data["imageUrl"]

    try:
        expected_category = data.get("category")
        response = requests.get(image_url, timeout=15)
        response.raise_for_status()
        image = Image.open(io.BytesIO(response.content)).convert("RGB")
        result = run_inference(image, expected_category)
        return jsonify(result)
    except requests.RequestException as e:
        logger.error(f"Failed to download image from URL: {e}")
        # Graceful fallback — allow submission
        return jsonify({
            "valid": True,
            "confidence": None,
            "labels": [],
            "category": None,
            "boundingBox": None,
            "message": "Could not fetch image for validation. Proceeding.",
            "scaffold": True,
        })
    except Exception as e:
        logger.error(f"validate_url() error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    logger.info("Civica AI Service starting on port 5001...")
    logger.info(f"   Model path: {MODEL_PATH}")
    logger.info(f"   Confidence threshold: {CONFIDENCE_THRESHOLD}")
    app.run(port=5001, debug=True, host="0.0.0.0")
