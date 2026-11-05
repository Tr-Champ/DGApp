from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..models import Course, Teacher, TeacherCourse
from ..schemas import CourseCreate, CourseUpdate, CourseWithTeacher, CourseOut, TeacherSimpleOut


def _clean_db_error(e: Exception) -> str:
    if hasattr(e, "orig") and hasattr(e.orig, "diag") and e.orig.diag.message_primary:
        return e.orig.diag.message_primary
    return str(e).strip()


def list_courses(db: Session) -> List[CourseWithTeacher]:
    courses = db.query(Course).order_by(Course.id.asc()).all()
    result = []
    for c in courses:
        # Teacher is either from c.teacher_id or from teacher_courses
        teacher = None
        if c.teacher_id:
            teacher = db.query(Teacher).filter(Teacher.id == c.teacher_id).first()
        else:
            tc = db.query(TeacherCourse).filter(TeacherCourse.course_id == c.id).first()
            if tc:
                teacher = db.query(Teacher).filter(Teacher.id == tc.teacher_id).first()

        teacher_simple = None
        if teacher:
            teacher_simple = TeacherSimpleOut(
                id=teacher.id,
                teacher_code=teacher.teacher_code,
                full_name=teacher.full_name,
                phone=teacher.phone,
                email=teacher.email,
            )

        result.append(
            CourseWithTeacher(
                id=c.id,
                course_code=c.course_code,
                course_name=c.course_name,
                description=c.description,
                teacher_id=teacher.id if teacher else None,
                created_at=c.created_at,
                updated_at=c.updated_at,
                assigned_teacher=teacher_simple,
            )
        )
    return result


def get_course(course_id: int, db: Session) -> CourseWithTeacher:
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(status_code=404, detail=f"Course {course_id} not found")

    teacher = None
    if c.teacher_id:
        teacher = db.query(Teacher).filter(Teacher.id == c.teacher_id).first()
    else:
        tc = db.query(TeacherCourse).filter(TeacherCourse.course_id == c.id).first()
        if tc:
            teacher = db.query(Teacher).filter(Teacher.id == tc.teacher_id).first()

    teacher_simple = None
    if teacher:
        teacher_simple = TeacherSimpleOut(
            id=teacher.id,
            teacher_code=teacher.teacher_code,
            full_name=teacher.full_name,
            phone=teacher.phone,
            email=teacher.email,
        )

    return CourseWithTeacher(
        id=c.id,
        course_code=c.course_code,
        course_name=c.course_name,
        description=c.description,
        teacher_id=teacher.id if teacher else None,
        created_at=c.created_at,
        updated_at=c.updated_at,
        assigned_teacher=teacher_simple,
    )


def create_course(payload: CourseCreate, db: Session) -> CourseOut:
    existing = db.query(Course).filter(Course.course_code == payload.course_code.strip()).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Course with code '{payload.course_code}' already exists.",
        )

    course = Course(
        course_code=payload.course_code.strip(),
        course_name=payload.course_name.strip(),
        description=payload.description.strip() if payload.description else "",
    )
    db.add(course)
    try:
        db.commit()
        db.refresh(course)
        return CourseOut.model_validate(course)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_clean_db_error(e))


def update_course(course_id: int, payload: CourseUpdate, db: Session) -> CourseOut:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail=f"Course {course_id} not found")

    if payload.course_code is not None:
        course.course_code = payload.course_code.strip()
    if payload.course_name is not None:
        course.course_name = payload.course_name.strip()
    if payload.description is not None:
        course.description = payload.description.strip()

    try:
        db.commit()
        db.refresh(course)
        return CourseOut.model_validate(course)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_clean_db_error(e))


def delete_course(course_id: int, db: Session) -> dict:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail=f"Course {course_id} not found")

    try:
        db.delete(course)
        db.commit()
        return {"status": "success", "message": f"Course {course_id} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_clean_db_error(e))
