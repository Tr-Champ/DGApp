# Teacher Timetable Manager - Backend (FastAPI)

FastAPI REST API connected to PostgreSQL (Neon) with SQLAlchemy 2.0 and JWT Authentication.

## Features
- **Database Rules Enforced**: Maximum 2 courses per teacher trigger, overlapping teacher schedule check trigger, overlapping room schedule check trigger, timetable notification triggers.
- **RESTful Endpoints**: Teachers, Courses, Timetable, Notifications, Authentication.
- **Swagger Documentation**: Interactive API testing available at `/docs`.

## Local Development Setup

1. **Activate Python Virtual Environment**:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `Backend` directory:
   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
   SECRET_KEY=exam_jwt_secret_key_teacher_timetable_2026
   ACCESS_TOKEN_EXPIRE_MINUTES=120
   ```

4. **Run Application**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Open `http://localhost:8000/docs` in your browser.

## Deploy to Render

1. Push your repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) and click **New +** → **Web Service**.
3. Connect your repository.
4. Set the following configuration:
   - **Name**: `ttm-api`
   - **Root Directory**: `Backend`
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: *(Your Neon PostgreSQL connection string)*
   - `SECRET_KEY`: *(Any random string or generated secret)*
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `120`
6. Click **Create Web Service**.
7. Once deployed, copy your Render public URL (e.g., `https://ttm-api.onrender.com`).
8. Paste that URL into `frontend/src/config.ts` (`export const API_BASE_URL = "https://ttm-api.onrender.com";`).
