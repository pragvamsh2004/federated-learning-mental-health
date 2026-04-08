# utils/data_loader.py

import pandas as pd
import torch
from torch.utils.data import TensorDataset, DataLoader
from typing import List, Tuple


# ✅ Final, verified feature list (27 features)
FEATURE_COLUMNS: List[str] = [
    # Demographics
    "Q1_1", "Q1_2", "Q1_3", "Q1_4", "Q1_5", "Q1_6",
    # Stress items (7)
    "Q3_1_S1", "Q3_2_S2", "Q3_3_S3", "Q3_4_S4", "Q3_5_S5", "Q3_6_S6", "Q3_7_S7",
    # Anxiety items (7)
    "Q3_8_A1", "Q3_9_A2", "Q3_10_A3", "Q3_11_A4", "Q3_12_A5", "Q3_13_A6", "Q3_14_A7",
    # Depression items (7)
    "Q3_15_D1", "Q3_16_D2", "Q3_17_D3", "Q3_18_D4", "Q3_19_D5", "Q3_20_D6", "Q3_21_D7",
]


def load_dass_csv(
    csv_path: str,
    label_column: str,
    batch_size: int = 32,
    shuffle: bool = True,
) -> Tuple[DataLoader, int]:
    """
    Load DASS dataset from `csv_path` and return a DataLoader and input_dim.

    - Uses FEATURE_COLUMNS as inputs (27 features)
    - Uses `label_column` as target (e.g. "Stress_Score")
    - Scales Age (Q1_1) to 0–1 by dividing by max age in that file
    - Drops rows with NaNs
    """
    df = pd.read_csv(csv_path)

    required_columns = FEATURE_COLUMNS + [label_column]
    missing = [c for c in required_columns if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in {csv_path}: {missing}")

    df = df[required_columns].dropna()

    # ✅ Option A: scale only Age (Q1_1) by its max in the file
    age_max = df["Q1_1"].max()
    if age_max and age_max > 0:
        df["Q1_1"] = df["Q1_1"] / age_max

    # Features
    X = df[FEATURE_COLUMNS].astype("float32").values

    # For now we treat labels as regression targets (predict numeric score)
    y = pd.to_numeric(df[label_column], errors="raise").astype("float32").values

    X_tensor = torch.tensor(X, dtype=torch.float32)
    y_tensor = torch.tensor(y, dtype=torch.float32).view(-1, 1)  # (N, 1) for regression

    dataset = TensorDataset(X_tensor, y_tensor)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)
    input_dim = X.shape[1]

    return loader, input_dim
