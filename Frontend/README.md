# Teacher Timetable Manager (Mobile)

## 1. Backend is already deployed
Your FastAPI backend is running on Render, e.g.:
    https://ttm-api.onrender.com
Open it in a browser → you should see `{"status":"ok"}`.
Swagger UI: `https://ttm-api.onrender.com/docs`

## 2. Configure the app (ONLY ONE LINE)
Open `src/config.ts` and replace:

    export const API_BASE_URL = "https://REPLACE-WITH-RENDER-URL.onrender.com";

with your Render URL (no trailing slash):

    export const API_BASE_URL = "https://ttm-api.onrender.com";

Save the file.

*(For local testing on phone via Wi-Fi, you can also use your computer's local IP, e.g., `http://192.168.1.100:8000`).*

## 3. Run the app
```bash
npx expo start
```
Scan the QR code with Expo Go (Android) or Camera (iOS).
Log in with:
    username: john
    password: teacher123

## 4. Verify every exam feature
- **Tab 1: Teacher Management** → See 5 registered teachers, each with their 2 assigned courses. Register a new teacher, edit details, or re-assign 2 courses using the modal picker (strictly max 2).
- **Tab 2: Course Management** → 10 courses with assigned teachers. Register and edit courses.
- **Tab 3: Timetable** → Weekly grid grouped by day with day filter chips (`All`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri`). Tap "Add Lesson" and try adding a lesson that clashes (same teacher or same room at overlapping time) → you will see the exact red **"Scheduling Conflict"** alert returned directly from the PostgreSQL database trigger!
- **Tab 4: Teacher Dashboard** → John's 2 courses, daily view (chips for Mon–Fri), weekly view, and notifications (auto-created on timetable changes). Tapping a notification marks it read. Plus phone screen lock feature!
- **Tab 5: Admin Dashboard** → Totals (5 teachers / 10 courses / 10 lessons / N notifications), quick-action buttons jumping directly to tabs, full timetable overview, and the Conflict Watch panel proving database trigger enforcement.

## 5. Troubleshooting
- If the app says **"Cannot reach backend"**: your phone must reach the Render URL. Test the URL in your phone's browser first. Ensure CORS is open on backend (it is: `allow_origins=["*"]`).
- If Render is sleeping (free tier): the first request takes ~30 seconds for cold start. Pull-to-refresh after 30 seconds.
- Biometric & Screen Lock: Teachers can lock and unlock the app using their phone's native fingerprint, Face ID, or PIN/Pattern lock.
