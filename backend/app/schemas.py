from .models import User


def user_out(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "onboarded": u.onboarded,
        "level": u.level,
        "goal": u.goal,
        "assessment": u.assessment,
    }