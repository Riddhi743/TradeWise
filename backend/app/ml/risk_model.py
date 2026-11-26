"""Random Forest trade-risk rating.
Educational only: rates how a trade was SET UP. It never predicts profit/loss or gives trading advice.
"""
import logging
import threading
from pathlib import Path

import joblib
import numpy as np

log = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "artifacts" / "risk_rf.joblib"
DISCLAIMER = (
    "Educational risk rating of how this trade was set up. "
    "It is not a prediction of profit or loss and not investment advice."
)

LABELS = {
    "position_pct": "Position size",
    "exposure_pct": "Portfolio exposure",
    "stop_loss_used": "Stop-loss used",
    "stop_distance_pct": "Stop-loss distance",
    "risk_reward": "Risk-reward ratio",
    "max_loss_pct": "Max loss per trade",
    "sector_concentration_pct": "Sector concentration",
    "n_positions": "Number of positions",
    "volatility_pct": "Stock volatility",
    "atr_pct": "ATR (daily range)",
    "rsi": "RSI at entry",
    "macd_hist": "MACD at entry",
    "trades_last_7d": "Trades in last 7 days",
    "prev_win_rate_pct": "Recent win rate",
    "loss_streak": "Losing streak",
    "drawdown_pct": "Portfolio drawdown",
}

_bundle = None
_lock = threading.Lock()


def get_bundle():
    global _bundle
    if _bundle is None:
        with _lock:
            if _bundle is None:
                if not MODEL_PATH.exists():
                    raise FileNotFoundError(str(MODEL_PATH))
                b = joblib.load(MODEL_PATH)
                import sklearn

                if b.get("sklearn_version") != sklearn.__version__:
                    log.warning(
                        "Risk model trained with sklearn %s but running %s",
                        b.get("sklearn_version"), sklearn.__version__,
                    )
                _bundle = b
    return _bundle


def _probs(model, names, feat):
    x = np.array([[float(feat.get(n) or 0.0) for n in names]])
    p = model.predict_proba(x)[0]
    return p, float(p[1] * 0.5 + p[2])  # risk index: 0 = safe ... 1 = high


def _groups(f):
    """Factor groups for explanations: (title, safe-value overrides, detail text, concept to learn)."""
    pos, used = f["position_pct"], f["stop_loss_used"] == 1
    dist, rr = f["stop_distance_pct"], f["risk_reward"]
    safe_stop = {"stop_distance_pct": 5, "risk_reward": 2, "max_loss_pct": pos * 0.05}
    g = []

    if not used:
        g.append((
            "No stop-loss",
            {"stop_loss_used": 1, **safe_stop},
            f"No stop-loss was set, so the whole {pos:.1f}% position is exposed if the price keeps falling.",
            "Stop-Loss",
        ))
    elif dist > 10:
        g.append((
            "Very wide stop-loss",
            safe_stop,
            f"Your stop-loss sits {dist:.1f}% below entry, so a single loss could be large.",
            "Stop-Loss",
        ))
    elif 0 < rr < 1:
        g.append((
            "Weak risk-reward",
            safe_stop,
            f"Risk-reward is {rr:.1f}:1, meaning the potential gain is smaller than the potential loss.",
            "Risk-Reward Ratio",
        ))

    if pos > 5:
        g.append((
            "Large position",
            {"position_pct": 5, "max_loss_pct": (5 * dist / 100) if used else 5},
            f"This single trade is {pos:.1f}% of your portfolio.",
            "Position Sizing",
        ))
    if f["exposure_pct"] > 40:
        g.append((
            "High exposure",
            {"exposure_pct": 30},
            f"{f['exposure_pct']:.0f}% of your portfolio is now invested, leaving a smaller cash buffer.",
            "Portfolio Exposure",
        ))
    if f["n_positions"] <= 1 or f["sector_concentration_pct"] > 50:
        detail = (
            "Your whole portfolio is in a single stock."
            if f["n_positions"] <= 1
            else f"{f['sector_concentration_pct']:.0f}% of your invested money sits in one sector."
        )
        g.append((
            "Concentrated portfolio",
            {"sector_concentration_pct": 40, "n_positions": 5},
            detail,
            "Diversification",
        ))
    if f["volatility_pct"] > 2.5:
        g.append((
            "Volatile stock",
            {"volatility_pct": 1.5, "atr_pct": 1.5},
            f"This stock has been moving about {f['volatility_pct']:.1f}% a day, so prices can swing quickly.",
            "Volatility & ATR",
        ))
    if f["rsi"] > 75:
        g.append((
            "Overbought RSI",
            {"rsi": 50},
            f"RSI is {f['rsi']:.0f}, which indicators treat as the overbought zone, a classic caution flag.",
            "RSI",
        ))
    if f["trades_last_7d"] > 5:
        g.append((
            "Frequent trading",
            {"trades_last_7d": 2},
            f"{int(f['trades_last_7d'])} trades in the last 7 days. Overtrading raises costs and impulsive decisions.",
            "Trading Discipline",
        ))
    if f["loss_streak"] >= 2:
        g.append((
            "Losing streak",
            {"loss_streak": 0, "prev_win_rate_pct": 50},
            f"{int(f['loss_streak'])} losing trades in a row. Trading to win losses back is a common beginner trap.",
            "Trading Psychology",
        ))
    if f["drawdown_pct"] > 8:
        g.append((
            "Portfolio drawdown",
            {"drawdown_pct": 0},
            f"Your portfolio is {f['drawdown_pct']:.1f}% below its peak, so protecting capital matters more now.",
            "Max Drawdown",
        ))
    return g


def _strengths(f):
    s = []
    if f["stop_loss_used"] == 1:
        s.append("You defined a stop-loss before entering.")
    if f["risk_reward"] >= 2:
        s.append(f"Risk-reward of {f['risk_reward']:.1f}:1, so the potential reward is at least twice the risk.")
    if f["stop_loss_used"] == 1 and f["max_loss_pct"] <= 1:
        s.append(f"If the stop-loss hits, you lose only {f['max_loss_pct']:.2f}% of your portfolio.")
    if f["position_pct"] <= 5:
        s.append(f"A small position ({f['position_pct']:.1f}% of portfolio) keeps any single loss manageable.")
    return s[:2]


def evaluate(feat: dict) -> dict:
    b = get_bundle()
    model, names, classes = b["model"], b["features"], b["classes"]
    f = {n: float(feat.get(n) or 0.0) for n in names}

    p, base = _probs(model, names, f)
    risk_class = classes[int(p.argmax())]

    # Counterfactual explanation: how much would the risk index drop if this factor group were "safe"?
    contribs = []
    for title, override, detail, learn in _groups(f):
        _, alt = _probs(model, names, {**f, **override})
        drop = base - alt
        if drop > 0.03:
            contribs.append((drop, title, detail, learn))
    contribs.sort(key=lambda t: -t[0])
    reasons = [
        {"factor": t, "detail": d, "learn": l, "impact": round(c, 3)} for c, t, d, l in contribs[:3]
    ]

    imp = sorted(zip(names, model.feature_importances_), key=lambda t: -t[1])[:6]
    return {
        "applicable": True,
        "risk_class": risk_class,
        "probabilities": {c: round(float(v), 3) for c, v in zip(classes, p)},
        "risk_index": round(base, 3),
        "reasons": reasons,
        "strengths": _strengths(f),
        "learn_next": list(dict.fromkeys(r["learn"] for r in reasons)),
        "feature_importance": [
            {"feature": n, "label": LABELS.get(n, n), "importance": round(float(v), 3)} for n, v in imp
        ],
        "disclaimer": DISCLAIMER,
    }