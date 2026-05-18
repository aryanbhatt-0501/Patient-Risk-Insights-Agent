import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/diabetes.csv")
MODEL_DIR = os.path.dirname(__file__)

def train():
    df = pd.read_csv(DATA_PATH)
    X = df.drop(columns=["Outcome"])
    y = df["Outcome"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    models = {
        "logistic_regression": LogisticRegression(max_iter=1000, random_state=42),
        "knn":                 KNeighborsClassifier(n_neighbors=5),
        "mlp":                 MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42),
    }

    for name, model in models.items():
        model.fit(X_train_scaled, y_train)
        acc = model.score(X_test_scaled, y_test)
        joblib.dump(model, os.path.join(MODEL_DIR, f"{name}.pkl"))
        print(f"{name}: accuracy = {acc:.4f}  -> saved")

    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
    joblib.dump(list(X.columns), os.path.join(MODEL_DIR, "feature_names.pkl"))
    print("Scaler and feature names saved.")

if __name__ == "__main__":
    train()
