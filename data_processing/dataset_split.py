import pandas as pd
import os

INPUT_PATH = "data/DASS.csv"

def main():
    os.makedirs("data", exist_ok=True)
    df = pd.read_csv(INPUT_PATH)

    # Shuffle rows
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    n = len(df)
    # Imbalanced sizes (approx): 700, 500, 350, rest
    sizes = [700, 500, 350]
    sizes.append(n - sum(sizes))  # remaining

    print("Total rows:", n)
    print("Client sizes:", sizes)

    start = 0
    for i, sz in enumerate(sizes, start=1):
        end = start + sz
        client_df = df.iloc[start:end]
        out_path = f"data/client_{i}.csv"
        client_df.to_csv(out_path, index=False)
        print(f"Saved {len(client_df)} rows to {out_path}")
        start = end


if __name__ == "__main__":
    main()
