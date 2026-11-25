from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import market_data
from ..database import get_db
from ..indicators import add_indicators

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/stocks")
def stocks(db: Session = Depends(get_db)):
    return market_data.list_stocks(db)


@router.get("/history/{symbol}")
def history(symbol: str, days: int = 90, db: Session = Depends(get_db)):
    if not market_data.get_stock(symbol):
        raise HTTPException(404, "Unknown stock")
    df, _ = market_data.get_df(db, symbol, min(max(days, 5), 250))
    return market_data.to_records(df)


@router.get("/indicators/{symbol}")
def indicators(symbol: str, days: int = 90, db: Session = Depends(get_db)):
    if not market_data.get_stock(symbol):
        raise HTTPException(404, "Unknown stock")
    df, _ = market_data.get_df(db, symbol, 250)          # extra history so SMA50 etc. are filled
    out = add_indicators(df).tail(min(max(days, 5), 250))
    return market_data.to_records(out.round(4))