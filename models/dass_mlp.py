# models/dass_mlp.py

import torch
import torch.nn as nn
import torch.nn.functional as F


class DASSMLP(nn.Module):
    def __init__(
        self,
        input_dim: int = 27,
        hidden_dim1: int = 64,
        hidden_dim2: int = 32,
        output_dim: int = 1,  # regression: predict score
        dropout: float = 0.2,
    ):
        super().__init__()

        self.fc1 = nn.Linear(input_dim, hidden_dim1)
        self.fc2 = nn.Linear(hidden_dim1, hidden_dim2)
        self.out = nn.Linear(hidden_dim2, output_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.out(x)  # no activation (regression)
        return x
