from datetime import datetime, time
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# -------------------------------------------------------------
# Auth Schemas
# -------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "teacher"
    teacher_id: Optional[int] = None


class ResetPasswordRequest(BaseModel):
    username: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None


# -------------------------------------------------------------
# Course Schemas
# -------------------------------------------------------------
class CourseBase(BaseModel):
    course_code: str
    course_name: str
    description: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    description: Optional[str] = None


class CourseOut(CourseBase):
    id: int
    teacher_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TeacherSimpleOut(BaseModel):
    id: int
    teacher_code: str
    full_name: str
    phone: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class CourseWithTeacher(CourseOut):
    assigned_teacher: Optional[TeacherSimpleOut] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Teacher Schemas
# -------------------------------------------------------------
class TeacherBase(BaseModel):
    teacher_code: str
    full_name: str
    phone: str
    email: str


class TeacherCreate(TeacherBase):
    pass


class TeacherUpdate(BaseModel):
    teacher_code: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class TeacherOut(TeacherBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TeacherWithCourses(TeacherOut):
    courses: List[CourseOut] = []

    model_config = ConfigDict(from_attributes=True)


class AssignCoursesRequest(BaseModel):
    course_ids: List[int] = Field(..., min_length=2, max_length=2)


# -------------------------------------------------------------
# Timetable Schemas
# -------------------------------------------------------------
class TimetableBase(BaseModel):
    course_id: int
    teacher_id: int
    day: str
    start_time: str  # "08:00" or time string
    end_time: str    # "10:00" or time string
    room: str


class TimetableCreate(TimetableBase):
    pass


class TimetableUpdate(BaseModel):
    course_id: Optional[int] = None
    teacher_id: Optional[int] = None
    day: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room: Optional[str] = None


class TimetableOut(BaseModel):
    id: int
    course_id: int
    teacher_id: int
    day: str
    start_time: str
    end_time: str
    room: str
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    teacher_code: Optional[str] = None
    teacher_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Notification Schemas
# -------------------------------------------------------------
class NotificationOut(BaseModel):
    id: int
    teacher_id: int
    title: str
    message: str
    is_read: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Dashboard Aggregated Schemas
# -------------------------------------------------------------
class TeacherDashboardOut(BaseModel):
    teacher: TeacherOut
    courses: List[CourseOut]
    timetable: List[TimetableOut]
    notifications: List[NotificationOut]


class AdminStatsOut(BaseModel):
    teachers_count: int
    courses_count: int
    timetable_count: int
    notifications_count: int
