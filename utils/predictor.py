# utils/predictor.py

import os
import sys
from typing import Dict, Any

import torch
import numpy as np

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
from utils.data_loader import FEATURE_COLUMNS  # same 27 feature names

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class DASSFederatedPredictor:
    def __init__(self, model_dir: str):
        self.model_dir = model_dir

        # Load models
        self.stress_model = self._load_model("global_stress_model.pt")
        self.anxiety_model = self._load_model("global_anxiety_model.pt")
        self.depression_model = self._load_model("global_depression_model.pt")

    def _load_model(self, filename: str) -> torch.nn.Module:
        path = os.path.join(self.model_dir, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")

        model = DASSMLP(input_dim=len(FEATURE_COLUMNS)).to(DEVICE)
        state_dict = torch.load(path, map_location=DEVICE)
        model.load_state_dict(state_dict)
        model.eval()
        return model

    def _prepare_input(self, features: Dict[str, float]) -> torch.Tensor:
        """
        Convert incoming dict into a feature vector in the correct column order.
        NOTE: We follow the same preprocessing style used in evaluation (no extra scaling).
        """
        missing = [c for c in FEATURE_COLUMNS if c not in features]
        if missing:
            raise ValueError(f"Missing required features: {missing}")

        x = np.array([features[col] for col in FEATURE_COLUMNS], dtype=np.float32)
        x = torch.tensor([x], device=DEVICE)  # shape (1, 27)
        return x

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        features: dict with keys = FEATURE_COLUMNS, values = numeric answers.
        Returns scores + severity levels for Stress, Anxiety, Depression.
        """
        x = self._prepare_input(features)

        with torch.no_grad():
            # 🔹 Raw model outputs (0–21 range)
            stress_raw = float(self.stress_model(x).cpu().numpy()[0][0])
            anxiety_raw = float(self.anxiety_model(x).cpu().numpy()[0][0])
            depression_raw = float(self.depression_model(x).cpu().numpy()[0][0])

        # 🔥 Scale to DASS-21 standard (0–42)
        stress_score = round(stress_raw * 2, 2)
        anxiety_score = round(anxiety_raw * 2, 2)
        depression_score = round(depression_raw * 2, 2)

        # 🔹 Map to severity categories (now correct scale)
        stress_level = stress_severity(stress_score)
        anxiety_level = anxiety_severity(anxiety_score)
        depression_level = depression_severity(depression_score)

        return {
            "stress": {
                "score": stress_score,
                "level": stress_level,
            },
            "anxiety": {
                "score": anxiety_score,
                "level": anxiety_level,
            },
            "depression": {
                "score": depression_score,
                "level": depression_level,
            },
    }
