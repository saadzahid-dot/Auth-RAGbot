from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI(title="Passly Embedding Service")

model: SentenceTransformer = None
MODEL_NAME = "all-MiniLM-L6-v2"
DIMENSIONS = 384


@app.on_event("startup")
def load_model():
    global model
    model = SentenceTransformer(MODEL_NAME)


class EmbedRequest(BaseModel):
    text: str


class EmbedBatchRequest(BaseModel):
    texts: list[str]


class EmbedResponse(BaseModel):
    embedding: list[float]
    dimensions: int


class EmbedBatchResponse(BaseModel):
    embeddings: list[list[float]]
    dimensions: int


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "dimensions": DIMENSIONS,
    }


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text must not be empty")
    vec = model.encode(req.text, normalize_embeddings=True)
    return EmbedResponse(
        embedding=vec.tolist(),
        dimensions=DIMENSIONS,
    )


@app.post("/embed-batch", response_model=EmbedBatchResponse)
def embed_batch(req: EmbedBatchRequest):
    if not req.texts or len(req.texts) == 0:
        raise HTTPException(status_code=400, detail="Texts list must not be empty")
    vecs = model.encode(req.texts, normalize_embeddings=True)
    return EmbedBatchResponse(
        embeddings=[v.tolist() for v in vecs],
        dimensions=DIMENSIONS,
    )
