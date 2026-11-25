from fastapi import APIRouter, HTTPException

from ..news_data import fetch_headlines, QUERIES
from ..ml.sentiment import score_texts, summarize

router = APIRouter(prefix="/news", tags=["news"])

_result_cache: dict[str, tuple[float, dict]] = {}


@router.get("/{symbol}")
def news_sentiment(symbol: str, limit: int = 8):
    import time
    symbol = symbol.upper()
    if symbol not in QUERIES:
        raise HTTPException(404, f"Unknown symbol {symbol}")

    key = f"{symbol}:{limit}"
    hit = _result_cache.get(key)
    if hit and time.time() - hit[0] < 30 * 60:
        return hit[1]

    try:
        items = fetch_headlines(symbol, limit=min(max(limit, 1), 15))
    except Exception:
        raise HTTPException(502, "Could not fetch news right now. Try again shortly.")

    try:
        scores = score_texts([i["title"] for i in items])
    except Exception:
        raise HTTPException(503, "Sentiment model is unavailable.")

    articles = [{**i, **s} for i, s in zip(items, scores)]
    payload = {
        "symbol": symbol,
        "summary": summarize(scores),
        "articles": articles,
        "disclaimer": "Educational market context only. Not investment advice or a price prediction.",
    }
    _result_cache[key] = (time.time(), payload)
    return payload