from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError, IntegrityError
from ..models import Teacher, Course, TeacherCourse, Timetable, Notification
from ..schemas import (
    TeacherCreate,
    TeacherUpdate,
    TeacherWithCourses,
    TeacherOut,
    CourseOut,
    TimetableOut,
    NotificationOut,
    TeacherDashboardOut,
)


def _clean_db_error(e: Exception) -> str:
    msg = str(e)
    # Check for Postgres trigger error message format
    if hasattr(e, "orig") and hasattr(e.orig, "diag") and e.orig.diag.message_primary:
        return e.orig.diag.message_primary
    if "CONTEXT:" in msg:
        msg = msg.split("CONTEXT:")[0]
    if "DETAIL:" in msg:
        msg = msg.split("DETAIL:")[0]
    return msg.strip()


def list_teachers(db: Session) -> List[TeacherWithCourses]:
    teachers = db.query(Teacher).order_by(Teacher.id.asc()).all()
    result = []
    for t in teachers:
        # Load courses for teacher through teacher_courses relationship
        courses = (
            db.query(Course)
            .join(TeacherCourse, TeacherCourse.course_id == Course.id)
            .filter(TeacherCourse.teacher_id == t.id)
            .order_by(Course.course_code.asc())
            .all()
        )
        result.append(
            TeacherWithCourses(
                id=t.id,
                teacher_code=t.teacher_code,
                full_name=t.full_name,
                phone=t.phone,
                email=t.email,
                created_at=t.created_at,
                updated_at=t.updated_at,
                courses=[CourseOut.model_validate(c) for c in courses],
            )
        )
    return result


def get_teacher(teacher_id: int, db: Session) -> TeacherWithCourses:
    t = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail=f"Teacher {teacher_id} not found")
    courses = (
        db.query(Course)
        .join(TeacherCourse, TeacherCourse.course_id == Course.id)
        .filter(TeacherCourse.teacher_id == t.id)
        .order_by(Course.course_code.asc())
        .all()
    )
    return TeacherWithCourses(
        id=t.id,
        teacher_code=t.teacher_code,
        full_name=t.full_name,
        phone=t.phone,
        email=t.email,
        created_at=t.created_at,
        updated_at=t.updated_at,
        courses=[CourseOut.model_validate(c) for c in courses],
    )


def create_teacher(payload: TeacherCreate, db: Session) -> TeacherOut:
    existing = db.query(Teacher).filter(
        (Teacher.teacher_code == payload.teacher_code) | (Teacher.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Teacher with code '{payload.teacher_code}' or email '{payload.email}' already exists.",
        )

    teacher = Teacher(
        teacher_code=payload.teacher_code.strip(),
        full_name=payload.full_name.strip(),
        phone=payload.phone.strip(),
        email=payload.email.strip(),
    )
    db.add(teacher)
    try:
        db.commit()
        db.refresh(teacher)
        return TeacherOut.model_validate(teacher)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_clean_db_error(e))


def update_teacher(teacher_id: int, payload: TeacherUpdate, db: Session) -> TeacherOut:
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail=f"Teacher {teacher_id} not found")

    if payload.teacher_code is not None:
        teacher.teacher_code = payload.teacher_code.strip()
    if payload.full_name is not None:
        teacher.full_name = payload.full_name.strip()
    if payload.phone is not None:
        teacher.phone = payload.phone.strip()
    if payload.email is not None:
        teacher.email = payload.email.strip()

    try:
        db.commit()
        db.refresh(teacher)
        return TeacherOut.model_validate(teacher)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_clean_db_error(e))


def assign_courses(teacher_id: int, course_ids: List[int], db: Session) -> TeacherWithCourses:
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail=f"Teacher {teacher_id} not found")

    if len(course_ids) != 2:
        raise HTTPException(
            status_code=400,
            detail=f"Each teacher must be assigned EXACTLY 2 courses (received {len(course_ids)}).",
        )

    if course_ids[0] == course_ids[1]:
        raise HTTPException(
            status_code=400,
            detail="Cannot assign the same course twice to a teacher.",
        )

    # Check courses exist
    courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
    if len(courses) != 2:
        raise HTTPException(
            status_code=404,
            detail="One or more selected courses do not exist.",
        )

    try:
        # Atomic replace:
        # 1. Unassign courses currently belonging to other teachers if any
        # 2. Delete existing assignments for this teacher
        db.query(TeacherCourse).filter(TeacherCourse.teacher_id == teacher_id).delete()
        # Also remove if either course was assigned to someone else (since course is unique to one teacher)
        db.query(TeacherCourse).filter(TeacherCourse.course_id.in_(course_ids)).delete()
        db.flush()

        # Add both assignments
        for cid in course_ids:
            tc = TeacherCourse(teacher_id=teacher_id, course_id=cid)
            db.add(tc)

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_clean_db_error(e))

    return get_teacher(teacher_id, db)


def get_teacher_dashboard(teacher_id: int, db: Session) -> TeacherDashboardOut:
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail=f"Teacher {teacher_id} not found")

    # 1. Courses
    courses = (
        db.query(Course)
        .join(TeacherCourse, TeacherCourse.course_id == Course.id)
        .filter(TeacherCourse.teacher_id == teacher_id)
        .order_by(Course.course_code.asc())
        .all()
    )

    # 2. Timetable
    timetable_entries = (
        db.query(Timetable)
        .filter(Timetable.teacher_id == teacher_id)
        .order_by(
            Timetable.day.asc(),
            Timetable.start_time.asc(),
        )
        .all()
    )

    day_order = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5}
    sorted_timetable = sorted(
        timetable_entries,
        key=lambda x: (day_order.get(x.day, 9), str(x.start_time)),
    )

    tt_out = []
    for item in sorted_timetable:
        course = db.query(Course).filter(Course.id == item.course_id).first()
        tt_out.append(
            TimetableOut(
                id=item.id,
                course_id=item.course_id,
                teacher_id=item.teacher_id,
                day=item.day,
                start_time=item.start_time.strftime("%H:%M") if hasattr(item.start_time, "strftime") else str(item.start_time)[:5],
                end_time=item.end_time.strftime("%H:%M") if hasattr(item.end_time, "strftime") else str(item.end_time)[:5],
                room=item.room,
                course_code=course.course_code if course else "",
                course_name=course.course_name if course else "",
                teacher_code=teacher.teacher_code,
                teacher_name=teacher.full_name,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
        )

    # 3. Notifications
    notifications = (
        db.query(Notification)
        .filter(Notification.teacher_id == teacher_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return TeacherDashboardOut(
        teacher=TeacherOut.model_validate(teacher),
        courses=[CourseOut.model_validate(c) for c in courses],
        timetable=tt_out,
        notifications=[NotificationOut.model_validate(n) for n in notifications],
    )
