# tests/evaluate_global_models.py

import os
import sys
import torch
import numpy as np
import pandas as pd

from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

# -------------------------------------------------
# Add project root to Python path
# -------------------------------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from models.dass_mlp import DASSMLP
from utils.severity_mapping import (
    stress_severity,
    anxiety_severity,
    depression_severity,
)

# -------------------------------------------------
# Config
# -------------------------------------------------
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

MODEL_DIR = os.path.join(ROOT_DIR, "saved_models")
DATA_PATH = os.path.join(ROOT_DIR, "data", "DASS.csv")


# -------------------------------------------------
# Evaluation Function
# -------------------------------------------------
def evaluate_model(model_path, score_col, severity_fn, name):
    print(f"\n🔍 Evaluating {name} Model (20% Stratified Test Split)")
    print(f"Loading Model: {model_path}")

    # Load dataset
    df = pd.read_csv(DATA_PATH)

    # Feature columns (exclude all labels & scores)
    feature_cols = [
        col for col in df.columns
        if col not in [
            "Stress_Score", "Stress_Level",
            "Anxiety_Score", "Anxiety_Level",
            "Depression_Score", "Depression_Level"
        ]
    ]

    X = df[feature_cols].values.astype("float32")
    y_scores = df[score_col].values.astype("float32")

    # Convert scores → severity labels BEFORE split
    y_levels = np.array([severity_fn(score) for score in y_scores])

    # Stratified split to ensure all classes appear in test set
    _, X_test, _, y_test_scores, _, y_test_levels = train_test_split(
        X,
        y_scores,
        y_levels,
        test_size=0.20,
        stratify=y_levels,
        random_state=42
    )

    # Load trained global model
    model = DASSMLP(input_dim=X_test.shape[1]).to(DEVICE)
    model.load_state_dict(torch.load(model_path, map_location=DEVICE))
    model.eval()

    # -------------------------------
    # Vectorized inference (FAST)
    # -------------------------------
    with torch.no_grad():
        X_tensor = torch.tensor(X_test, device=DEVICE)
        pred_scores = model(X_tensor).cpu().numpy().flatten()

    # Convert predictions → severity labels
    y_true = y_test_levels.tolist()
    y_pred = [severity_fn(score) for score in pred_scores]

    # -------------------------------
    # Metrics
    # -------------------------------
    print(f"\n🎯 Accuracy: {accuracy_score(y_true, y_pred) * 100:.2f}%")

    print("\n📊 Classification Report:")
    print(classification_report(y_true, y_pred, zero_division=0))

    print("\n📌 Confusion Matrix:")
    print(confusion_matrix(y_true, y_pred))


# -------------------------------------------------
# Run Evaluation for All Models
# -------------------------------------------------
if __name__ == "__main__":
    evaluate_model(
        model_path=os.path.join(MODEL_DIR, "global_stress_model.pt"),
        score_col="Stress_Score",
        severity_fn=stress_severity,
        name="Stress"
    )

    evaluate_model(
        model_path=os.path.join(MODEL_DIR, "global_anxiety_model.pt"),
        score_col="Anxiety_Score",
        severity_fn=anxiety_severity,
        name="Anxiety"
    )

    evaluate_model(
        model_path=os.path.join(MODEL_DIR, "global_depression_model.pt"),
        score_col="Depression_Score",
        severity_fn=depression_severity,
        name="Depression"
    )
