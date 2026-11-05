from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .connection import get_db
from .models import Teacher, Course, Timetable, Notification
from .schemas import AdminStatsOut
from .routes import (
    auth_routes,
    teacher_routes,
    course_routes,
    timetable_routes,
    notification_routes,
)

app = FastAPI(
    title="Teacher Timetable Manager API",
    version="1.0.0",
    description="Backend API for ABC Training Institution Teacher Timetable Manager (UR-CE Practical Exam 2026)",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for mobile and web access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root and Health check endpoints
@app.get("/")
def read_root():
    return {
        "status": "ok",
        "service": "ttm-api",
        "institution": "ABC Training Institution",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Admin statistics aggregated endpoint
@app.get("/api/admin/stats", response_model=AdminStatsOut, tags=["Admin"])
def get_admin_stats(db: Session = Depends(get_db)):
    t_count = db.query(Teacher).count()
    c_count = db.query(Course).count()
    tt_count = db.query(Timetable).count()
    n_count = db.query(Notification).count()
    return AdminStatsOut(
        teachers_count=t_count,
        courses_count=c_count,
        timetable_count=tt_count,
        notifications_count=n_count,
    )


# Include API Routers under /api
app.include_router(auth_routes.router, prefix="/api")
app.include_router(teacher_routes.router, prefix="/api")
app.include_router(course_routes.router, prefix="/api")
app.include_router(timetable_routes.router, prefix="/api")
app.include_router(notification_routes.router, prefix="/api")
