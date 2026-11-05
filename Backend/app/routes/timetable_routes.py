from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..connection import get_db
from ..schemas import TimetableCreate, TimetableUpdate, TimetableOut
from ..controllers import timetable_controller

router = APIRouter(prefix="/timetable", tags=["Timetable"])


@router.get("", response_model=List[TimetableOut])
def list_timetable(db: Session = Depends(get_db)):
    """List full institutional timetable sorted by day (Monday to Friday) and start time."""
    return timetable_controller.list_timetable(db)


@router.get("/day/{day}", response_model=List[TimetableOut])
def list_by_day(day: str, db: Session = Depends(get_db)):
    """Filter timetable entries for a specific day of the week."""
    return timetable_controller.list_by_day(day, db)


@router.get("/teacher/{id}", response_model=List[TimetableOut])
def list_by_teacher(id: int, db: Session = Depends(get_db)):
    """Filter timetable entries for a specific teacher."""
    return timetable_controller.list_by_teacher(id, db)


@router.post("", response_model=TimetableOut)
def create_entry(payload: TimetableCreate, db: Session = Depends(get_db)):
    """Create a new timetable entry. DB trigger prevents overlapping teacher or room schedules."""
    return timetable_controller.create_entry(payload, db)


@router.put("/{id}", response_model=TimetableOut)
def update_entry(id: int, payload: TimetableUpdate, db: Session = Depends(get_db)):
    """Update a timetable entry with conflict checking."""
    return timetable_controller.update_entry(id, payload, db)


@router.delete("/{id}")
def delete_entry(id: int, db: Session = Depends(get_db)):
    """Delete a timetable entry."""
    return timetable_controller.delete_entry(id, db)
