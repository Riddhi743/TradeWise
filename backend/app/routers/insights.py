from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..security import current_user  # if this import errors, copy the current_user import line from routers/portfolio.py
from ..ml.features import build_trade_features, build_user_features

router = APIRouter(prefix="/ml", tags=["ml"])


@router.get("/features/me")
def my_features(db: Session = Depends(get_db), user=Depends(current_user)):
    trades = build_trade_features(db, user.id)
    return {
        "trade_features": trades,
        "user_features": build_user_features(db, user.id, trade_rows=trades),
    }