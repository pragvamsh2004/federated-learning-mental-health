# fl/client_depression.py

import os
import sys
from collections import OrderedDict
from typing import List

import argparse
import flwr as fl
import numpy as np
import torch
from torch import nn, optim

# --- Ensure project root in sys.path ---
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from models.dass_mlp import DASSMLP
from utils.data_loader import load_dass_csv

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def get_parameters_from_model(model: torch.nn.Module) -> List[np.ndarray]:
    return [val.cpu().numpy() for _, val in model.state_dict().items()]


def set_parameters_to_model(model: torch.nn.Module, parameters: List[np.ndarray]) -> None:
    params_dict = zip(model.state_dict().keys(), parameters)
    state_dict = OrderedDict(
        (k, torch.tensor(v, dtype=model.state_dict()[k].dtype))
        for k, v in params_dict
    )
    model.load_state_dict(state_dict, strict=True)


class DepressionClient(fl.client.NumPyClient):
    def __init__(self, cid: str, csv_path: str):
        self.cid = cid
        print(f"[Depression-Client {cid}] Using data file: {csv_path}")

        self.train_loader, input_dim = load_dass_csv(
            csv_path=csv_path,
            label_column="Depression_Score",
            batch_size=32,
            shuffle=True,
        )
        print(f"[Depression-Client {cid}] Detected input_dim = {input_dim}")

        self.model = DASSMLP(input_dim=input_dim).to(DEVICE)
        self.criterion = nn.MSELoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=1e-3)

    def get_parameters(self, config):
        return get_parameters_from_model(self.model)

    def fit(self, parameters, config):
        set_parameters_to_model(self.model, parameters)

        self.model.train()
        local_epochs = int(config.get("local_epochs", 3))

        for epoch in range(local_epochs):
            epoch_loss = 0.0
            n_samples = 0

            for X_batch, y_batch in self.train_loader:
                X_batch = X_batch.to(DEVICE)
                y_batch = y_batch.to(DEVICE)

                self.optimizer.zero_grad()
                outputs = self.model(X_batch)
                loss = self.criterion(outputs, y_batch)
                loss.backward()
                self.optimizer.step()

                batch_size = X_batch.size(0)
                epoch_loss += loss.item() * batch_size
                n_samples += batch_size

            avg_loss = epoch_loss / n_samples if n_samples > 0 else 0.0
            print(f"[Depression-Client {self.cid}] Epoch {epoch+1}/{local_epochs} - Local MSE: {avg_loss:.4f}")

        return get_parameters_from_model(self.model), n_samples, {}

    def evaluate(self, parameters, config):
        set_parameters_to_model(self.model, parameters)
        self.model.eval()

        mse_sum = 0.0
        n_samples = 0

        with torch.no_grad():
            for X_batch, y_batch in self.train_loader:
                X_batch = X_batch.to(DEVICE)
                y_batch = y_batch.to(DEVICE)

                outputs = self.model(X_batch)
                loss = self.criterion(outputs, y_batch)

                batch_size = X_batch.size(0)
                mse_sum += loss.item() * batch_size
                n_samples += batch_size

        mse = mse_sum / n_samples if n_samples > 0 else 0.0
        print(f"[Depression-Client {self.cid}] Eval MSE: {mse:.4f}")
        return float(mse), n_samples, {"mse": float(mse)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cid", type=str, required=True, help="Client ID (e.g., 1, 2, 3, 4)")
    args = parser.parse_args()

    cid = args.cid
    csv_path = os.path.join(ROOT_DIR, "data", f"client_{cid}.csv")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV for client {cid} not found at: {csv_path}")

    client = DepressionClient(cid=cid, csv_path=csv_path)
    fl.client.start_numpy_client(server_address="127.0.0.1:8080", client=client)


if __name__ == "__main__":
    main()
