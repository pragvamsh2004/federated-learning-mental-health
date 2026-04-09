# backend/app.py

import os
import sys
from typing import Dict

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from utils.predictor import DASSFederatedPredictor
from utils.data_loader import FEATURE_COLUMNS

app = FastAPI(
    title="Federated DASS-21 Mental Health API",
    description="Backend API for stress, anxiety, and depression prediction using federated models.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ GLOBAL VARIABLE
predictor = None
MODEL_DIR = os.path.join(ROOT_DIR, "saved_models")


# ✅ LOAD MODEL SAFELY AT STARTUP
@app.on_event("startup")
def load_model():
    global predictor
    try:
        predictor = DASSFederatedPredictor(MODEL_DIR)
        print("✅ Models loaded successfully")
    except Exception as e:
        print("❌ Error loading models:", e)


class DASSInput(BaseModel):
    Q1_1: float
    Q1_2: float
    Q1_3: float
    Q1_4: float
    Q1_5: float
    Q1_6: float

    Q3_1_S1: float
    Q3_2_S2: float
    Q3_3_S3: float
    Q3_4_S4: float
    Q3_5_S5: float
    Q3_6_S6: float
    Q3_7_S7: float

    Q3_8_A1: float
    Q3_9_A2: float
    Q3_10_A3: float
    Q3_11_A4: float
    Q3_12_A5: float
    Q3_13_A6: float
    Q3_14_A7: float

    Q3_15_D1: float
    Q3_16_D2: float
    Q3_17_D3: float
    Q3_18_D4: float
    Q3_19_D5: float
    Q3_20_D6: float
    Q3_21_D7: float


@app.get("/")
def root():
    return {
        "message": "Federated DASS-21 Mental Health API is running.",
        "endpoints": ["/predict"],
    }


@app.post("/predict")
def predict_dass(input_data: DASSInput) -> Dict:
    if predictor is None:
        return {"error": "Model not loaded"}

    features = input_data.dict()
    result = predictor.predict(features)

    return {
        "input": features,
        "prediction": result,
    }