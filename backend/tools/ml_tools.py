import os
import json
import joblib
import numpy as np
import pandas as pd
from langchain_core.tools import tool

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../models")

def _load(name):
    return joblib.load(os.path.join(MODEL_DIR, f"{name}.pkl"))

def _predict(model_name: str, patient: dict) -> dict:
    scaler        = _load("scaler")
    feature_names = _load("feature_names")
    model         = _load(model_name)

    row = pd.DataFrame([{f: patient.get(f, 0) for f in feature_names}])
    row_scaled = scaler.transform(row)

    prob        = model.predict_proba(row_scaled)[0][1]
    prediction  = int(model.predict(row_scaled)[0])

    # Feature importance / contribution
    contributions = {}
    if hasattr(model, "coef_"):
        coef = model.coef_[0]
        for fname, val, c in zip(feature_names, row_scaled[0], coef):
            contributions[fname] = round(float(val * c), 4)
    else:
        # For KNN/MLP use raw feature values as proxy
        for fname, val in zip(feature_names, row.values[0]):
            contributions[fname] = round(float(val), 4)

    top_factors = sorted(contributions, key=lambda k: abs(contributions[k]), reverse=True)[:3]

    return {
        "model":       model_name,
        "prediction":  prediction,
        "risk_score":  round(float(prob), 4),
        "risk_level":  "High" if prob >= 0.6 else "Medium" if prob >= 0.4 else "Low",
        "top_factors": top_factors,
        "all_contributions": contributions,
    }


@tool
def compute_risk_logistic(patient_data_json: str) -> str:
    """
    Compute diabetes risk using Logistic Regression.
    Input: JSON string of patient features
    (Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI,
     DiabetesPedigreeFunction, Age).
    Returns risk score, prediction, and top contributing factors.
    """
    patient = json.loads(patient_data_json)
    result  = _predict("logistic_regression", patient)
    return json.dumps(result)


@tool
def compute_risk_knn(patient_data_json: str) -> str:
    """
    Compute diabetes risk using K-Nearest Neighbours (KNN).
    Input: JSON string of patient features
    (Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI,
     DiabetesPedigreeFunction, Age).
    Returns risk score, prediction, and top contributing factors.
    """
    patient = json.loads(patient_data_json)
    result  = _predict("knn", patient)
    return json.dumps(result)


@tool
def compute_risk_mlp(patient_data_json: str) -> str:
    """
    Compute diabetes risk using a Multi-Layer Perceptron neural network.
    Input: JSON string of patient features
    (Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI,
     DiabetesPedigreeFunction, Age).
    Returns risk score, prediction, and top contributing factors.
    """
    patient = json.loads(patient_data_json)
    result  = _predict("mlp", patient)
    return json.dumps(result)


@tool
def summarise_cohort(dataset_json: str) -> str:
    """
    Summarise a patient cohort dataset.
    Input: JSON string of records (list of dicts).
    Returns cohort statistics: size, diabetic %, average values per feature,
    and high-risk count from Logistic Regression.
    """
    records = json.loads(dataset_json)
    df      = pd.DataFrame(records)

    stats = {
        "total_patients": len(df),
        "feature_averages": df.describe().loc["mean"].round(2).to_dict(),
    }

    if "Outcome" in df.columns:
        stats["diabetic_percent"] = round(df["Outcome"].mean() * 100, 1)

    # Run LR on all patients for high-risk count
    scaler        = _load("scaler")
    feature_names = _load("feature_names")
    model         = _load("logistic_regression")

    cols    = [f for f in feature_names if f in df.columns]
    X       = df[cols].fillna(0)
    X_sc    = scaler.transform(X)
    probs   = model.predict_proba(X_sc)[:, 1]
    stats["high_risk_count"]   = int((probs >= 0.6).sum())
    stats["high_risk_percent"] = round(float((probs >= 0.6).mean() * 100), 1)

    return json.dumps(stats)
