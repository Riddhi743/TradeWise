from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, LessonProgress, utcnow
from ..security import current_user

router = APIRouter(prefix="/learning", tags=["learning"])


class ProgressIn(BaseModel):
    lessonId: str
    score: int = Field(ge=0)
    total: int = Field(ge=0)


def out(rows):
    return {r.lesson_id: {"score": r.score, "total": r.total, "at": r.completed_at.isoformat()} for r in rows}


@router.get("/progress")
def get_progress(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return out(db.scalars(select(LessonProgress).where(LessonProgress.user_id == user.id)).all())


@router.post("/progress")
def save_progress(body: ProgressIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = db.scalar(select(LessonProgress).where(
        LessonProgress.user_id == user.id, LessonProgress.lesson_id == body.lessonId))
    if row:
        row.score = max(row.score, body.score)   # keep best attempt
        row.total = body.total
        row.completed_at = utcnow()
    else:
        db.add(LessonProgress(user_id=user.id, lesson_id=body.lessonId, score=body.score, total=body.total))
    db.commit()
    return out(db.scalars(select(LessonProgress).where(LessonProgress.user_id == user.id)).all())