from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, QuizResult
from ..schemas import user_out
from ..security import current_user

router = APIRouter(prefix="/users", tags=["users"])


class ProfileIn(BaseModel):
    onboarded: Optional[bool] = None
    level: Optional[str] = None
    goal: Optional[str] = None
    assessment: Optional[dict] = None


@router.get("/me")
def me(user: User = Depends(current_user)):
    return user_out(user)


@router.patch("/me")
def update_me(body: ProfileIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    data = body.model_dump(exclude_unset=True)

    if data.get("onboarded") is not None:
        user.onboarded = data["onboarded"]
    if "level" in data:
        user.level = data["level"]
    if "goal" in data:
        user.goal = data["goal"]
    if "assessment" in data:
        user.assessment = data["assessment"]
        a = data["assessment"]
        if a:  # keep every quiz attempt for the AI steps later
            db.add(QuizResult(
                user_id=user.id, score=a.get("score", 0), correct=a.get("correct", 0),
                total=a.get("total", 0), level=a.get("level", ""), by_topic=a.get("byTopic"),
                weak_topics=a.get("weakTopics"), answers=a.get("answers"),
            ))
    db.commit()
    db.refresh(user)
    return user_out(user)


@router.get("/me/quiz-results")
def quiz_results(db: Session = Depends(get_db), user: User = Depends(current_user)):
    rows = db.scalars(select(QuizResult).where(QuizResult.user_id == user.id).order_by(QuizResult.id.desc())).all()
    return [{"score": r.score, "level": r.level, "byTopic": r.by_topic,
             "weakTopics": r.weak_topics, "takenAt": r.taken_at.isoformat()} for r in rows]