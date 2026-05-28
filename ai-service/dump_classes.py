from ultralytics import YOLO
import json

try:
    model = YOLO("best.pt")
    with open("classes.json", "w") as f:
        json.dump(model.names, f)
except Exception as e:
    pass
