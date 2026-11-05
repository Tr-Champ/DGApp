from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..models import Notification
from ..schemas import NotificationOut


def list_for_teacher(teacher_id: int, db: Session) -> List[NotificationOut]:
    notifications = (
        db.query(Notification)
        .filter(Notification.teacher_id == teacher_id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [NotificationOut.model_validate(n) for n in notifications]


def list_all(db: Session) -> List[NotificationOut]:
    notifications = (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [NotificationOut.model_validate(n) for n in notifications]


def mark_read(notification_id: int, db: Session) -> NotificationOut:
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail=f"Notification {notification_id} not found")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return NotificationOut.model_validate(notif)
