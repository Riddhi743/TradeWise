import threading
import time
from datetime import date, timedelta

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import PriceHistory

STOCKS = [
    {"symbol": "RELIANCE", "name": "Reliance Industries", "sector": "Energy", "price": 2900},
    {"symbol": "TCS", "name": "Tata Consultancy Services", "sector": "IT", "price": 3800},
    {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Banking", "price": 1650},
    {"symbol": "INFY", "name": "Infosys", "sector": "IT", "price": 1500},
    {"symbol": "ITC", "name": "ITC", "sector": "FMCG", "price": 440},
]

TTL = 6 * 3600  # re-fetch from Yahoo at most every 6 hours
_synced: dict = {}
_source: dict = {}
_lock = threading.Lock()


def get_stock(symbol: str):
    return next((s for s in STOCKS if s["symbol"] == symbol.upper()), None)


# ---------- fetching + cleaning ----------
def clean_ohlcv(df: pd.DataFrame) -> pd.DataFrame:
    df = df[["date", "open", "high", "low", "close", "volume"]].copy()
    df = df.dropna(subset=["open", "high", "low", "close"])      # missing values
    df["volume"] = df["volume"].fillna(0)
    df = df.drop_duplicates(subset="date")                       # duplicates
    df = df[(df[["open", "high", "low", "close"]] > 0).all(axis=1)]
    return df.sort_values("date").reset_index(drop=True)         # chronological


def _fetch_yahoo(symbol: str) -> pd.DataFrame:
    import yfinance as yf

    raw = yf.Ticker(symbol + ".NS").history(period="1y", auto_adjust=False)
    if raw is None or raw.empty:
        raise ValueError("Yahoo returned no data")
    df = raw.reset_index().rename(columns={
        "Date": "date", "Open": "open", "High": "high",
        "Low": "low", "Close": "close", "Volume": "volume",
    })
    df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None).dt.date
    return clean_ohlcv(df)


def _save(db: Session, symbol: str, df: pd.DataFrame):
    existing = {r.date: r for r in db.scalars(select(PriceHistory).where(PriceHistory.symbol == symbol))}
    for r in df.to_dict("records"):
        row = existing.get(r["date"])
        if row:
            row.open, row.high, row.low, row.close, row.volume = r["open"], r["high"], r["low"], r["close"], int(r["volume"])
        else:
            db.add(PriceHistory(symbol=symbol, date=r["date"], open=r["open"], high=r["high"],
                                low=r["low"], close=r["close"], volume=int(r["volume"])))
    db.commit()


# ---------- fallback so the app never breaks ----------
def _synthetic(symbol: str, days: int = 250) -> pd.DataFrame:
    base = (get_stock(symbol) or {"price": 1000})["price"]
    state = [sum(ord(c) for c in symbol)]

    def rand():
        state[0] = (state[0] * 9301 + 49297) % 233280
        return state[0] / 233280

    dates, d = [], date.today()
    while len(dates) < days:
        if d.weekday() < 5:
            dates.append(d)
        d -= timedelta(days=1)
    dates.reverse()

    rows, price = [], base * 0.9
    for dt in dates:
        o = price
        c = o * (1 + (rand() - 0.48) * 0.03)
        price = c
        rows.append({"date": dt, "open": o, "close": c, "high": max(o, c) * 1.01,
                     "low": min(o, c) * 0.99, "volume": int(1e6 + rand() * 5e6)})
    k = base / rows[-1]["close"]
    for r in rows:
        for col in ("open", "close", "high", "low"):
            r[col] *= k
    return pd.DataFrame(rows)


# ---------- public API ----------
def get_df(db: Session, symbol: str, days: int = 250):
    """Returns (DataFrame oldest->newest, source)."""
    symbol = symbol.upper()
    with _lock:
        if time.time() - _synced.get(symbol, 0) > TTL:
            try:
                _save(db, symbol, _fetch_yahoo(symbol))
                _synced[symbol] = time.time()
                _source[symbol] = "yfinance"
            except Exception as e:
                db.rollback()
                print(f"[market] Yahoo fetch failed for {symbol}: {e}")
                _synced[symbol] = time.time() - TTL + 300  # retry in ~5 min

    rows = db.scalars(
        select(PriceHistory).where(PriceHistory.symbol == symbol)
        .order_by(PriceHistory.date.desc()).limit(days)
    ).all()
    if rows:
        df = pd.DataFrame([{
            "date": r.date, "open": r.open, "high": r.high,
            "low": r.low, "close": r.close, "volume": r.volume,
        } for r in rows]).sort_values("date").reset_index(drop=True)
        return df, _source.get(symbol, "cache")
    return _synthetic(symbol, days).tail(days).reset_index(drop=True), "synthetic"


def latest_price(db: Session, symbol: str) -> float:
    df, _ = get_df(db, symbol, 5)
    return round(float(df.iloc[-1]["close"]), 2)


def list_stocks(db: Session):
    out = []
    for s in STOCKS:
        df, src = get_df(db, s["symbol"], 5)
        out.append({**s, "price": round(float(df.iloc[-1]["close"]), 2), "source": src})
    return out


def to_records(df: pd.DataFrame):
    df = df.copy()
    df["date"] = df["date"].astype(str)
    return df.astype(object).where(pd.notna(df), None).to_dict("records")


def warm_up():
    from .database import SessionLocal
    db = SessionLocal()
    try:
        for s in STOCKS:
            get_df(db, s["symbol"])
    finally:
        db.close()