import os
import json
import chromadb
import pandas as pd
from sentence_transformers import SentenceTransformer

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "../../.chromadb")
COLLECTION  = "patient_records"

_embedder   = None
_chroma     = None
_collection = None


def _get_embedder():
    global _embedder
    if _embedder is None:
        print("Loading embedding model (first run may take ~30s)...")
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


def _get_collection():
    global _chroma, _collection
    if _collection is None:
        _chroma     = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = _chroma.get_or_create_collection(COLLECTION)
    return _collection


def index_dataset(df: pd.DataFrame):
    """Convert each patient row into a text document and embed it into ChromaDB."""
    col = _get_collection()

    # Clear existing records for fresh upload
    existing = col.count()
    if existing > 0:
        col.delete(where={"source": "upload"})

    embedder = _get_embedder()
    docs, ids, metas, embeddings = [], [], [], []

    for i, row in df.iterrows():
        text = (
            f"Patient {i}: "
            + ", ".join([f"{k}={v}" for k, v in row.items()])
        )
        emb = embedder.encode(text).tolist()
        docs.append(text)
        ids.append(f"patient_{i}")
        metas.append({"source": "upload", "patient_id": i})
        embeddings.append(emb)

    col.add(documents=docs, ids=ids, metadatas=metas, embeddings=embeddings)
    print(f"Indexed {len(docs)} patient records into ChromaDB.")


def retrieve_context(query: str, n_results: int = 5) -> str:
    """Retrieve the most relevant patient records for a given query."""
    col      = _get_collection()
    embedder = _get_embedder()

    if col.count() == 0:
        return "No patient data indexed yet. Please upload a dataset first."

    query_emb = embedder.encode(query).tolist()
    results   = col.query(query_embeddings=[query_emb], n_results=min(n_results, col.count()))

    docs = results.get("documents", [[]])[0]
    return "\n".join(docs) if docs else "No relevant records found."
