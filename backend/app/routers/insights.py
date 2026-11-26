import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..security import current_user  # keep whatever import line was here before if this differs
from ..ml.features import build_trade_features, build_user_features
from ..ml import risk_model

log = logging.getLogger(__name__)
router = APIRouter(prefix="/ml", tags=["ml"])


@router.get("/features/me")
def my_features(db: Session = Depends(get_db), user=Depends(current_user)):
    trades = build_trade_features(db, user.id)
    return {
        "trade_features": trades,
        "user_features": build_user_features(db, user.id, trade_rows=trades),
    }


def _save(db: Session, user_id: int, trade_id: int, result: dict, features: dict) -> bool:
    """Store the rating in risk_metrics. Never breaks the response if saving fails."""
    try:
        payload = {
            "features": features,
            "probabilities": result["probabilities"],
            "reasons": result["reasons"],
            "strengths": result["strengths"],
        }
        row = (
            db.query(models.RiskMetric)
            .filter_by(user_id=user_id, trade_id=trade_id)
            .first()
        )
        if row:
            row.risk_class = result["risk_class"]
            row.features = payload
        else:
            db.add(
                models.RiskMetric(
                    user_id=user_id, trade_id=trade_id, risk_class=result["risk_class"], features=payload
                )
            )
        db.commit()
        return True
    except Exception:
        db.rollback()
        log.exception("Could not save risk_metrics row")
        return False


@router.post("/trades/{trade_id}/evaluate")
def evaluate_trade(trade_id: int, db: Session = Depends(get_db), user=Depends(current_user)):
    rows = build_trade_features(db, user.id)
    row = next((r for r in rows if r["trade_id"] == trade_id), None)
    if row is None:
        raise HTTPException(404, "Trade not found")
    if row["side"] != "BUY":
        return {
            "applicable": False,
            "message": "Risk ratings apply to BUY entries, where the risk is taken.",
        }

    try:
        result = risk_model.evaluate(row)
    except FileNotFoundError:
        raise HTTPException(
            503, "Risk model not found. Put risk_rf.joblib in backend/app/ml/artifacts/ and restart."
        )

    result["saved"] = _save(db, user.id, trade_id, result, row)
    return result