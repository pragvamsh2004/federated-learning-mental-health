import pandas as pd
import numpy as np
from typing import Tuple, Dict

LABEL_COLUMNS = [
    "Stress_Level",
    "Anxiety_Level",
    "Depression_Level"
]

SCORE_COLUMNS = [
    "Stress_Score",
    "Anxiety_Score",
    "Depression_Score"
]


def load_and_preprocess(csv_path: str) -> Tuple[np.ndarray, Dict[str, np.ndarray]]:
    """
    Loads dataset and returns:
      X: features normalized to [0,1]
      y_dict: dict with 3 targets encoded 0–4
         keys: "stress", "anxiety", "depression"
    """
    df = pd.read_csv(csv_path)

    # Remove score columns (not needed)
    if set(SCORE_COLUMNS).issubset(df.columns):
        df = df.drop(columns=SCORE_COLUMNS)

    # Extract and encode labels
    y_stress = df["Stress_Level"].astype(int) - 1
    y_anxiety = df["Anxiety_Level"].astype(int) - 1
    y_depr = df["Depression_Level"].astype(int) - 1

    # Remove label columns from feature set
    df = df.drop(columns=LABEL_COLUMNS)

    # Convert to float and apply min-max normalization
    X = df.astype(float).to_numpy()
    X = (X - X.min()) / (X.max() - X.min())

    y_dict = {
        "stress": y_stress.to_numpy(dtype=np.int64),
        "anxiety": y_anxiety.to_numpy(dtype=np.int64),
        "depression": y_depr.to_numpy(dtype=np.int64)
    }

    return X, y_dict


if __name__ == "__main__":
    X, y_dict = load_and_preprocess("data/DASS.csv")
    print("Feature shape:", X.shape)
    print("Unique Stress labels:", np.unique(y_dict["stress"]))
    print("Unique Anxiety labels:", np.unique(y_dict["anxiety"]))
    print("Unique Depression labels:", np.unique(y_dict["depression"]))
