import re
import time
import threading
from urllib.parse import quote_plus

import feedparser
import requests

# Search terms per symbol (company name works much better than the ticker)
QUERIES = {
    "RELIANCE": "Reliance Industries share",
    "TCS": "Tata Consultancy Services TCS share",
    "HDFCBANK": "HDFC Bank share",
    "INFY": "Infosys share",
    "ITC": "ITC Limited share",
}

_CACHE_TTL = 30 * 60  # 30 min
_cache: dict[str, tuple[float, list[dict]]] = {}
_lock = threading.Lock()


def _rss_url(query: str) -> str:
    return f"https://news.google.com/rss/search?q={quote_plus(query + ' when:30d')}&hl=en-IN&gl=IN&ceid=IN:en"

def fetch_headlines(symbol: str, limit: int = 10) -> list[dict]:
    symbol = symbol.upper()
    if symbol not in QUERIES:
        raise KeyError(symbol)

    with _lock:
        hit = _cache.get(symbol)
        if hit and time.time() - hit[0] < _CACHE_TTL:
            return hit[1]

    resp = requests.get(
        _rss_url(QUERIES[symbol]),
        timeout=8,
        headers={"User-Agent": "Mozilla/5.0 TradeWise-edu"},
    )
    resp.raise_for_status()
    feed = feedparser.parse(resp.content)

    items, seen = [], set()
    for e in feed.entries:
        title = re.sub(r"\s+-\s+[^-]+$", "", e.get("title", "")).strip()  # drop " - Source"
        if not title or title.lower() in seen:
            continue
        seen.add(title.lower())
        src = e.get("source", {}).get("title", "") if hasattr(e.get("source", {}), "get") else ""
        items.append({
            "title": title,
            "source": src,
            "link": e.get("link", ""),
            "published": e.get("published", ""),
        })
        if len(items) >= limit:
            break

    with _lock:
        _cache[symbol] = (time.time(), items)
    return items