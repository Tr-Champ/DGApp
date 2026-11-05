from datetime import datetime, time
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError, IntegrityError
from ..models import Timetable, Course, Teacher
from ..schemas import TimetableCreate, TimetableUpdate, TimetableOut

DAY_ORDER = {
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
}


def _clean_conflict_error(e: Exception) -> str:
    # Extract clean trigger message:
    # e.g., 'Conflict: teacher 1 is already booked during Monday 08:00:00-10:00:00'
    if hasattr(e, "orig") and hasattr(e.orig, "diag") and e.orig.diag.message_primary:
        return e.orig.diag.message_primary
    msg = str(e)
    if "Conflict:" in msg:
        idx = msg.find("Conflict:")
        end = msg.find("\n", idx)
        if end != -1:
            return msg[idx:end].strip()
        return msg[idx:].strip()
    if "uq_teacher_slot" in msg:
        return "Conflict: Teacher already has a class scheduled at this day and start time."
    if "uq_room_slot" in msg:
        return "Conflict: Room is already booked at this day and start time."
    if "CONTEXT:" in msg:
        msg = msg.split("CONTEXT:")[0]
    return msg.strip()


def _parse_time(time_str: str) -> time:
    time_str = str(time_str).strip()
    if len(time_str) == 5:  # HH:MM
        dt = datetime.strptime(time_str, "%H:%M")
        return dt.time()
    elif len(time_str) >= 8:  # HH:MM:SS
        dt = datetime.strptime(time_str[:8], "%H:%M:%S")
        return dt.time()
    try:
        return datetime.strptime(time_str, "%H:%M").time()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid time format '{time_str}'. Please use HH:MM (e.g. 08:00)",
        )


def _format_time(t) -> str:
    if hasattr(t, "strftime"):
        return t.strftime("%H:%M")
    return str(t)[:5]


def _build_timetable_out(tt: Timetable, course: Optional[Course], teacher: Optional[Teacher]) -> TimetableOut:
    return TimetableOut(
        id=tt.id,
        course_id=tt.course_id,
        teacher_id=tt.teacher_id,
        day=tt.day,
        start_time=_format_time(tt.start_time),
        end_time=_format_time(tt.end_time),
        room=tt.room,
        course_code=course.course_code if course else "",
        course_name=course.course_name if course else "",
        teacher_code=teacher.teacher_code if teacher else "",
        teacher_name=teacher.full_name if teacher else "",
        created_at=tt.created_at,
        updated_at=tt.updated_at,
    )


def list_timetable(db: Session) -> List[TimetableOut]:
    entries = db.query(Timetable).all()
    # Sort by day order then start_time
    sorted_entries = sorted(
        entries,
        key=lambda x: (DAY_ORDER.get(x.day, 9), str(x.start_time)),
    )
    result = []
    for tt in sorted_entries:
        course = db.query(Course).filter(Course.id == tt.course_id).first()
        teacher = db.query(Teacher).filter(Teacher.id == tt.teacher_id).first()
        result.append(_build_timetable_out(tt, course, teacher))
    return result


def list_by_day(day: str, db: Session) -> List[TimetableOut]:
    valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    day_capitalized = day.capitalize()
    if day_capitalized not in valid_days:
        raise HTTPException(status_code=400, detail=f"Invalid day: '{day}'. Must be Monday to Friday.")

    entries = (
        db.query(Timetable)
        .filter(Timetable.day == day_capitalized)
        .order_by(Timetable.start_time.asc())
        .all()
    )
    result = []
    for tt in entries:
        course = db.query(Course).filter(Course.id == tt.course_id).first()
        teacher = db.query(Teacher).filter(Teacher.id == tt.teacher_id).first()
        result.append(_build_timetable_out(tt, course, teacher))
    return result


def list_by_teacher(teacher_id: int, db: Session) -> List[TimetableOut]:
    entries = (
        db.query(Timetable)
        .filter(Timetable.teacher_id == teacher_id)
        .all()
    )
    sorted_entries = sorted(
        entries,
        key=lambda x: (DAY_ORDER.get(x.day, 9), str(x.start_time)),
    )
    result = []
    for tt in sorted_entries:
        course = db.query(Course).filter(Course.id == tt.course_id).first()
        teacher = db.query(Teacher).filter(Teacher.id == tt.teacher_id).first()
        result.append(_build_timetable_out(tt, course, teacher))
    return result


def create_entry(payload: TimetableCreate, db: Session) -> TimetableOut:
    # 1. Validation
    valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    day_str = payload.day.strip().capitalize()
    if day_str not in valid_days:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid day '{payload.day}'. Must be one of Monday, Tuesday, Wednesday, Thursday, Friday.",
        )

    start_t = _parse_time(payload.start_time)
    end_t = _parse_time(payload.end_time)
    if end_t <= start_t:
        raise HTTPException(
            status_code=400,
            detail=f"End time ({payload.end_time}) must be after start time ({payload.start_time}).",
        )

    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail=f"Course {payload.course_id} not found")

    teacher = db.query(Teacher).filter(Teacher.id == payload.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail=f"Teacher {payload.teacher_id} not found")

    entry = Timetable(
        course_id=payload.course_id,
        teacher_id=payload.teacher_id,
        day=day_str,
        start_time=start_t,
        end_time=end_t,
        room=payload.room.strip().upper(),
    )

    db.add(entry)
    try:
        db.commit()
        db.refresh(entry)
        return _build_timetable_out(entry, course, teacher)
    except Exception as e:
        db.rollback()
        conflict_msg = _clean_conflict_error(e)
        raise HTTPException(status_code=400, detail=conflict_msg)


def update_entry(entry_id: int, payload: TimetableUpdate, db: Session) -> TimetableOut:
    entry = db.query(Timetable).filter(Timetable.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail=f"Timetable entry {entry_id} not found")

    if payload.course_id is not None:
        course = db.query(Course).filter(Course.id == payload.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail=f"Course {payload.course_id} not found")
        entry.course_id = payload.course_id

    if payload.teacher_id is not None:
        teacher = db.query(Teacher).filter(Teacher.id == payload.teacher_id).first()
        if not teacher:
            raise HTTPException(status_code=404, detail=f"Teacher {payload.teacher_id} not found")
        entry.teacher_id = payload.teacher_id

    if payload.day is not None:
        day_str = payload.day.strip().capitalize()
        valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        if day_str not in valid_days:
            raise HTTPException(status_code=400, detail=f"Invalid day: '{payload.day}'.")
        entry.day = day_str

    if payload.start_time is not None:
        entry.start_time = _parse_time(payload.start_time)

    if payload.end_time is not None:
        entry.end_time = _parse_time(payload.end_time)

    if entry.end_time <= entry.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time.")

    if payload.room is not None:
        entry.room = payload.room.strip().upper()

    try:
        db.commit()
        db.refresh(entry)
        course = db.query(Course).filter(Course.id == entry.course_id).first()
        teacher = db.query(Teacher).filter(Teacher.id == entry.teacher_id).first()
        return _build_timetable_out(entry, course, teacher)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_clean_conflict_error(e))


def delete_entry(entry_id: int, db: Session) -> dict:
    entry = db.query(Timetable).filter(Timetable.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail=f"Timetable entry {entry_id} not found")

    try:
        db.delete(entry)
        db.commit()
        return {"status": "success", "message": f"Timetable entry {entry_id} deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
