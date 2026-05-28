"""
Civica AI Service — YOLOv8 Training Script
Run this script once to train the model on the civic issue dataset.

Usage:
    python train.py

Output: models/best.pt (auto-selected by ultralytics)
"""

import os
from pathlib import Path

def train():
    try:
        from ultralytics import YOLO

        # Dataset YAML path
        dataset_yaml = Path(__file__).parent / "dataset.yaml"
        if not dataset_yaml.exists():
            print(f"dataset.yaml not found at {dataset_yaml}")
            return

        # Output model directory
        models_dir = Path(__file__).parent / "models"
        models_dir.mkdir(exist_ok=True)

        print("Starting YOLOv8 training on Civica dataset...")
        print(f"   Dataset: {dataset_yaml}")
        print(f"   Output:  {models_dir}")

        # Load base YOLOv8 nano model (fast training)
        model = YOLO("yolov8n.pt")

        # Train
        results = model.train(
            data=str(dataset_yaml),
            epochs=100,
            imgsz=640,
            batch=16,
            name="civica_yolov8",
            project=str(models_dir),
            patience=20,        # Early stopping
            save=True,
            pretrained=True,
            optimizer="AdamW",
            lr0=0.001,
            augment=True,
            mosaic=1.0,         # Mix images for scale invariance
            mixup=0.1,          # Blend images for robustness
            workers=4,
            verbose=True,
        )

        print(f"\n Training complete!")
        print(f"   Best model: {models_dir}/civica_yolov8/weights/best.pt")
        print(f"   Copy best.pt to {Path(__file__).parent}/best.pt for the Flask service to use.")

        # Copy best.pt to root of ai-service for easy access
        import shutil
        best_src = models_dir / "civica_yolov8" / "weights" / "best.pt"
        best_dst = Path(__file__).parent / "best.pt"
        if best_src.exists():
            shutil.copy(best_src, best_dst)
            print(f"    Copied best.pt to {best_dst}")

    except ImportError:
        print(" ultralytics not installed. Run: pip install ultralytics")
    except Exception as e:
        print(f" Training failed: {e}")
        raise

if __name__ == "__main__":
    train()
