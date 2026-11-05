from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..connection import get_db
from ..schemas import NotificationOut
from ..controllers import notification_controller

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationOut])
def list_all_notifications(db: Session = Depends(get_db)):
    """List all notifications across the institution."""
    return notification_controller.list_all(db)


@router.get("/{teacher_id}", response_model=List[NotificationOut])
def list_teacher_notifications(teacher_id: int, db: Session = Depends(get_db)):
    """List notifications for a specific teacher."""
    return notification_controller.list_for_teacher(teacher_id, db)


@router.put("/{id}/read", response_model=NotificationOut)
def mark_notification_read(id: int, db: Session = Depends(get_db)):
    """Mark a notification as read."""
    return notification_controller.mark_read(id, db)
