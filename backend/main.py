import io
import json
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.agents.rag import index_dataset
from backend.agents.orchestrator import run_query

app = FastAPI(title="Patient Risk Insights Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store of the uploaded dataset (for cohort tool)
_dataset_cache: list[dict] = []


class QueryRequest(BaseModel):
    question: str
    history:  list[dict] = []


@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Accept a CSV upload, index it into ChromaDB, and cache it."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))

    required = {"Pregnancies","Glucose","BloodPressure","SkinThickness",
                "Insulin","BMI","DiabetesPedigreeFunction","Age"}
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")

    global _dataset_cache
    _dataset_cache = df.to_dict(orient="records")

    index_dataset(df)

    return {
        "message":  f"Dataset uploaded and indexed successfully.",
        "rows":     len(df),
        "columns":  list(df.columns),
        "preview":  df.head(3).to_dict(orient="records"),
    }


@app.post("/query")
async def query_agent(req: QueryRequest):
    """Send a natural language question to the agent."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Inject dataset context for cohort-level questions
    enriched_question = req.question
    if _dataset_cache and any(
        kw in req.question.lower()
        for kw in ["summarise", "summarize", "overview", "how many", "percent", "percentage",
                "cohort", "all patients", "entire dataset", "whole dataset"]
    ):
        sample = json.dumps(_dataset_cache[:10])
        enriched_question = f"{req.question}\n\n[Dataset JSON for cohort tool]: {sample}"

    answer = run_query(enriched_question, req.history)
    return {"answer": answer}


@app.get("/health")
def health():
    return {"status": "ok"}
