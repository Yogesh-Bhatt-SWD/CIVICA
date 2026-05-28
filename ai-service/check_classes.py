from ultralytics import YOLO
import sys

try:
    model = YOLO("best.pt")
    print("Classes in best.pt:", model.names)
except Exception as e:
    print("Error loading:", e)
