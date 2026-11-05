from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..connection import get_db
from ..schemas import CourseCreate, CourseUpdate, CourseWithTeacher, CourseOut
from ..controllers import course_controller

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("", response_model=List[CourseWithTeacher])
def list_courses(db: Session = Depends(get_db)):
    """List all courses with assigned teacher."""
    return course_controller.list_courses(db)


@router.post("", response_model=CourseOut)
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    """Register a new course."""
    return course_controller.create_course(payload, db)


@router.get("/{id}", response_model=CourseWithTeacher)
def get_course(id: int, db: Session = Depends(get_db)):
    """Get single course by ID."""
    return course_controller.get_course(id, db)


@router.put("/{id}", response_model=CourseOut)
def update_course(id: int, payload: CourseUpdate, db: Session = Depends(get_db)):
    """Update course information."""
    return course_controller.update_course(id, payload, db)


@router.delete("/{id}")
def delete_course(id: int, db: Session = Depends(get_db)):
    """Delete a course and its timetable entries."""
    return course_controller.delete_course(id, db)
