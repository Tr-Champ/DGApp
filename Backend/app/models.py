from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Time,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from .connection import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    teacher_code = Column(String(10), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    teacher_courses = relationship("TeacherCourse", back_populates="teacher", cascade="all, delete-orphan")
    courses = relationship("Course", secondary="teacher_courses", back_populates="teachers")
    direct_courses = relationship("Course", back_populates="assigned_teacher", foreign_keys="Course.teacher_id")
    timetables = relationship("Timetable", back_populates="teacher", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="teacher", cascade="all, delete-orphan")
    user = relationship("User", back_populates="teacher", uselist=False)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="teacher")
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'teacher')", name="check_user_role"),
    )

    teacher = relationship("Teacher", back_populates="user")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(15), unique=True, nullable=False, index=True)
    course_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assigned_teacher = relationship("Teacher", back_populates="direct_courses", foreign_keys=[teacher_id])
    teachers = relationship("Teacher", secondary="teacher_courses", back_populates="courses")
    timetables = relationship("Timetable", back_populates="course", cascade="all, delete-orphan")


class TeacherCourse(Base):
    __tablename__ = "teacher_courses"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("teacher_id", "course_id", name="uq_teacher_course"),
        UniqueConstraint("course_id", name="uq_course_unique_teacher"),
    )

    teacher = relationship("Teacher", back_populates="teacher_courses")
    course = relationship("Course")


class Timetable(Base):
    __tablename__ = "timetable"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    day = Column(String(10), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')", name="check_day_name"),
        CheckConstraint("end_time > start_time", name="check_time_order"),
    )

    course = relationship("Course", back_populates="timetables")
    teacher = relationship("Teacher", back_populates="timetables")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("Teacher", back_populates="notifications")
