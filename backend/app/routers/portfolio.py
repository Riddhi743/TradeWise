from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from .. import market_data
from ..config import settings
from ..database import get_db
from ..models import User, Portfolio, Holding, Trade
from ..security import current_user

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

DEMO_CASH = 531200
DEMO_HOLDINGS = [
    dict(symbol="RELIANCE", name="Reliance Industries", sector="Energy", qty=50, avg_price=2800, stop_loss=2650),
    dict(symbol="TCS", name="Tata Consultancy Services", sector="IT", qty=30, avg_price=3700, stop_loss=3500),
    dict(symbol="HDFCBANK", name="HDFC Bank", sector="Banking", qty=100, avg_price=1600, stop_loss=None),
    dict(symbol="INFY", name="Infosys", sector="IT", qty=40, avg_price=1550, stop_loss=1450),
]
DEMO_TRADES = [
    ("RELIANCE", "BUY", 50, 2800, "2026-09-22", None),
    ("TCS", "BUY", 30, 3700, "2026-09-23", None),
    ("HDFCBANK", "BUY", 100, 1600, "2026-09-24", None),
    ("ITC", "BUY", 200, 420, "2026-09-25", None),
    ("ITC", "SELL", 200, 441, "2026-09-27", 4200),
    ("INFY", "BUY", 40, 1550, "2026-09-28", None),
]


class OrderIn(BaseModel):
    symbol: str
    side: Literal["BUY", "SELL"]
    qty: int = Field(ge=1)
    stopLoss: Optional[float] = None
    takeProfit: Optional[float] = None
    review: Optional[dict] = None


def get_pf(db: Session, user: User) -> Portfolio:
    pf = db.scalar(select(Portfolio).where(Portfolio.user_id == user.id))
    if not pf:
        pf = Portfolio(user_id=user.id, cash=settings.INITIAL_CAPITAL)
        db.add(pf)
        db.flush()
    return pf


def trade_out(t: Trade) -> dict:
    d = {"id": f"t{t.id}", "symbol": t.symbol, "side": t.side, "qty": t.qty, "price": t.price,
         "date": t.trade_date.isoformat(), "stopLoss": t.stop_loss, "takeProfit": t.take_profit,
         "review": t.review}
    if t.pnl is not None:
        d["pnl"] = t.pnl
    return d


def portfolio_out(db: Session, user: User) -> dict:
    pf = get_pf(db, user)
    holdings = db.scalars(select(Holding).where(Holding.user_id == user.id).order_by(Holding.id)).all()
    trades = db.scalars(select(Trade).where(Trade.user_id == user.id).order_by(Trade.id)).all()
    return {
        "cash": pf.cash,
        "holdings": [{"symbol": h.symbol, "name": h.name, "sector": h.sector, "qty": h.qty,
                      "avgPrice": h.avg_price, "stopLoss": h.stop_loss, "takeProfit": h.take_profit}
                     for h in holdings],
        "trades": [trade_out(t) for t in trades],
    }


def wipe(db: Session, user: User):
    db.execute(delete(Holding).where(Holding.user_id == user.id))
    db.execute(delete(Trade).where(Trade.user_id == user.id))


@router.get("")
def get_portfolio(db: Session = Depends(get_db), user: User = Depends(current_user)):
    out = portfolio_out(db, user)
    db.commit()
    return out


@router.post("/orders")
def place_order(o: OrderIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    stock = market_data.get_stock(o.symbol)
    if not stock:
        raise HTTPException(404, "Unknown stock")
    symbol = stock["symbol"]
    price = market_data.latest_price(db, symbol)   # server decides the price, not the client

    pf = get_pf(db, user)
    h = db.scalar(select(Holding).where(Holding.user_id == user.id, Holding.symbol == symbol))
    value = o.qty * price
    pnl = None

    if o.side == "BUY":
        if o.stopLoss is not None and o.stopLoss >= price:
            raise HTTPException(400, "Stop-loss must be below the buy price")
        if o.takeProfit is not None and o.takeProfit <= price:
            raise HTTPException(400, "Take-profit must be above the buy price")
        if value > pf.cash:
            raise HTTPException(400, "Not enough virtual cash for this order")
        if h:
            total = h.qty + o.qty
            h.avg_price = (h.avg_price * h.qty + price * o.qty) / total
            h.qty = total
            if o.stopLoss:
                h.stop_loss = o.stopLoss
            if o.takeProfit:
                h.take_profit = o.takeProfit
        else:
            db.add(Holding(user_id=user.id, symbol=symbol, name=stock["name"], sector=stock["sector"],
                           qty=o.qty, avg_price=price, stop_loss=o.stopLoss, take_profit=o.takeProfit))
        pf.cash -= value
    else:
        held = h.qty if h else 0
        if held < o.qty:
            raise HTTPException(400, f"You only hold {held} shares of {symbol}")
        pnl = (price - h.avg_price) * o.qty
        h.qty -= o.qty
        if h.qty == 0:
            db.delete(h)
        pf.cash += value

    trade = Trade(user_id=user.id, symbol=symbol, side=o.side, qty=o.qty, price=price,
                  trade_date=date.today(), stop_loss=o.stopLoss, take_profit=o.takeProfit,
                  pnl=pnl, review=o.review)
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return {"portfolio": portfolio_out(db, user), "trade": trade_out(trade)}


@router.post("/demo")
def load_demo(db: Session = Depends(get_db), user: User = Depends(current_user)):
    wipe(db, user)
    get_pf(db, user).cash = DEMO_CASH
    for h in DEMO_HOLDINGS:
        db.add(Holding(user_id=user.id, **h))
    for sym, side, qty, price, d, pnl in DEMO_TRADES:
        db.add(Trade(user_id=user.id, symbol=sym, side=side, qty=qty, price=price,
                     trade_date=date.fromisoformat(d), pnl=pnl))
    db.commit()
    return portfolio_out(db, user)


@router.post("/reset")
def reset(db: Session = Depends(get_db), user: User = Depends(current_user)):
    wipe(db, user)
    get_pf(db, user).cash = settings.INITIAL_CAPITAL
    db.commit()
    return portfolio_out(db, user)