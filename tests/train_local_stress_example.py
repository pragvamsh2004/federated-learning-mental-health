# tests/train_local_stress_example.py

import os
import sys
import torch
from torch import nn, optim

# Ensure project root is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
sys.path.append(ROOT_DIR)

from utils.data_loader import load_dass_csv
from models.dass_mlp import DASSMLP


def train_local_stress(
    csv_path: str = "data/DASS.csv",
    epochs: int = 20,
    batch_size: int = 32,
    lr: float = 1e-3,
):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load data
    train_loader, input_dim = load_dass_csv(
        csv_path=csv_path,
        label_column="Stress_Score",
        batch_size=batch_size,
        shuffle=True,
    )
    print(f"Detected input_dim = {input_dim}")

    # Model, loss, optimizer
    model = DASSMLP(input_dim=input_dim).to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)

    model.train()
    for epoch in range(1, epochs + 1):
        epoch_loss = 0.0
        for X_batch, y_batch in train_loader:
            X_batch = X_batch.to(device)
            y_batch = y_batch.to(device)

            optimizer.zero_grad()
            outputs = model(X_batch)
            loss = criterion(outputs, y_batch)
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item() * X_batch.size(0)

        avg_loss = epoch_loss / len(train_loader.dataset)
        print(f"Epoch {epoch}/{epochs} - Train MSE: {avg_loss:.4f}")

    # Save modelx
    save_dir = os.path.join(ROOT_DIR, "saved_models")
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, "local_stress_model.pt")
    torch.save(model.state_dict(), save_path)
    print(f"Saved local stress model to: {save_path}")


if __name__ == "__main__":
    train_local_stress()
