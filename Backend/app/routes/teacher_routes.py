from typing import List
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from ..connection import get_db
from ..schemas import (
    TeacherCreate,
    TeacherUpdate,
    TeacherWithCourses,
    TeacherOut,
    AssignCoursesRequest,
    TeacherDashboardOut,
)
from ..controllers import teacher_controller

router = APIRouter(prefix="/teachers", tags=["Teachers"])


@router.get("", response_model=List[TeacherWithCourses])
def list_teachers(db: Session = Depends(get_db)):
    """List all teachers with their assigned courses."""
    return teacher_controller.list_teachers(db)


@router.post("", response_model=TeacherOut)
def create_teacher(payload: TeacherCreate, db: Session = Depends(get_db)):
    """Register a new teacher."""
    return teacher_controller.create_teacher(payload, db)


@router.get("/{id}", response_model=TeacherWithCourses)
def get_teacher(id: int = Path(..., description="Teacher ID"), db: Session = Depends(get_db)):
    """Get single teacher details by ID."""
    return teacher_controller.get_teacher(id, db)


@router.put("/{id}", response_model=TeacherOut)
def update_teacher(
    id: int,
    payload: TeacherUpdate,
    db: Session = Depends(get_db),
):
    """Update teacher personal information."""
    return teacher_controller.update_teacher(id, payload, db)


@router.put("/{id}/assign-courses", response_model=TeacherWithCourses)
def assign_courses(
    id: int,
    payload: AssignCoursesRequest,
    db: Session = Depends(get_db),
):
    """Assign exactly 2 courses to a teacher. Trigger enforces maximum of 2 courses."""
    return teacher_controller.assign_courses(id, payload.course_ids, db)


@router.get("/{id}/dashboard", response_model=TeacherDashboardOut)
def get_teacher_dashboard(id: int, db: Session = Depends(get_db)):
    """Retrieve personal dashboard data for teacher: courses, timetable, and notifications."""
    return teacher_controller.get_teacher_dashboard(id, db)
