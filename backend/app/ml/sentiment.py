"""FinBERT sentiment scoring. Educational market context only: never a trading signal."""
import threading
from pathlib import Path

_LOCAL = Path(__file__).parent / "finbert-tradewise"
MODEL_ID = str(_LOCAL) if _LOCAL.exists() else "ProsusAI/finbert"

_pipe = None
_lock = threading.Lock()


def _get_pipe():
    global _pipe
    if _pipe is None:
        with _lock:
            if _pipe is None:
                from transformers import pipeline
                _pipe = pipeline(
                    "text-classification",
                    # model="ProsusAI/finbert",
                     model=MODEL_ID,
                    device=-1,  # CPU
                )
    return _pipe


def score_texts(texts: list[str]) -> list[dict]:
    """Returns [{label: positive|neutral|negative, score: float}, ...] in the same order."""
    if not texts:
        return []
    out = _get_pipe()(texts, truncation=True, max_length=128, batch_size=8)
    return [{"label": o["label"].lower(), "score": round(float(o["score"]), 3)} for o in out]


def summarize(results: list[dict]) -> dict:
    n = len(results)
    counts = {"positive": 0, "neutral": 0, "negative": 0}
    for r in results:
        counts[r["label"]] += 1
    net = (counts["positive"] - counts["negative"]) / n if n else 0.0
    if net >= 0.2:
        mood = "Mostly positive"
    elif net <= -0.2:
        mood = "Mostly negative"
    else:
        mood = "Mixed / neutral"
    return {"total": n, **counts, "net": round(net, 2), "mood": mood}