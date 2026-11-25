import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, users, market, portfolio, learning, news, insights

from . import models, market_data  # noqa: F401  (models must load before create_all)
from .config import settings
from .database import Base, engine

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=market_data.warm_up, daemon=True).start()  # pre-load prices
    yield


app = FastAPI(title="TradeWise API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth, users, market, portfolio, learning, news, insights):
    app.include_router(r.router, prefix="/api")
    
@app.get("/api/health")
def health():
    return {"status": "ok"}