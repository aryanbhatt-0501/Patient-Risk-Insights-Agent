# Patient Risk Insights Agent

An agentic AI system that lets clinicians and analysts upload patient datasets and ask natural language questions about diabetes risk. Combines **LangChain + LangGraph** orchestration, **RAG-based retrieval**, and **classical ML models** (Logistic Regression, KNN, MLP) as callable tools — all served through a **FastAPI** backend and **Next.js** frontend.

> **Demo:** <img width="800" height="433" alt="demo" src="https://github.com/user-attachments/assets/3bee3d44-07c1-4437-997d-ee5679c15cb7" />

<img width="803" height="451" alt="image" src="https://github.com/user-attachments/assets/a8b9e14d-16db-4b52-a00b-29aeb84b0eec" />

---

## 🧠 How It Works

```
User question
      ↓
RAG layer — embeds question, retrieves relevant patient records from ChromaDB
      ↓
LLM Agent (LangGraph) — reads question + context, decides which ML tool to call
      ↓
ML Tool — runs scikit-learn model, returns risk score + top contributing factors
      ↓
LLM generates grounded, explainable clinical response
      ↓
Next.js UI displays the answer
```

No hallucinated numbers — every risk score comes from a real ML model running on real data.

---

## Project Structure

```
patient-risk-insights-agent/
├── backend/
│   ├── agents/
│   │   ├── orchestrator.py     # LangGraph agent + LangChain tool binding
│   │   └── rag.py              # ChromaDB vector store + retrieval pipeline
│   ├── tools/
│   │   └── ml_tools.py         # LR, KNN, MLP exposed as LangChain tools
│   ├── models/
│   │   └── train.py            # Train & save ML models
│   ├── data/
│   │   └── sample_patients.csv # Sample dataset to test with
│   └── main.py                 # FastAPI server
├── frontend/
│   └── app/
│       └── page.tsx            # Next.js chat UI
├── requirements.txt
├── .env
└── README.md
```

---

## Prerequisites

| Tool    | Version |
| ------- | ------- |
| Python  | 3.10+   |
| Node.js | 20+     |
| npm     | 9+      |

You'll also need an API key for whichever LLM you prefer to use.

---

## Setup — Step by Step

### 1. Clone the repo

```bash
git clone https://github.com/your-username/patient-risk-insights-agent.git
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate # These commands are for Mac, you need to figure it out for windows.
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Add your API key

```bash
cp .env.example .env
```

Open `.env` and add your Groq key:

```
GROQ_API_KEY=gsk_your_key_here
```

I used xAI key.

### 5. Train the ML models

```bash
python -m backend.models.train
```

You should see:

```
logistic_regression: accuracy = 0.71  -> saved
knn: accuracy = 0.70                  -> saved
mlp: accuracy = 0.70                  -> saved
Scaler and feature names saved.
```

### 6. Start the backend

```bash
uvicorn backend.main:app --reload --port 8000
```

Backend running at `http://localhost:8000`. Explore the API at `http://localhost:8000/docs`.

### 7. Install and start the frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend running at `http://localhost:3000`.

---

## Using the App

1. Open `http://localhost:3000`
2. Click **Upload CSV** → select `backend/data/sample_patients.csv`
3. Wait for _"X patients indexed"_ to appear in the top bar
4. Start asking questions

### Example questions to try

```
What percentage of patients in this cohort are diabetic?
```

```
Summarise the uploaded patient cohort
```

```
Assess risk for: Glucose=148, BMI=33.6, Age=50, Pregnancies=1, BloodPressure=72, SkinThickness=35, Insulin=0, DiabetesPedigreeFunction=0.627
```

```
Compare Logistic Regression vs KNN risk scores for the above patient
```

```
What are the main physiological risk factors for Type 2 diabetes?
```

---

## CSV Format

| Column                     | Description                               |
| -------------------------- | ----------------------------------------- |
| `Pregnancies`              | Number of pregnancies                     |
| `Glucose`                  | Plasma glucose concentration (mg/dL)      |
| `BloodPressure`            | Diastolic blood pressure (mm Hg)          |
| `SkinThickness`            | Triceps skin fold thickness (mm)          |
| `Insulin`                  | 2-hour serum insulin (μU/mL)              |
| `BMI`                      | Body mass index (kg/m²)                   |
| `DiabetesPedigreeFunction` | Genetic risk score                        |
| `Age`                      | Age in years                              |
| `Outcome`                  | 1 = diabetic, 0 = non-diabetic (optional) |

A sample file is provided at `backend/data/sample_patients.csv`.

**Note:** If you want to check some other data, it has to be in the same format as the sample_patients.csv

---

## Tech Stack

| Layer              | Technology                                   |
| ------------------ | -------------------------------------------- |
| LLM Orchestration  | LangChain + LangGraph                        |
| Language Model     | Llama 3.3 70B via Groq                       |
| RAG / Vector Store | ChromaDB + sentence-transformers             |
| ML Models          | scikit-learn (Logistic Regression, KNN, MLP) |
| Backend            | FastAPI + Python                             |
| Frontend           | Next.js + TypeScript                         |
| Data Processing    | pandas + NumPy                               |

---

## Why These ML Models?

| Model                   | What it does                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| **Logistic Regression** | Linear decision boundary; coefficients directly show each feature's contribution to risk     |
| **KNN**                 | Finds K most similar patients in training data and votes — intuitive nearest-neighbour logic |
| **MLP**                 | Small neural network that captures non-linear patterns between features                      |

All three are invoked as **LangChain tools** — the LLM decides which to call based on the question, then explains the output in plain language.

---

## Environment Variables

GROK_API_KEY =
You can choose any model which you want and use that API key in your .env file.

---

## Contributing

Pull requests welcome.

---
