# Teacher Timetable Manager

> **University of Rwanda — College of Education**
> School of Mathematics and Science Education
> **Module:** C580541 — Mobile Applications Programming
> **Mode:** Practical Examination | **Date:** November 5, 2026 | **Marks:** 25
> **Module Leader:** Mr. UWAMAHORO Bonaventure | **Moderator:** Gerard Nizeyimana

---

## Live Application Links

| Resource | URL |
|---|---|
| **Backend API (live on Render)** | https://dgapp-qoe0.onrender.com |
| **Swagger UI / OpenAPI Docs** | https://dgapp-qoe0.onrender.com/docs |
| **ReDoc (Alternative API Docs)** | https://dgapp-qoe0.onrender.com/redoc |
| **GitHub Repository** | https://github.com/Tr-Champ/DGApp |
| **Health Check** | https://dgapp-qoe0.onrender.com/health |

---

## Project Overview

**ABC Training Institution** offers 10 courses taught by 5 teachers. This mobile application — **Teacher Timetable Manager** — replaces manual paper-based scheduling with a full-stack digital solution.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP (Expo Go)                     │
│            React Native + TypeScript + Axios                 │
│                    runs on Android / iOS                     │
└─────────────────────────┬───────────────────────────────────┘
                          │  HTTP/HTTPS  (Axios + JWT Bearer)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND API (Render.com)                    │
│          FastAPI (Python 3.11) + SQLAlchemy ORM              │
│          Swagger UI exposed at  /docs   (OpenAPI 3.0)        │
└─────────────────────────┬───────────────────────────────────┘
                          │  SQLAlchemy / psycopg2
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               DATABASE (Neon — PostgreSQL 16)                │
│   Tables: teachers, users, courses, teacher_courses,         │
│            timetable, notifications                          │
│   Triggers: enforce 2 courses, overlap check, notifications  │
│   Views:   v_timetable_full, v_teacher_courses, v_conflicts  │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Stack (Exam Requirements)

| Requirement | Implementation |
|---|---|
| **Mobile Frontend** | React Native (Expo SDK 58) |
| **Language** | TypeScript |
| **Navigation** | React Navigation (`@react-navigation/bottom-tabs` v7) |
| **State Management** | React `useState` and `useEffect` hooks |
| **API Communication** | Axios (`axios` v1.20) with Bearer JWT header |
| **API Base URL Config** | Single file: `Frontend/src/config.ts` |
| **Backend** | FastAPI v0.115 (Python 3.11, Uvicorn, SQLAlchemy 2.0) |
| **API Documentation** | **Swagger UI + OpenAPI 3.0** at `/docs` |
| **Database** | PostgreSQL 16 on Neon (cloud) |
| **Auth** | JWT (python-jose + passlib bcrypt) |
| **Testing** | Expo Go on physical Android/iOS phone |
| **Deployment** | Render.com (backend), Expo Go (frontend) |

---

## Login Credentials

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Full access — manage all teachers, courses, timetable |
| **Teacher 1** | `john` | `teacher123` | Isolated — sees only John's data |
| **Teacher 2** | `mary` | `teacher123` | Isolated — sees only Mary's data |
| **Teacher 3** | `peter` | `teacher123` | Isolated — sees only Peter's data |
| **Teacher 4** | `alice` | `teacher123` | Isolated — sees only Alice's data |
| **Teacher 5** | `david` | `teacher123` | Isolated — sees only David's data |

---

## Seed Data (Exact Exam Sample)

### Five Registered Teachers

| Teacher ID | Full Name | Phone | Email |
|---|---|---|---|
| T001 | John | 0788000001 | john@abc.edu |
| T002 | Mary | 0788000002 | mary@abc.edu |
| T003 | Peter | 0788000003 | peter@abc.edu |
| T004 | Alice | 0788000004 | alice@abc.edu |
| T005 | David | 0788000005 | david@abc.edu |

### Ten Registered Courses

| Course Code | Course Name | Description |
|---|---|---|
| CS101 | Java Programming | Introduction to Java programming |
| CS102 | Database Systems | Relational database design and SQL |
| CS103 | Mobile Development | Cross-platform mobile apps with React Native |
| CS104 | Web Development | HTML, CSS and JavaScript fundamentals |
| CS105 | Computer Networks | OSI model, TCP/IP and networking |
| CS106 | Cybersecurity | Security principles and threat modeling |
| CS107 | Software Engineering | SDLC, agile and design patterns |
| CS108 | Systems Analysis | Requirements engineering and modeling |
| CS109 | Python Programming | Python syntax, OOP and scripting |
| CS110 | Data Science | Data analysis, visualization and ML intro |

### Teacher–Course Allocation (Exactly 2 per Teacher)

| Teacher ID | Teacher Name | Course 1 | Course 2 |
|---|---|---|---|
| T001 | John | Java Programming (CS101) | Database Systems (CS102) |
| T002 | Mary | Mobile Development (CS103) | Web Development (CS104) |
| T003 | Peter | Computer Networks (CS105) | Cybersecurity (CS106) |
| T004 | Alice | Software Engineering (CS107) | Systems Analysis (CS108) |
| T005 | David | Python Programming (CS109) | Data Science (CS110) |

### Sample Weekly Timetable

| Day | Time | Course | Teacher | Room |
|---|---|---|---|---|
| Monday | 08:00–10:00 | Java Programming | John | R101 |
| Monday | 10:00–12:00 | Mobile Development | Mary | R102 |
| Tuesday | 08:00–10:00 | Computer Networks | Peter | R103 |
| Tuesday | 10:00–12:00 | Software Engineering | Alice | R104 |
| Wednesday | 08:00–10:00 | Database Systems | John | R101 |
| Wednesday | 10:00–12:00 | Python Programming | David | R105 |
| Thursday | 08:00–10:00 | Web Development | Mary | R102 |
| Thursday | 10:00–12:00 | Cybersecurity | Peter | R103 |
| Friday | 08:00–10:00 | Systems Analysis | Alice | R104 |
| Friday | 10:00–12:00 | Data Science | David | R105 |

---

## Application Screens

---

### Login Screen

Both roles (Admin and Teacher) log in through this screen.

```
╔══════════════════════════════════════════╗
║                                       ☀️ ║
║   🎓  Teacher Timetable Manager          ║
║        ABC Training Institution          ║
║                                          ║
║  ┌──────────────────────────────────┐    ║
║  │       SIGN IN AS                 │    ║
║  │  ┌─────────────┐ ┌─────────────┐│    ║
║  │  │ ● 👤 Admin  │ │  👨‍🏫 Teacher ││    ║
║  │  └─────────────┘ └─────────────┘│    ║
║  └──────────────────────────────────┘    ║
║                                          ║
║  Username  [________________________]    ║
║  Password  [________________________]    ║
║                                          ║
║  ┌──────────────────────────────────┐    ║
║  │         🔐  SIGN IN              │    ║
║  └──────────────────────────────────┘    ║
║                                          ║
║  💡 Hint: admin / admin123               ║
║     or    john / teacher123              ║
╚══════════════════════════════════════════╝
```

**What it does:**
- Role selector chips — tap **Admin** or **Teacher** before logging in
- Submits `POST /api/auth/login` with `{ username, password }`
- Receives a **JWT Bearer token** stored in `AuthContext`
- Token is attached to every subsequent API request via Axios interceptor
- Credential hint box pre-fills demo values for the examiner
- Theme toggle (☀️/🌙) in the top-right corner

---

### Tab 1 — Teacher Management (👥)

#### Admin View — All 5 Teachers

```
╔══════════════════════════════════════════╗
║  👥 Teacher Management              🌙  ║
║  ══════════════════════════════════      ║
║  [+ ADD TEACHER]                         ║
║                                          ║
║  ┌────────────────────────────────────┐  ║
║  │ 👨‍🏫  John                   [Edit] │  ║
║  │  ID: T001   📞 0788000001          │  ║
║  │  ✉️  john@abc.edu                   │  ║
║  │  📚 Java Programming (CS101)       │  ║
║  │  📚 Database Systems (CS102)       │  ║
║  │  [Assign Courses]       [Delete]   │  ║
║  └────────────────────────────────────┘  ║
║  ┌────────────────────────────────────┐  ║
║  │ 👩‍🏫  Mary                   [Edit] │  ║
║  │  ID: T002   📞 0788000002          │  ║
║  │  ✉️  mary@abc.edu                   │  ║
║  │  📚 Mobile Development (CS103)     │  ║
║  │  📚 Web Development (CS104)        │  ║
║  │  [Assign Courses]       [Delete]   │  ║
║  └────────────────────────────────────┘  ║
║  ... (Peter, Alice, David)               ║
╚══════════════════════════════════════════╝
```

**Admin Add/Edit Teacher Modal:**
```
╔══════════════════════════════════════════╗
║  📝 Register Teacher                     ║
║  ══════════════════════════════════      ║
║  Teacher ID   [T001                   ]  ║
║  Full Name    [John                   ]  ║
║  Phone        [0788000001             ]  ║
║  Email        [john@abc.edu           ]  ║
║                                          ║
║  [  CANCEL  ]       [  SAVE TEACHER  ]   ║
╚══════════════════════════════════════════╝
```

**Assign Courses Modal:**
```
╔══════════════════════════════════════════╗
║  📚 Assign Courses to John               ║
║  ══════════════════════════════════      ║
║  Course 1  [▼ Java Programming       ]   ║
║  Course 2  [▼ Database Systems       ]   ║
║                                          ║
║  ⚠️  Exactly 2 courses required          ║
║  (DB trigger enforces max = 2)           ║
║                                          ║
║  [  CANCEL  ]         [  ASSIGN  ]       ║
╚══════════════════════════════════════════╝
```

#### Teacher View — Own Profile Only (Isolated)

```
╔══════════════════════════════════════════╗
║  👥 My Profile                      🌙  ║
║  ══════════════════════════════════      ║
║  ┌────────────────────────────────────┐  ║
║  │ 👨‍🏫  John                           │  ║
║  │  ID: T001   📞 0788000001          │  ║
║  │  ✉️  john@abc.edu                   │  ║
║  │  📚 Java Programming (CS101)       │  ║
║  │  📚 Database Systems (CS102)       │  ║
║  └────────────────────────────────────┘  ║
║  (Read-only — no edit, no other teachers)║
╚══════════════════════════════════════════╝
```

**API calls used:**
- `GET /api/teachers` — list all (admin)
- `GET /api/teachers/{id}` — single teacher (teacher role)
- `POST /api/teachers` — create teacher (admin)
- `PUT /api/teachers/{id}` — update teacher (admin)
- `DELETE /api/teachers/{id}` — delete teacher (admin)
- `PUT /api/teachers/{id}/assign-courses` — assign 2 courses (admin)

---

### Tab 2 — Course Management (📚)

#### Admin View — All 10 Courses

```
╔══════════════════════════════════════════╗
║  📚 Course Management               🌙  ║
║  ══════════════════════════════════      ║
║  [+ ADD COURSE]                          ║
║                                          ║
║  ┌────────────────────────────────────┐  ║
║  │ 📖  Java Programming               │  ║
║  │  Code: CS101   Credits: 3          │  ║
║  │  Introduction to Java programming  │  ║
║  │  👨‍🏫 Assigned to: John             │  ║
║  │                    [Edit] [Delete] │  ║
║  └────────────────────────────────────┘  ║
║  ┌────────────────────────────────────┐  ║
║  │ 📖  Database Systems               │  ║
║  │  Code: CS102   Credits: 3          │  ║
║  │  Relational database design & SQL  │  ║
║  │  👨‍🏫 Assigned to: John             │  ║
║  │                    [Edit] [Delete] │  ║
║  └────────────────────────────────────┘  ║
║  ... (8 more courses)                    ║
╚══════════════════════════════════════════╝
```

#### Teacher View — Own 2 Courses Only (Isolated)

```
╔══════════════════════════════════════════╗
║  📚 My Courses                      🌙  ║
║  ══════════════════════════════════      ║
║  ┌────────────────────────────────────┐  ║
║  │ 📖  Java Programming               │  ║
║  │  Code: CS101                       │  ║
║  │  Introduction to Java programming  │  ║
║  └────────────────────────────────────┘  ║
║  ┌────────────────────────────────────┐  ║
║  │ 📖  Database Systems               │  ║
║  │  Code: CS102                       │  ║
║  │  Relational database design & SQL  │  ║
║  └────────────────────────────────────┘  ║
╚══════════════════════════════════════════╝
```

**API calls used:**
- `GET /api/courses` — list all with assigned teacher
- `POST /api/courses` — create course (admin)
- `PUT /api/courses/{id}` — update course (admin)
- `DELETE /api/courses/{id}` — delete course (admin)

---

### Tab 3 — Timetable Management (🗓️)

#### Admin View — Editable Full Timetable

```
╔══════════════════════════════════════════╗
║  🗓️  Timetable Management           🌙  ║
║  [All] [Mon] [Tue] [Wed] [Thu] [Fri]    ║
║  ══════════════════════════════════      ║
║  [+ ADD LESSON]                          ║
║                                          ║
║  ── MONDAY ──────────────────────────    ║
║  ┌────────────────────────────────────┐  ║
║  │ 08:00–10:00              R101      │  ║
║  │ Java Programming                   │  ║
║  │ 👨‍🏫 John                            │  ║
║  │                    [Edit] [Delete] │  ║
║  └────────────────────────────────────┘  ║
║  ┌────────────────────────────────────┐  ║
║  │ 10:00–12:00              R102      │  ║
║  │ Mobile Development                 │  ║
║  │ 👩‍🏫 Mary                            │  ║
║  │                    [Edit] [Delete] │  ║
║  └────────────────────────────────────┘  ║
║                                          ║
║  ── TUESDAY ─────────────────────────    ║
║  ┌────────────────────────────────────┐  ║
║  │ 08:00–10:00              R103      │  ║
║  │ Computer Networks                  │  ║
║  │ 👨‍🏫 Peter                           │  ║
║  │                    [Edit] [Delete] │  ║
║  └────────────────────────────────────┘  ║
║  ┌────────────────────────────────────┐  ║
║  │ 10:00–12:00              R104      │  ║
║  │ Software Engineering               │  ║
║  │ 👩‍🏫 Alice                           │  ║
║  │                    [Edit] [Delete] │  ║
║  └────────────────────────────────────┘  ║
║  ── WEDNESDAY ───────────────────────    ║
║  ... (Wednesday, Thursday, Friday)       ║
╚══════════════════════════════════════════╝
```

**Admin Add / Edit Lesson Modal (dropdown pickers):**
```
╔══════════════════════════════════════════╗
║  📝 Add Timetable Entry                  ║
║  ══════════════════════════════════      ║
║  Teacher  [▼ John                     ]  ║
║  Course   [▼ Java Programming         ]  ║
║                                          ║
║  Day:                                    ║
║  [Mon] [Tue] [Wed] [Thu] [Fri]           ║
║                                          ║
║  Time Slot  [▼ 08:00 – 10:00         ]   ║
║  Room       [▼ R101                  ]   ║
║                                          ║
║  ⚠️  Conflict detected if overlap!       ║
║  (PostgreSQL trigger fn_check_time_      ║
║   overlap() blocks duplicate slots)      ║
║                                          ║
║  [  CANCEL  ]     [  SAVE LESSON  ]      ║
╚══════════════════════════════════════════╝
```

**Conflict Error Example:**
```
╔══════════════════════════════════════════╗
║  🔴 Scheduling Conflict                  ║
║  ══════════════════════════════════      ║
║  "Conflict: teacher 1 is already booked  ║
║   during Monday 08:00:00–10:00:00"       ║
║                                          ║
║  [  OK  ]                                ║
╚══════════════════════════════════════════╝
```

#### Teacher View — Own Schedule (Read-only)

```
╔══════════════════════════════════════════╗
║  🗓️  My Timetable                   🌙  ║
║  [All] [Mon] [Tue] [Wed] [Thu] [Fri]    ║
║  ══════════════════════════════════      ║
║                                          ║
║  ── MONDAY ──────────────────────────    ║
║  ┌────────────────────────────────────┐  ║
║  │ 08:00–10:00              R101      │  ║
║  │ Java Programming                   │  ║
║  │ 👨‍🏫 John                            │  ║
║  └────────────────────────────────────┘  ║
║                                          ║
║  ── WEDNESDAY ───────────────────────    ║
║  ┌────────────────────────────────────┐  ║
║  │ 08:00–10:00              R101      │  ║
║  │ Database Systems                   │  ║
║  │ 👨‍🏫 John                            │  ║
║  └────────────────────────────────────┘  ║
╚══════════════════════════════════════════╝
```

**API calls used:**
- `GET /api/timetable` — full timetable sorted Mon–Fri
- `GET /api/timetable/day/{day}` — filter by day
- `GET /api/timetable/teacher/{id}` — teacher's schedule
- `POST /api/timetable` — create entry (admin)
- `PUT /api/timetable/{id}` — update entry (admin)
- `DELETE /api/timetable/{id}` — delete entry (admin)

---

### Tab 4 — Teacher Dashboard (🏠)

**Role:** Teacher only — fully isolated personal portal.

```
╔══════════════════════════════════════════╗
║  🏠 My Dashboard                    🌙  ║
║  ══════════════════════════════════      ║
║                                          ║
║  ┌────────────────────────────────────┐  ║
║  │ 👨‍🏫  John                           │  ║
║  │  T001  |  john@abc.edu             │  ║
║  │  📞 0788000001                     │  ║
║  └────────────────────────────────────┘  ║
║                                          ║
║  📚 My Assigned Courses                  ║
║  ┌────────────────────────────────────┐  ║
║  │  CS101 — Java Programming          │  ║
║  └────────────────────────────────────┘  ║
║  ┌────────────────────────────────────┐  ║
║  │  CS102 — Database Systems          │  ║
║  └────────────────────────────────────┘  ║
║                                          ║
║  🗓️  Today's Schedule (Monday)           ║
║  ┌────────────────────────────────────┐  ║
║  │ 08:00–10:00              R101      │  ║
║  │ Java Programming                   │  ║
║  └────────────────────────────────────┘  ║
║                                          ║
║  📅  Weekly Timetable                    ║
║  ── MONDAY ──────────                    ║
║  08:00–10:00  R101  Java Programming     ║
║  ── WEDNESDAY ────                       ║
║  08:00–10:00  R101  Database Systems     ║
║                                          ║
║  🔔 Notifications  (2 unread)            ║
║  ┌────────────────────────────────────┐  ║
║  │ 🔴 New lesson scheduled            │  ║
║  │   Java Programming on Monday       │  ║
║  │   08:00–10:00 in room R101         │  ║
║  │                   [Mark as Read]   │  ║
║  └────────────────────────────────────┘  ║
║  ┌────────────────────────────────────┐  ║
║  │ ✅ Timetable updated               │  ║
║  │   Database Systems on Wednesday    │  ║
║  └────────────────────────────────────┘  ║
╚══════════════════════════════════════════╝
```

**Features:**
- Personal profile card (name, teacher code, email, phone)
- Exactly 2 assigned course cards
- **Daily view** — today's lessons only (filtered by current weekday)
- **Weekly view** — all lessons grouped by day with the diagram layout
- **Notifications panel** — auto-generated by PostgreSQL trigger `fn_notify_timetable()` when admin changes the timetable
- Tap a notification → `PUT /api/notifications/{id}/read` → marks as read (turns from red to green ✅)
- **100% isolated** — teacher John sees only John's courses, schedule, and notifications

**API calls used:**
- `GET /api/teachers/{id}/dashboard` — aggregated: profile + courses + timetable + notifications
- `PUT /api/notifications/{id}/read` — mark notification as read

---

### Tab 5 — Admin Dashboard (⚙️)

**Role:** Admin only — full institutional overview.

```
╔══════════════════════════════════════════╗
║  ⚙️  Admin Dashboard                🌙  ║
║  ══════════════════════════════════      ║
║                                          ║
║  ┌──────────────┐  ┌──────────────┐     ║
║  │  Teachers    │  │   Courses    │     ║
║  │     5        │  │     10       │     ║
║  └──────────────┘  └──────────────┘     ║
║  ┌──────────────┐  ┌──────────────┐     ║
║  │  Lessons     │  │   Alerts     │     ║
║  │     10       │  │      0       │     ║
║  └──────────────┘  └──────────────┘     ║
║                                          ║
║  🎨 Theme Settings                       ║
║  ┌────────────────────────────────────┐  ║
║  │  Current: Light Mode               │  ║
║  │  [☀️ LIGHT MODE]  [🌙 DARK MODE]  │  ║
║  └────────────────────────────────────┘  ║
║                                          ║
║  ⚡ Quick Actions                         ║
║  [👥 Teachers]  [📚 Courses]            ║
║  [🗓️ Timetable] [🔔 Notifications]      ║
║                                          ║
║  🛡️  Conflict Watch                      ║
║  ┌────────────────────────────────────┐  ║
║  │  ✅ No timetable conflicts          │  ║
║  │  Trigger: fn_check_time_overlap()   │  ║
║  │  Trigger: uq_teacher_slot active    │  ║
║  │  Trigger: uq_room_slot active       │  ║
║  └────────────────────────────────────┘  ║
║                                          ║
║  📋 Teacher–Course Allocation            ║
║  ┌────────────────────────────────────┐  ║
║  │ John (T001)                        │  ║
║  │   • Java Programming (CS101)       │  ║
║  │   • Database Systems (CS102)       │  ║
║  │ Mary (T002)                        │  ║
║  │   • Mobile Development (CS103)     │  ║
║  │   • Web Development (CS104)        │  ║
║  │ Peter (T003)                       │  ║
║  │   • Computer Networks (CS105)      │  ║
║  │   • Cybersecurity (CS106)          │  ║
║  │ Alice (T004)                       │  ║
║  │   • Software Engineering (CS107)   │  ║
║  │   • Systems Analysis (CS108)       │  ║
║  │ David (T005)                       │  ║
║  │   • Python Programming (CS109)     │  ║
║  │   • Data Science (CS110)           │  ║
║  └────────────────────────────────────┘  ║
║                                          ║
║  🗓️  Complete Institutional Timetable    ║
║  ── MONDAY ──────────────────────────    ║
║  08:00–10:00  R101  Java Prog.  John     ║
║  10:00–12:00  R102  Mobile Dev. Mary     ║
║  ── TUESDAY ─────────────────────────    ║
║  08:00–10:00  R103  Networks    Peter    ║
║  10:00–12:00  R104  Soft. Eng.  Alice    ║
║  ── WEDNESDAY ───────────────────────    ║
║  08:00–10:00  R101  Database    John     ║
║  10:00–12:00  R105  Python      David    ║
║  ── THURSDAY ────────────────────────    ║
║  08:00–10:00  R102  Web Dev.    Mary     ║
║  10:00–12:00  R103  Cybersec.   Peter    ║
║  ── FRIDAY ──────────────────────────    ║
║  08:00–10:00  R104  Sys. Anal.  Alice    ║
║  10:00–12:00  R105  Data Sci.   David    ║
╚══════════════════════════════════════════╝
```

**Features:**
- **Stats grid** — live counts: 5 teachers, 10 courses, 10 lessons, alert count
- **Theme Settings** — Light/Dark buttons: switches entire app instantly, persisted in `AsyncStorage`
- **Quick Actions** — one-tap navigation to any other tab
- **Conflict Watch** — shows active PostgreSQL constraints and trigger status
- **Teacher–Course Allocation** — full view of all 5 teachers × 2 courses each
- **Complete Institutional Timetable** — all 10 lessons grouped Monday to Friday

**API calls used:**
- `GET /api/admin/stats` — aggregated counts
- `GET /api/teachers` — teacher list with courses
- `GET /api/timetable` — full timetable

---

## Dark / Light Theme

The theme toggle (☀️/🌙) is available in **every screen header**. Switching the theme applies to all screens simultaneously via React Context API (`ThemeContext`) and is persisted across app restarts using `AsyncStorage`.

| UI Element | Light Mode | Dark Mode |
|---|---|---|
| Background | `#F8FAFC` | `#0F172A` |
| Card | `#FFFFFF` | `#1E293B` |
| Primary Text | `#1E293B` | `#F1F5F9` |
| Secondary Text | `#64748B` | `#94A3B8` |
| Accent (buttons) | `#4F46E5` | `#818CF8` |
| Border | `#E2E8F0` | `#334155` |
| Tab Bar | `#FFFFFF` | `#1E293B` |

---

## Swagger UI — API Documentation

**URL:** https://dgapp-qoe0.onrender.com/docs

The Swagger UI (OpenAPI 3.0 specification) is automatically generated by FastAPI. It allows the examiner to **view, test, and execute** every API endpoint directly from the browser without writing any code.

```
╔════════════════════════════════════════════════════════════╗
║  Teacher Timetable Manager API  v1.0.0        FastAPI      ║
║  OpenAPI 3.0 — Swagger UI                                  ║
║  ══════════════════════════════════════════════════════    ║
║                                                            ║
║  🔐 Authentication                                         ║
║  ───────────────────────────────────────────────────────   ║
║  POST  /api/auth/login          Authenticate → JWT token   ║
║                                                            ║
║  👥 Teachers                                               ║
║  ───────────────────────────────────────────────────────   ║
║  GET    /api/teachers                List all teachers      ║
║  POST   /api/teachers                Register new teacher   ║
║  GET    /api/teachers/{id}           Get teacher by ID      ║
║  PUT    /api/teachers/{id}           Update teacher info    ║
║  DELETE /api/teachers/{id}           Delete teacher         ║
║  PUT    /api/teachers/{id}/assign-courses  Assign 2 courses ║
║  GET    /api/teachers/{id}/dashboard Teacher dashboard      ║
║                                                            ║
║  📚 Courses                                                ║
║  ───────────────────────────────────────────────────────   ║
║  GET    /api/courses                 List all courses       ║
║  POST   /api/courses                 Register new course    ║
║  GET    /api/courses/{id}            Get course by ID       ║
║  PUT    /api/courses/{id}            Update course info     ║
║  DELETE /api/courses/{id}            Delete course          ║
║                                                            ║
║  🗓️  Timetable                                             ║
║  ───────────────────────────────────────────────────────   ║
║  GET    /api/timetable               Full timetable (sorted)║
║  POST   /api/timetable               Create lesson entry    ║
║  GET    /api/timetable/day/{day}     Filter by day          ║
║  GET    /api/timetable/teacher/{id}  Teacher's schedule     ║
║  PUT    /api/timetable/{id}          Update lesson entry    ║
║  DELETE /api/timetable/{id}          Delete lesson entry    ║
║                                                            ║
║  🔔 Notifications                                          ║
║  ───────────────────────────────────────────────────────   ║
║  GET    /api/notifications           All notifications      ║
║  GET    /api/notifications/{tid}     Teacher's notifications║
║  PUT    /api/notifications/{id}/read Mark as read           ║
║                                                            ║
║  📊 Admin                                                  ║
║  ───────────────────────────────────────────────────────   ║
║  GET    /api/admin/stats             Aggregated stats       ║
║                                                            ║
║  🌐 System                                                 ║
║  ───────────────────────────────────────────────────────   ║
║  GET    /                            Service health info    ║
║  GET    /health                      Health check           ║
╚════════════════════════════════════════════════════════════╝
```

---

## Database Schema — PostgreSQL (Neon)

### Entity-Relationship Diagram

```
┌─────────────────┐         ┌───────────────────┐         ┌──────────────────┐
│    teachers     │─────────│  teacher_courses   │─────────│     courses      │
│─────────────────│  1    * │───────────────────│  *    1 │──────────────────│
│ id (PK)         │         │ id (PK)            │         │ id (PK)          │
│ teacher_code    │         │ teacher_id (FK) ───┤         │ course_code      │
│ full_name       │         │ course_id (FK)  ───┘         │ course_name      │
│ phone           │         │ assigned_at        │         │ description      │
│ email           │         │ UNIQUE(teacher_id, │         │ teacher_id (FK)  │
│ created_at      │         │        course_id)  │         │ created_at       │
│ updated_at      │         │ UNIQUE(course_id)  │         │ updated_at       │
└────────┬────────┘         └───────────────────┘         └──────────────────┘
         │                                                          │
         │ 1                                                        │
         │                                                          │
         │ *                                                        │ *
┌────────┴────────┐                                      ┌──────────────────┐
│    timetable    │◄─────────────────────────────────────│                  │
│─────────────────│                                      │  (course_id FK)  │
│ id (PK)         │                                      └──────────────────┘
│ course_id (FK)  │
│ teacher_id (FK) │
│ day             │  CHECK: Monday|Tuesday|Wednesday|Thursday|Friday
│ start_time      │  CHECK: end_time > start_time
│ end_time        │  INDEX: UNIQUE(teacher_id, day, start_time)  → uq_teacher_slot
│ room            │  INDEX: UNIQUE(room, day, start_time)        → uq_room_slot
│ created_at      │
│ updated_at      │
└─────────────────┘

┌────────┬────────┐
│    users        │
│─────────────────│
│ id (PK)         │
│ username        │
│ password_hash   │  bcrypt
│ role            │  CHECK: admin | teacher
│ teacher_id (FK) │  → teachers.id
│ created_at      │
└─────────────────┘

┌─────────────────┐
│  notifications  │
│─────────────────│
│ id (PK)         │
│ teacher_id (FK) │  → teachers.id
│ title           │
│ message         │
│ is_read         │  BOOLEAN DEFAULT FALSE
│ created_at      │
└─────────────────┘
```

### PostgreSQL Triggers (Business Logic in DB)

| Trigger | Function | Table | When | Rule Enforced |
|---|---|---|---|---|
| `trg_enforce_two_courses` | `fn_enforce_two_courses()` | `teacher_courses` | BEFORE INSERT | Rejects if teacher already has 2 courses assigned |
| `trg_sync_course_teacher` | `fn_sync_course_teacher()` | `teacher_courses` | AFTER INSERT/DELETE | Keeps `courses.teacher_id` in sync |
| `trg_check_time_overlap` | `fn_check_time_overlap()` | `timetable` | BEFORE INSERT/UPDATE | Rejects overlapping teacher or room time ranges |
| `trg_notify_timetable` | `fn_notify_timetable()` | `timetable` | AFTER INSERT/UPDATE/DELETE | Auto-creates notification for affected teacher |

### PostgreSQL Views

| View | Purpose |
|---|---|
| `v_timetable_full` | Joins timetable + teachers + courses for full display, ordered Mon–Fri |
| `v_teacher_courses` | Shows each teacher with their assigned courses |
| `v_conflicts` | Placeholder — real conflicts are blocked at the trigger level |

---

## Project File Structure

```
DG/
├── schema.sql                    ← Full PostgreSQL schema + seed data (Neon)
│
├── Backend/
│   ├── requirements.txt          ← fastapi, uvicorn, sqlalchemy, psycopg2-binary,
│   │                                pydantic, python-jose, passlib, bcrypt
│   ├── .python-version           ← 3.11.9 (Render build)
│   ├── render.yaml               ← Render deployment config
│   ├── Procfile                  ← uvicorn app.main:app --host 0.0.0.0
│   └── app/
│       ├── main.py               ← FastAPI app, CORS, routers, /api/admin/stats
│       ├── models.py             ← SQLAlchemy models (Teacher, User, Course,
│       │                             TeacherCourse, Timetable, Notification)
│       ├── schemas.py            ← Pydantic schemas (request/response validation)
│       ├── connection.py         ← Database engine + get_db dependency
│       ├── auth.py               ← JWT creation + verification
│       ├── routes/
│       │   ├── auth_routes.py        POST /api/auth/login
│       │   ├── teacher_routes.py     CRUD /api/teachers + assign-courses + dashboard
│       │   ├── course_routes.py      CRUD /api/courses
│       │   ├── timetable_routes.py   CRUD /api/timetable + /day/{day} + /teacher/{id}
│       │   └── notification_routes.py GET + PUT /read
│       └── controllers/
│           ├── auth_controller.py        bcrypt verify + JWT issue
│           ├── teacher_controller.py     business logic for teachers
│           ├── course_controller.py      business logic for courses
│           ├── timetable_controller.py   conflict detection + CRUD
│           └── notification_controller.py CRUD notifications
│
└── Frontend/
    ├── package.json              ← expo ~58, react-native 0.88, axios, react-navigation
    ├── App.tsx                   ← ThemeProvider + AuthProvider + NavigationContainer
    └── src/
        ├── config.ts             ← API_BASE_URL = "https://dgapp-qoe0.onrender.com"
        ├── api/
        │   └── client.ts         ← Axios instance + all API methods
        ├── auth/
        │   ├── AuthContext.tsx   ← JWT token, user, role, teacher_id state
        │   └── deviceAuth.ts     ← Expo biometric / PIN lock
        ├── theme/
        │   ├── index.ts          ← lightTheme, darkTheme color definitions
        │   └── ThemeContext.tsx  ← ThemeProvider, useTheme() hook, AsyncStorage persist
        ├── components/
        │   ├── Card.tsx          ← Theme-aware card container
        │   ├── PrimaryButton.tsx ← Theme-aware button (primary/danger/outline)
        │   ├── TextInputField.tsx← Theme-aware text input
        │   ├── ScreenHeader.tsx  ← Title + ☀️/🌙 theme toggle built-in
        │   └── EmptyState.tsx    ← Empty list placeholder
        ├── navigation/
        │   └── TabNavigator.tsx  ← 5-tab bottom navigator (theme-aware tab bar)
        └── screens/
            ├── LoginScreen.tsx       ← Role chips, JWT login, hint box
            ├── TeacherManagement.tsx ← Admin: all 5 teachers + CRUD + assign courses
            │                           Teacher: own profile only (isolated)
            ├── CourseManagement.tsx  ← Admin: all 10 courses + CRUD
            │                           Teacher: own 2 courses only (isolated)
            ├── TimetableManagement.tsx ← Diagram layout, day chips, admin dropdowns,
            │                            conflict detection
            ├── TeacherDashboard.tsx  ← Isolated portal: profile, courses, daily/weekly
            │                           timetable, notifications with mark-as-read
            └── AdminDashboard.tsx    ← Stats, theme toggle, quick actions, conflict watch,
                                        allocation table, full institutional timetable
```

---

## Exam Requirements — Full Checklist

### A. Teacher Management ✅

| Requirement | Implementation |
|---|---|
| Register 5 teachers with Teacher ID, Full Name, Phone, Email | Seed data in `schema.sql`; teacher_code=T001–T005 |
| Display list of registered teachers | `GET /api/teachers` → Tab 1 teacher cards |
| Assign exactly 2 courses to each teacher | `PUT /api/teachers/{id}/assign-courses`; DB trigger `fn_enforce_two_courses()` blocks >2 |
| Allow administrator to update teacher information | `PUT /api/teachers/{id}` → Edit modal in Tab 1 |

### B. Course Management ✅

| Requirement | Implementation |
|---|---|
| Register 10 courses with Course Code, Course Name, Description | Seed data CS101–CS110 in `schema.sql` |
| Assign each course to one teacher | `teacher_courses` table; `UNIQUE(course_id)` enforces one teacher per course |
| Display all courses with their assigned teachers | `GET /api/courses` returns `CourseWithTeacher` → Tab 2 |

### C. Timetable Management ✅

| Requirement | Implementation |
|---|---|
| Allow administrators to create timetable entries | `POST /api/timetable` → Add Lesson modal in Tab 3 |
| Assign courses to specific days with start/end times | `timetable.day`, `timetable.start_time`, `timetable.end_time` fields |
| Specify classroom for each lesson | `timetable.room` field (R101–R105) |
| Prevent teacher double-booking | `fn_check_time_overlap()` trigger + `uq_teacher_slot` unique index |
| Prevent two courses in same room at same time | `fn_check_time_overlap()` trigger + `uq_room_slot` unique index |
| Allow administrators to update or delete entries | `PUT /api/timetable/{id}`, `DELETE /api/timetable/{id}` → Edit/Delete buttons in Tab 3 |

### D. Teacher Dashboard ✅

| Requirement | Implementation |
|---|---|
| Allow teachers to log in securely | `POST /api/auth/login` → JWT token returned, stored in AuthContext |
| View their two assigned courses | Tab 4 course cards (isolated to logged-in teacher) |
| View daily and weekly teaching timetables | Tab 4: today's schedule + weekly grouped view with diagram layout |
| Check teaching time and classroom for each lesson | Each timetable card shows `08:00–10:00 | R101 | Course Name` |
| Receive notifications when timetable is updated | `fn_notify_timetable()` PostgreSQL trigger auto-creates notifications; shown in Tab 4 |

### E. Administrator Dashboard ✅

| Requirement | Implementation |
|---|---|
| View all 5 registered teachers and all 10 courses | Tab 5: stats grid (5 teachers, 10 courses); Tab 1 & 2 |
| View course–teacher assignments | Tab 5: Teacher–Course Allocation table |
| Create, update, and delete timetable entries | Tab 3: Add/Edit/Delete buttons with modal form and dropdown pickers |
| View the complete institutional timetable | Tab 5: full timetable by day; Tab 3: sortable with day filter |
| Identify and resolve scheduling conflicts | Tab 5: Conflict Watch panel; `fn_check_time_overlap()` trigger blocks invalid entries |

---

## Deployment Guide

### Step 1 — Database Setup (Neon)
1. Create a free account at https://neon.tech
2. Create a new PostgreSQL project
3. Open **SQL Editor** and paste the entire contents of `schema.sql`
4. Click **Run** — tables, triggers, views, and seed data are all created
5. Copy the **Connection String** (starts with `postgresql://...`)

### Step 2 — Backend Deployment (Render)
1. Push repository to GitHub
2. Go to https://render.com → **New Web Service** → connect GitHub repo
3. Set **Root Directory** to `Backend`
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Set **Environment Variables:**
   - `DATABASE_URL` = your Neon connection string
   - `SECRET_KEY` = any secret string (e.g. `timetable-secret-2026`)
   - `PYTHON_VERSION` = `3.11.9`
7. Deploy — copy the public URL (e.g. `https://dgapp-qoe0.onrender.com`)

### Step 3 — Frontend Setup (Expo Go)
1. Open `Frontend/src/config.ts`
2. Replace the value of `API_BASE_URL` with your Render URL
3. Install dependencies: `cd Frontend && npm install`
4. Start app: `npx expo start`
5. Install **Expo Go** on your Android or iOS phone
6. Scan the QR code from the terminal with Expo Go

---

## API Testing with Swagger UI

1. Open https://dgapp-qoe0.onrender.com/docs in your browser
2. Click **POST /api/auth/login** → **Try it out** → Enter `{"username":"admin","password":"admin123"}` → **Execute**
3. Copy the `access_token` from the response
4. Click **Authorize** (🔒) at the top → Enter `Bearer <token>` → **Authorize**
5. All endpoints are now authenticated — test any endpoint using **Try it out**

---

*Practical Examination — Mobile Applications Programming (C580541)*
*University of Rwanda, College of Education — November 5, 2026*
