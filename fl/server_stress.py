# fl/server.py  (STRESS)

import os
import sys
from collections import OrderedDict
from typing import List

import flwr as fl
import numpy as np
import torch
from torch import nn

# --- Ensure project root in sys.path ---
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from models.dass_mlp import DASSMLP
from utils.data_loader import load_dass_csv

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

NUM_ROUNDS = 20  # ✅ final training rounds


def get_parameters_from_model(model: torch.nn.Module) -> List[np.ndarray]:
    return [val.cpu().numpy() for _, val in model.state_dict().items()]


def set_parameters_to_model(model: torch.nn.Module, parameters: List[np.ndarray]) -> None:
    params_dict = zip(model.state_dict().keys(), parameters)
    state_dict = OrderedDict(
        (k, torch.tensor(v, dtype=model.state_dict()[k].dtype))
        for k, v in params_dict
    )
    model.load_state_dict(state_dict, strict=True)


def get_evaluate_fn(test_csv_path: str):
    """Centralized eval on full DASS.csv using Stress_Score, and save final model."""

    model = DASSMLP(input_dim=27).to(DEVICE)
    test_loader, _ = load_dass_csv(
        csv_path=test_csv_path,
        label_column="Stress_Score",
        batch_size=32,
        shuffle=False,
    )
    criterion = nn.MSELoss()

    def evaluate(server_round: int, parameters: List[np.ndarray], config):
        model.eval()
        set_parameters_to_model(model, parameters)

        mse_sum = 0.0
        n_samples = 0

        with torch.no_grad():
            for X_batch, y_batch in test_loader:
                X_batch = X_batch.to(DEVICE)
                y_batch = y_batch.to(DEVICE)

                outputs = model(X_batch)
                loss = criterion(outputs, y_batch)

                batch_size = X_batch.size(0)
                mse_sum += loss.item() * batch_size
                n_samples += batch_size

        mse = mse_sum / n_samples if n_samples > 0 else 0.0
        print(f"[Server-Stress] Round {server_round} - Eval MSE: {mse:.4f}")

        # 👉 On the final round, save the global model
        if server_round == NUM_ROUNDS:
            save_dir = os.path.join(ROOT_DIR, "saved_models")
            os.makedirs(save_dir, exist_ok=True)
            save_path = os.path.join(save_dir, "global_stress_model.pt")
            torch.save(model.state_dict(), save_path)
            print(f"[Server-Stress] Saved global model to: {save_path}")

        return float(mse), {"mse": float(mse)}

    return evaluate


def main():
    NUM_CLIENTS = 4  # adjust if you change number of clients

    strategy = fl.server.strategy.FedAvg(
        fraction_fit=1.0,
        fraction_evaluate=0.0,
        min_fit_clients=NUM_CLIENTS,
        min_available_clients=NUM_CLIENTS,
        evaluate_fn=get_evaluate_fn(test_csv_path=os.path.join(ROOT_DIR, "data", "DASS.csv")),
    )

    fl.server.start_server(
        server_address="127.0.0.1:8080",
        config=fl.server.ServerConfig(num_rounds=NUM_ROUNDS),
        strategy=strategy,
    )


if __name__ == "__main__":
    main()
