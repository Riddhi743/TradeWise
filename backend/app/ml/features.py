"""Shared feature engineering for Random Forest, K-Means and the recommendation engine.
Educational simulation analysis only: nothing here predicts prices or gives trade advice.

All *_pct values are on a 0-100 scale.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from .. import models

INITIAL_CASH = 1_000_000.0
TOTAL_LESSONS = 12  # <-- set this to your real number of lessons across all modules

# Keep in sync with the sectors used in market_data.py
SECTORS = {
    "RELIANCE": "Energy",
    "TCS": "IT",
    "INFY": "IT",
    "HDFCBANK": "Banking",
    "ITC": "FMCG",
}

# Ordered feature lists: models must always use these exact orders.
TRADE_FEATURES = [
    "is_buy",
    "position_pct",            # trade value as % of portfolio value before the trade
    "exposure_pct",            # % of portfolio invested after the trade
    "stop_loss_used",          # 1 if a stop-loss was defined
    "stop_distance_pct",       # distance entry -> stop, as % of entry
    "risk_reward",             # (target - entry) / (entry - stop); 0 if not computable
    "max_loss_pct",            # loss if the stop hits, as % of portfolio (no stop = full position at risk)
    "sector_concentration_pct",  # biggest sector's share of invested money after the trade
    "n_positions",             # number of open positions after the trade
    "volatility_pct",          # 20-day std of daily returns at trade date
    "atr_pct",                 # ATR14 as % of price at trade date
    "rsi",
    "macd_hist",
    "trades_last_7d",
    "prev_win_rate_pct",       # win rate of the last 5 closed trades (50 if none)
    "loss_streak",             # consecutive losing closed trades just before this one
    "drawdown_pct",            # portfolio drawdown from its peak after the trade
]

USER_FEATURES = [
    "quiz_avg_pct",
    "lesson_completion_pct",
    "stop_loss_usage_pct",
    "avg_position_pct",
    "trades_per_week",
    "avg_risk_reward",
    "avg_exposure_pct",
    "max_drawdown_pct",
]

_DEFAULT_MARKET = {"rsi": 50.0, "macd_hist": 0.0, "volatility_pct": 2.0, "atr_pct": 2.0}


# ---------------------------------------------------------------- market data
def load_market(db: Session) -> dict[str, pd.DataFrame]:
    """Per-symbol frame (indexed by date) with close, rsi, macd_hist, vol20, atr_pct."""
    rows = (
        db.query(models.PriceHistory)
        .order_by(models.PriceHistory.symbol, models.PriceHistory.date)
        .all()
    )
    if not rows:
        return {}
    df = pd.DataFrame(
        [
            {"symbol": r.symbol, "date": pd.to_datetime(r.date), "high": r.high, "low": r.low, "close": r.close}
            for r in rows
        ]
    )
    out: dict[str, pd.DataFrame] = {}
    for sym, g in df.groupby("symbol"):
        g = g.set_index("date").sort_index()
        c = g["close"].astype(float)

        delta = c.diff()
        gain = delta.clip(lower=0).ewm(alpha=1 / 14, adjust=False).mean()
        loss = (-delta.clip(upper=0)).ewm(alpha=1 / 14, adjust=False).mean()
        rs = gain / loss.replace(0, np.nan)
        rsi = (100 - 100 / (1 + rs)).fillna(50.0)

        macd = c.ewm(span=12, adjust=False).mean() - c.ewm(span=26, adjust=False).mean()
        hist = macd - macd.ewm(span=9, adjust=False).mean()
        hist = hist / c * 100  # as % of price so it's comparable across stocks

        vol20 = c.pct_change().rolling(20).std() * 100

        tr = pd.concat(
            [g["high"] - g["low"], (g["high"] - c.shift()).abs(), (g["low"] - c.shift()).abs()], axis=1
        ).max(axis=1)
        atr_pct = tr.ewm(alpha=1 / 14, adjust=False).mean() / c * 100

        out[sym] = pd.DataFrame(
            {"close": c, "rsi": rsi, "macd_hist": hist, "volatility_pct": vol20, "atr_pct": atr_pct}
        )
    return out


def _at(market: dict, sym: str, d: pd.Timestamp):
    """Latest market row on or before date d (or None)."""
    df = market.get(sym)
    if df is None:
        return None
    sub = df.loc[:d]
    return None if sub.empty else sub.iloc[-1]


def _num(v, default):
    return default if v is None or pd.isna(v) else float(v)


# ---------------------------------------------------------------- trade features
def build_trade_features(db: Session, user_id: int, market: dict | None = None) -> list[dict]:
    market = load_market(db) if market is None else market
    trades = (
        db.query(models.Trade)
        .filter(models.Trade.user_id == user_id)
        .order_by(models.Trade.trade_date, models.Trade.id)
        .all()
    )

    cash = INITIAL_CASH
    hold: dict[str, dict] = {}
    last_px: dict[str, float] = {}
    peak = INITIAL_CASH
    past_dates: list[pd.Timestamp] = []
    past_pnls: list[float] = []
    rows: list[dict] = []

    for t in trades:
        d = pd.Timestamp(t.trade_date).normalize()
        sym = t.symbol
        side = str(getattr(t.side, "value", t.side)).upper()
        price, qty = float(t.price), float(t.qty)
        last_px[sym] = price

        def mark(s, _sym=sym, _price=price, _d=d):
            if s == _sym:
                return _price
            snap = _at(market, s, _d)
            if snap is not None and not pd.isna(snap["close"]):
                return float(snap["close"])
            return last_px.get(s, hold[s]["avg"])

        equity_before = max(cash + sum(h["qty"] * mark(s) for s, h in hold.items()), 1.0)

        # ---- apply the trade to the replayed portfolio
        if side == "BUY":
            cash -= qty * price
            h = hold.setdefault(
                sym, {"qty": 0.0, "avg": price, "stop": None, "tp": None, "sector": SECTORS.get(sym, "Other")}
            )
            total = h["qty"] + qty
            h["avg"] = (h["qty"] * h["avg"] + qty * price) / total if total else price
            h["qty"] = total
            if t.stop_loss:
                h["stop"] = float(t.stop_loss)
            if t.take_profit:
                h["tp"] = float(t.take_profit)
            entry = price
            sl = float(t.stop_loss) if t.stop_loss else None
            tp = float(t.take_profit) if t.take_profit else None
        else:  # SELL
            cash += qty * price
            h = hold.get(sym)
            entry = h["avg"] if h else price
            sl = h["stop"] if h else None
            tp = h["tp"] if h else None
            if h:
                h["qty"] -= qty
                if h["qty"] <= 1e-9:
                    del hold[sym]

        # ---- portfolio state after the trade
        values = {s: h["qty"] * mark(s) for s, h in hold.items()}
        invested = sum(values.values())
        equity_after = max(cash + invested, 1.0)
        exposure_pct = invested / equity_after * 100

        sector_totals: dict[str, float] = {}
        for s, v in values.items():
            sector_totals[hold[s]["sector"]] = sector_totals.get(hold[s]["sector"], 0.0) + v
        sector_conc = (max(sector_totals.values()) / invested * 100) if invested > 0 else 0.0

        peak = max(peak, equity_after)
        drawdown_pct = (peak - equity_after) / peak * 100

        # ---- risk features
        position_pct = qty * price / equity_before * 100
        stop_used = 1 if sl else 0
        stop_dist = (max(entry - sl, 0) / entry * 100) if (sl and entry > 0) else 0.0
        rr = ((tp - entry) / (entry - sl)) if (sl and tp and entry > sl) else 0.0
        rr = max(rr, 0.0)
        max_loss = (qty * max(entry - sl, 0) / equity_before * 100) if sl else position_pct

        # ---- market features at trade date
        snap = _at(market, sym, d)
        m = {k: _num(snap[k], _DEFAULT_MARKET[k]) if snap is not None else _DEFAULT_MARKET[k] for k in _DEFAULT_MARKET}

        # ---- behaviour features (past trades only)
        trades_7d = sum(1 for x in past_dates if (d - x).days <= 7)
        decisive = [p for p in past_pnls if p != 0]  # ignore breakeven trades
        recent = decisive[-5:]
        win_rate = (sum(1 for p in recent if p > 0) / len(recent) * 100) if recent else 50.0
        streak = 0
        for p in reversed(decisive):
            if p < 0:
                streak += 1
            else:
                break

        rows.append(
            {
                "trade_id": t.id,
                "symbol": sym,
                "side": side,
                "date": str(d.date()),
                "pnl": float(t.pnl) if t.pnl is not None else None,
                "is_buy": 1 if side == "BUY" else 0,
                "position_pct": round(position_pct, 4),
                "exposure_pct": round(exposure_pct, 4),
                "stop_loss_used": stop_used,
                "stop_distance_pct": round(stop_dist, 4),
                "risk_reward": round(rr, 4),
                "max_loss_pct": round(max_loss, 4),
                "sector_concentration_pct": round(sector_conc, 4),
                "n_positions": len(hold),
                "volatility_pct": round(m["volatility_pct"], 4),
                "atr_pct": round(m["atr_pct"], 4),
                "rsi": round(m["rsi"], 4),
                "macd_hist": round(m["macd_hist"], 4),
                "trades_last_7d": trades_7d,
                "prev_win_rate_pct": round(win_rate, 2),
                "loss_streak": streak,
                "drawdown_pct": round(drawdown_pct, 4),
            }
        )

        past_dates.append(d)
        if side == "SELL" and t.pnl is not None:
            past_pnls.append(float(t.pnl))

    return rows


# ---------------------------------------------------------------- user features
def _mean(xs, default=0.0):
    xs = list(xs)
    return float(sum(xs) / len(xs)) if xs else default


def _quiz_pct(q) -> float:
    if getattr(q, "total", None):
        return (q.correct or 0) / q.total * 100
    return float(q.score or 0)


def build_user_features(
    db: Session, user_id: int, trade_rows: list[dict] | None = None, market: dict | None = None
) -> dict:
    rows = build_trade_features(db, user_id, market) if trade_rows is None else trade_rows

    quizzes = (
        db.query(models.QuizResult)
        .filter(models.QuizResult.user_id == user_id)
        .order_by(models.QuizResult.taken_at)
        .all()
    )
    pcts = [_quiz_pct(q) for q in quizzes]
    weak_topics = list(quizzes[-1].weak_topics or []) if quizzes else []

    lessons = db.query(models.LessonProgress).filter(models.LessonProgress.user_id == user_id).all()
    lesson_scores = [l.score / l.total * 100 for l in lessons if l.total]

    buys = [r for r in rows if r["side"] == "BUY"]
    sells = [r for r in rows if r["side"] == "SELL" and r["pnl"] is not None and r["pnl"] != 0]
    if rows:
        span_days = (pd.Timestamp(rows[-1]["date"]) - pd.Timestamp(rows[0]["date"])).days
        weeks = max(span_days, 7) / 7
        trades_per_week = len(rows) / weeks
    else:
        trades_per_week = 0.0

    rr_vals = [r["risk_reward"] for r in buys if r["risk_reward"] > 0]
    last = rows[-1] if rows else {}

    return {
        # ---- K-Means feature set (see USER_FEATURES)
        "quiz_avg_pct": round(_mean(pcts), 2),
        "lesson_completion_pct": round(min(100.0, len(lessons) / TOTAL_LESSONS * 100), 2),
        "stop_loss_usage_pct": round(_mean(r["stop_loss_used"] for r in buys) * 100, 2),
        "avg_position_pct": round(_mean(r["position_pct"] for r in buys), 2),
        "trades_per_week": round(trades_per_week, 2),
        "avg_risk_reward": round(_mean(rr_vals), 2),
        "avg_exposure_pct": round(_mean(r["exposure_pct"] for r in rows), 2),
        "max_drawdown_pct": round(max((r["drawdown_pct"] for r in rows), default=0.0), 2),
        # ---- extras for the recommendation engine, tutor context and evaluation
        "n_trades": len(rows),
        "has_enough_data": len(rows) >= 3,
        "no_stop_buys": sum(1 for r in buys if not r["stop_loss_used"]),
        "quiz_latest_pct": round(pcts[-1], 2) if pcts else 0.0,
        "quiz_first_pct": round(pcts[0], 2) if pcts else 0.0,
        "quiz_improvement": round(pcts[-1] - pcts[0], 2) if len(pcts) > 1 else 0.0,
        "weak_topics": weak_topics,
        "lessons_completed": len(lessons),
        "lesson_avg_score_pct": round(_mean(lesson_scores), 2),
        "win_rate_pct": round(_mean(1.0 if r["pnl"] > 0 else 0.0 for r in sells) * 100, 2) if sells else 0.0,
        "n_positions": last.get("n_positions", 0),
        "max_sector_concentration_pct": last.get("sector_concentration_pct", 0.0),
    }


# ---------------------------------------------------------------- vector helpers
def to_vector(features: dict, names: list[str]) -> list[float]:
    """Ordered numeric vector for sklearn. Missing/None/NaN become 0."""
    return [float(np.nan_to_num(features.get(n) or 0.0)) for n in names]