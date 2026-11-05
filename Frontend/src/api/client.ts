import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export const AUTH_STORAGE_KEY = 'ttm_auth';
export const DEVICE_LOCK_KEY = 'ttm_device_lock_enabled';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if stored
client.interceptors.request.use(
  async (config) => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch (e) {
      console.warn('Failed to attach auth token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: standard error extraction
client.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected network error occurred.';
    if (error.response) {
      // Backend returned error (e.g. 400 with DB trigger conflict)
      message = error.response.data?.detail || error.response.data?.message || JSON.stringify(error.response.data);
    } else if (error.request) {
      // Request made but no response (Render cold start, or wrong URL)
      message = `Cannot reach backend at ${API_BASE_URL}. If deploying on Render free tier, please wait 30s for server wakeup and try again.`;
    } else {
      message = error.message;
    }
    const enhancedError = new Error(message);
    (enhancedError as any).original = error;
    (enhancedError as any).status = error.response?.status;
    return Promise.reject(enhancedError);
  }
);

// ---------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------
export interface UserSession {
  user_id: number;
  username: string;
  role: string;
  teacher_id: number | null;
  teacher_name: string | null;
}

export interface Course {
  id: number;
  course_code: string;
  course_name: string;
  description?: string;
  teacher_id?: number | null;
  assigned_teacher?: {
    id: number;
    teacher_code: string;
    full_name: string;
    phone: string;
    email: string;
  } | null;
}

export interface Teacher {
  id: number;
  teacher_code: string;
  full_name: string;
  phone: string;
  email: string;
  courses: Course[];
}

export interface TimetableEntry {
  id: number;
  course_id: number;
  teacher_id: number;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | string;
  start_time: string;
  end_time: string;
  room: string;
  course_code?: string;
  course_name?: string;
  teacher_code?: string;
  teacher_name?: string;
}

export interface NotificationItem {
  id: number;
  teacher_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface TeacherDashboardData {
  teacher: Teacher;
  courses: Course[];
  timetable: TimetableEntry[];
  notifications: NotificationItem[];
}

export interface AdminStats {
  teachers_count: number;
  courses_count: number;
  timetable_count: number;
  notifications_count: number;
}

// ---------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------

// Auth
export async function loginApi(username: string, password: string) {
  const res = await client.post('/auth/login', { username, password });
  return res.data;
}

// Teachers
export async function getTeachers(): Promise<Teacher[]> {
  const res = await client.get('/teachers');
  return res.data;
}

export async function createTeacher(payload: {
  teacher_code: string;
  full_name: string;
  phone: string;
  email: string;
}): Promise<Teacher> {
  const res = await client.post('/teachers', payload);
  return res.data;
}

export async function updateTeacher(
  id: number,
  payload: {
    teacher_code?: string;
    full_name?: string;
    phone?: string;
    email?: string;
  }
): Promise<Teacher> {
  const res = await client.put(`/teachers/${id}`, payload);
  return res.data;
}

export async function assignCourses(teacherId: number, courseIds: number[]): Promise<Teacher> {
  const res = await client.put(`/teachers/${teacherId}/assign-courses`, {
    course_ids: courseIds,
  });
  return res.data;
}

export async function getTeacherDashboard(teacherId: number): Promise<TeacherDashboardData> {
  const res = await client.get(`/teachers/${teacherId}/dashboard`);
  return res.data;
}

// Courses
export async function getCourses(): Promise<Course[]> {
  const res = await client.get('/courses');
  return res.data;
}

export async function createCourse(payload: {
  course_code: string;
  course_name: string;
  description?: string;
}): Promise<Course> {
  const res = await client.post('/courses', payload);
  return res.data;
}

export async function updateCourse(
  id: number,
  payload: {
    course_code?: string;
    course_name?: string;
    description?: string;
  }
): Promise<Course> {
  const res = await client.put(`/courses/${id}`, payload);
  return res.data;
}

export async function deleteCourse(id: number): Promise<{ status: string; message: string }> {
  const res = await client.delete(`/courses/${id}`);
  return res.data;
}

// Timetable
export async function getTimetable(): Promise<TimetableEntry[]> {
  const res = await client.get('/timetable');
  return res.data;
}

export async function getTimetableByDay(day: string): Promise<TimetableEntry[]> {
  const res = await client.get(`/timetable/day/${day}`);
  return res.data;
}

export async function getTimetableByTeacher(teacherId: number): Promise<TimetableEntry[]> {
  const res = await client.get(`/timetable/teacher/${teacherId}`);
  return res.data;
}

export async function createTimetableEntry(payload: {
  course_id: number;
  teacher_id: number;
  day: string;
  start_time: string;
  end_time: string;
  room: string;
}): Promise<TimetableEntry> {
  const res = await client.post('/timetable', payload);
  return res.data;
}

export async function updateTimetableEntry(
  id: number,
  payload: {
    course_id?: number;
    teacher_id?: number;
    day?: string;
    start_time?: string;
    end_time?: string;
    room?: string;
  }
): Promise<TimetableEntry> {
  const res = await client.put(`/timetable/${id}`, payload);
  return res.data;
}

export async function deleteTimetableEntry(id: number): Promise<any> {
  const res = await client.delete(`/timetable/${id}`);
  return res.data;
}

// Notifications
export async function getNotifications(teacherId: number): Promise<NotificationItem[]> {
  const res = await client.get(`/notifications/${teacherId}`);
  return res.data;
}

export async function getAllNotifications(): Promise<NotificationItem[]> {
  const res = await client.get('/notifications');
  return res.data;
}

export async function markNotificationRead(id: number): Promise<NotificationItem> {
  const res = await client.put(`/notifications/${id}/read`);
  return res.data;
}

// Admin Stats
export async function getAdminStats(): Promise<AdminStats> {
  const res = await client.get('/admin/stats');
  return res.data;
}

export default client;
