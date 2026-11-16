import os
import tempfile
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

import rag

app = FastAPI(title="Library Q&A")


class Question(BaseModel):
    text: str = Field(min_length=3, max_length=2000)


class TranscriptRequest(BaseModel):
    text: str = Field(min_length=20, max_length=50000)
    language: str = Field(default="English", max_length=40)
    output: str = Field(default="Stories - Use Case", max_length=80)


@app.post("/api/analyze")
def analyze(request: TranscriptRequest):
    try:
        return rag.analyze_transcript(request.text, request.language, request.output)
    except RuntimeError as e:
        raise HTTPException(500, str(e))
    except Exception as e:
        raise HTTPException(502, f"Model request failed: {e}")


@app.post("/api/ingest")
def ingest(files: List[UploadFile] = File(...)):
    results = []
    for f in files:
        data = f.file.read()
        with tempfile.TemporaryDirectory() as tmp:
            try:
                path = os.path.join(tmp, os.path.basename(f.filename))
                results.append({"ok": True, **rag.ingest_file(f.filename, data, path)})
            except ValueError as e:
                results.append({"ok": False, "filename": f.filename, "error": str(e)})
            except Exception as e:
                results.append({"ok": False, "filename": f.filename, "error": f"Unexpected error: {e}"})
    return results


@app.get("/api/documents")
def documents():
    return rag.list_documents()


@app.delete("/api/documents/{file_hash}")
def remove(file_hash: str):
    rag.delete_document(file_hash)
    return {"ok": True}


@app.post("/api/ask")
def ask(q: Question):
    if not rag.list_documents():
        raise HTTPException(400, "Your library is empty. Upload a book or PDF first.")
    try:
        return rag.ask(q.text)
    except RuntimeError as e:
        raise HTTPException(500, str(e))
    except Exception as e:
        raise HTTPException(502, f"Model request failed: {e}")


@app.get("/")
def index():
    return {"name": "Dialogram API", "status": "ok", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
