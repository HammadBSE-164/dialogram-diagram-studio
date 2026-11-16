"""Core RAG pipeline powered by OpenRouter.

Ingest : validate -> extract -> clean -> chunk -> embed -> store (ChromaDB)
Ask    : clean/rewrite query -> retrieve -> answer -> verify -> diagram
"""
import hashlib
import json
import os
import re
from collections import defaultdict
from pathlib import Path

import chromadb
import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from ebooklib import ITEM_DOCUMENT, epub
from pypdf import PdfReader

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("OPENROUTER_API_KEY", "")
BASE_URL = "https://openrouter.ai/api/v1"
CHAT_MODEL = os.getenv("CHAT_MODEL", "openai/gpt-4o-mini")
EMBED_MODEL = os.getenv("EMBED_MODEL", "openai/text-embedding-3-small")

CHUNK_SIZE = 900        # characters per chunk
CHUNK_OVERLAP = 150     # characters shared between neighbouring chunks
TOP_K = 6               # chunks passed to the answer step
MIN_SIMILARITY = 0.25   # below this, we say "not found in your library"
MAX_FILE_MB = 50
ALLOWED = {".pdf", ".epub", ".txt", ".md"}

db_path = Path(os.getenv("DB_PATH", "data/chroma"))
if not db_path.is_absolute():
    db_path = BASE_DIR / db_path
db = chromadb.PersistentClient(path=str(db_path))
col = db.get_or_create_collection("library", metadata={"hnsw:space": "cosine"})


# --------------------------------------------------------------------------
# OpenRouter helpers
# --------------------------------------------------------------------------
def _headers():
    if not API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not set. Add it to your .env file.")
    return {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}


def chat(messages, json_mode=False, temperature=0.2):
    body = {"model": CHAT_MODEL, "messages": messages, "temperature": temperature}
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    r = httpx.post(f"{BASE_URL}/chat/completions", headers=_headers(), json=body, timeout=120)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def chat_json(messages):
    text = chat(messages, json_mode=True)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.S)  # model wrapped JSON in prose/fences
        if not m:
            raise ValueError("Model did not return valid JSON")
        return json.loads(m.group(0))


def embed(texts):
    out = []
    for i in range(0, len(texts), 64):
        r = httpx.post(
            f"{BASE_URL}/embeddings",
            headers=_headers(),
            json={"model": EMBED_MODEL, "input": texts[i : i + 64]},
            timeout=120,
        )
        r.raise_for_status()
        data = sorted(r.json()["data"], key=lambda d: d["index"])
        out.extend(d["embedding"] for d in data)
    return out


# --------------------------------------------------------------------------
# Ingestion: validate -> extract -> clean -> chunk
# --------------------------------------------------------------------------
def validate_file(filename, data):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED:
        raise ValueError(f"Unsupported type '{ext}'. Use: {', '.join(sorted(ALLOWED))}")
    if not data:
        raise ValueError("File is empty")
    if len(data) > MAX_FILE_MB * 1024 * 1024:
        raise ValueError(f"File is larger than {MAX_FILE_MB} MB")
    if ext == ".pdf" and not data.startswith(b"%PDF"):
        raise ValueError("File is named .pdf but is not a valid PDF")
    if ext == ".epub" and not data.startswith(b"PK"):
        raise ValueError("File is named .epub but is not a valid EPUB")
    return ext


def extract(path, ext):
    """Return a list of (location_label, raw_text)."""
    if ext == ".pdf":
        reader = PdfReader(path)
        return [(f"p. {i + 1}", p.extract_text() or "") for i, p in enumerate(reader.pages)]
    if ext == ".epub":
        book = epub.read_epub(path)
        parts = []
        for n, item in enumerate(book.get_items_of_type(ITEM_DOCUMENT), 1):
            soup = BeautifulSoup(item.get_content(), "html.parser")
            parts.append((f"section {n}", soup.get_text("\n")))
        return parts
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return [("text", f.read())]


def clean_text(text):
    text = text.replace("\x00", "")
    text = re.sub(r"-\n(\w)", r"\1", text)                       # re-join hyphenated words
    text = re.sub(r"^\s*(page\s*)?\d{1,4}\s*$", "", text, flags=re.M | re.I)  # bare page numbers
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)                  # single newlines -> spaces
    return text.strip()


def looks_garbled(text):
    """Scanned PDFs without OCR or broken encodings produce mostly symbols."""
    letters = sum(c.isalpha() for c in text)
    return len(text) > 0 and letters / len(text) < 0.5


def chunk_text(text, size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n{2,}", text) if s.strip()]
    pieces = []
    for s in sents:
        while len(s) > size:
            pieces.append(s[:size])
            s = s[size:]
        pieces.append(s)

    chunks, cur, cur_len = [], [], 0
    for p in pieces:
        if cur and cur_len + len(p) + 1 > size:
            chunks.append(" ".join(cur))
            keep, n = [], 0
            for q in reversed(cur):          # carry the tail forward as overlap
                if n + len(q) > overlap:
                    break
                keep.insert(0, q)
                n += len(q) + 1
            cur, cur_len = keep, n
        cur.append(p)
        cur_len += len(p) + 1
    if cur:
        chunks.append(" ".join(cur))
    return [c for c in chunks if len(c) >= 80]


def ingest_file(filename, data, tmp_path):
    ext = validate_file(filename, data)
    file_hash = hashlib.sha256(data).hexdigest()
    if col.get(where={"file_hash": file_hash}, limit=1)["ids"]:
        raise ValueError("This file is already in your library")

    with open(tmp_path, "wb") as f:
        f.write(data)
    try:
        sections = extract(tmp_path, ext)
    except Exception as e:
        raise ValueError(f"Could not read file: {e}")

    docs, metas = [], []
    for label, raw in sections:
        cleaned = clean_text(raw)
        for c in chunk_text(cleaned):
            docs.append(c)
            metas.append({"source": filename, "location": label, "file_hash": file_hash})

    total_chars = sum(len(d) for d in docs)
    if total_chars < 200:
        raise ValueError("No readable text found (scanned PDF? run OCR first)")
    if looks_garbled(" ".join(docs[:20])):
        raise ValueError("Text looks garbled or mostly symbols; the file may need OCR")

    vectors = embed(docs)
    ids = [f"{file_hash[:12]}-{i}" for i in range(len(docs))]
    for i in range(0, len(docs), 200):
        col.add(
            ids=ids[i : i + 200],
            documents=docs[i : i + 200],
            embeddings=vectors[i : i + 200],
            metadatas=metas[i : i + 200],
        )
    return {"filename": filename, "chunks": len(docs), "characters": total_chars, "file_hash": file_hash}


def list_documents():
    metas = col.get(include=["metadatas"])["metadatas"]
    agg = defaultdict(lambda: {"chunks": 0})
    for m in metas:
        d = agg[m["file_hash"]]
        d["source"] = m["source"]
        d["chunks"] += 1
    return [{"file_hash": h, **v} for h, v in agg.items()]


def delete_document(file_hash):
    col.delete(where={"file_hash": file_hash})


# --------------------------------------------------------------------------
# Question pipeline
# --------------------------------------------------------------------------
def clean_query(raw):
    """Fix typos, remove noise, and expand into search-friendly queries."""
    res = chat_json([
        {"role": "system", "content": (
            "You prepare user questions for a document search engine. Fix spelling and grammar, "
            "remove filler, resolve vague wording, and keep the original intent. Return JSON: "
            '{"cleaned": "one clear question", "search_queries": ["2-3 short keyword-rich variants"]}')},
        {"role": "user", "content": raw},
    ])
    cleaned = (res.get("cleaned") or raw).strip()
    queries = [cleaned] + [q for q in res.get("search_queries", []) if isinstance(q, str)]
    return cleaned, queries[:4]


def retrieve(queries):
    vectors = embed(queries)
    best = {}
    for vec in vectors:
        r = col.query(query_embeddings=[vec], n_results=TOP_K, include=["documents", "metadatas", "distances"])
        for id_, doc, meta, dist in zip(r["ids"][0], r["documents"][0], r["metadatas"][0], r["distances"][0]):
            sim = 1 - dist
            if id_ not in best or sim > best[id_]["similarity"]:
                best[id_] = {"text": doc, "source": meta["source"], "location": meta["location"], "similarity": round(sim, 3)}
    ranked = sorted(best.values(), key=lambda x: x["similarity"], reverse=True)[:TOP_K]
    return [c for c in ranked if c["similarity"] >= MIN_SIMILARITY]


def _numbered(chunks):
    return "\n\n".join(f"[{i + 1}] ({c['source']}, {c['location']})\n{c['text']}" for i, c in enumerate(chunks))


def generate_answer(question, chunks):
    return chat([
        {"role": "system", "content": (
            "Answer the question using ONLY the numbered sources. Cite sources inline like [1] or [2][3]. "
            "If the sources do not contain the answer, say so plainly. Do not use outside knowledge. "
            "Be concise and structured.")},
        {"role": "user", "content": f"Sources:\n{_numbered(chunks)}\n\nQuestion: {question}"},
    ])


def verify_answer(answer, chunks):
    """Second pass: check every claim against the retrieved sources."""
    res = chat_json([
        {"role": "system", "content": (
            "You are a strict fact-checker. Split the answer into its distinct factual claims and check each "
            "one against the numbered sources. Return JSON: "
            '{"claims": [{"text": "...", "supported": true|false, "source": <number or null>}], '
            '"confidence": <0..1>, "verdict": "verified"|"partial"|"unsupported", "notes": "one sentence"}')},
        {"role": "user", "content": f"Sources:\n{_numbered(chunks)}\n\nAnswer to check:\n{answer}"},
    ])
    claims = res.get("claims", [])
    if claims:  # derive confidence from the claims so it can't drift from the evidence
        res["confidence"] = round(sum(bool(c.get("supported")) for c in claims) / len(claims), 2)
    res["verdict"] = res.get("verdict") if res.get("verdict") in ("verified", "partial", "unsupported") else "partial"
    return res


def make_diagram(question, answer):
    """Return Mermaid source that visualises the answer, or '' if nothing to draw."""
    code = chat([
        {"role": "system", "content": (
            "Turn the answer into ONE Mermaid diagram (flowchart TD, sequenceDiagram, or mindmap - whichever "
            "fits best). Use only facts present in the answer. Keep it under 12 nodes, labels under 6 words, "
            "no special characters in labels (no parentheses, quotes, colons). Output ONLY the Mermaid code, "
            "no fences, no explanation.")},
        {"role": "user", "content": f"Question: {question}\n\nAnswer:\n{answer}"},
    ], temperature=0.1)
    code = re.sub(r"^```(?:mermaid)?|```$", "", code.strip(), flags=re.M).strip()
    ok = code.split("\n")[0].strip().split(" ")[0] in ("flowchart", "graph", "sequenceDiagram", "mindmap")
    return code if ok else ""


def ask(raw_question):
    cleaned, queries = clean_query(raw_question)
    chunks = retrieve(queries)
    if not chunks:
        return {
            "cleaned_question": cleaned, "queries": queries, "answer": "",
            "found": False, "sources": [], "verification": None, "diagram": "",
        }
    answer = generate_answer(cleaned, chunks)
    verification = verify_answer(answer, chunks)
    diagram = make_diagram(cleaned, answer)
    return {
        "cleaned_question": cleaned, "queries": queries, "found": True, "answer": answer,
        "sources": chunks, "verification": verification, "diagram": diagram,
    }


def _diagram_nodes(items, shape, x, columns=3):
    nodes = []
    for i, item in enumerate(items):
        nodes.append({
            "id": str(item["id"]),
            "type": "uml",
            "position": {"x": x + (i % columns) * 230, "y": (i // columns) * 120},
            "data": {"label": str(item["label"]), "shape": shape},
        })
    return nodes


def _diagram_edges(items, valid_ids, prefix):
    edges = []
    if not isinstance(items, list):
        return edges
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        source, target = str(item.get("source", "")), str(item.get("target", ""))
        if source not in valid_ids or target not in valid_ids:
            continue
        edge = {"id": f"{prefix}{i + 1}", "source": source, "target": target}
        if item.get("label"):
            edge["label"] = str(item["label"])
        edges.append(edge)
    return edges


def analyze_transcript(transcript, language="English", output="Stories - Use Case"):
    """Convert an interview transcript into stories and editable React Flow diagrams."""
    result = chat_json([
        {"role": "system", "content": (
            "You are a software requirements analyst. Analyze only the supplied interview. "
            "Return valid JSON with this exact structure: "
            '{"summary":"one sentence","stories":["As a ..."],"attention":["question"],'
            '"actors":[{"id":"actor-id","label":"Actor"}],'
            '"usecases":[{"id":"usecase-id","label":"Use case"}],'
            '"usecase_edges":[{"source":"actor-id","target":"usecase-id","label":""}],'
            '"classes":[{"id":"class-id","label":"Class"}],'
            '"class_edges":[{"source":"class-id","target":"class-id","label":"relationship"}]}. '
            "Use short unique lowercase kebab-case IDs. Include only requirements supported by the transcript. "
            "Produce 3-12 stories, 1-8 actors, 2-12 use cases, and 2-10 domain classes. "
            f"Write human-readable text in {language}. Requested output preference: {output}."
        )},
        {"role": "user", "content": transcript},
    ])

    actors = result.get("actors") if isinstance(result.get("actors"), list) else []
    usecases = result.get("usecases") if isinstance(result.get("usecases"), list) else []
    classes = result.get("classes") if isinstance(result.get("classes"), list) else []
    actors = [x for x in actors if isinstance(x, dict) and x.get("id") and x.get("label")]
    usecases = [x for x in usecases if isinstance(x, dict) and x.get("id") and x.get("label")]
    classes = [x for x in classes if isinstance(x, dict) and x.get("id") and x.get("label")]

    usecase_nodes = _diagram_nodes(actors, "actor", 0, 1) + _diagram_nodes(usecases, "usecase", 230, 3)
    usecase_ids = {node["id"] for node in usecase_nodes}
    class_nodes = _diagram_nodes(classes, "class", 0, 3)
    class_ids = {node["id"] for node in class_nodes}

    stories = [str(x) for x in result.get("stories", []) if isinstance(x, str) and x.strip()]
    attention = [str(x) for x in result.get("attention", []) if isinstance(x, str) and x.strip()]
    return {
        "summary": str(result.get("summary") or "Transcript analyzed successfully."),
        "stories": stories,
        "attention": attention,
        "actor_count": len(actors),
        "diagrams": {
            "usecase": {
                "nodes": usecase_nodes,
                "edges": _diagram_edges(result.get("usecase_edges", []), usecase_ids, "u"),
            },
            "class": {
                "nodes": class_nodes,
                "edges": _diagram_edges(result.get("class_edges", []), class_ids, "c"),
            },
        },
    }
