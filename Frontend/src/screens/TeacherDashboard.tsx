import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import {
  getTeacherDashboard,
  markNotificationRead,
  TeacherDashboardData,
  TimetableEntry,
  NotificationItem,
} from '../api/client';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TeacherDashboard: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, lockApp, isDeviceLockSupported } = useAuth();
  const { theme: currentTheme, isDark } = useTheme();

  const teacherId = user?.teacher_id || 1;

  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View mode: 'daily' vs 'weekly'
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDay, setSelectedDay] = useState('Monday');

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await getTeacherDashboard(teacherId);
      setDashboardData(data);
    } catch (err: any) {
      Alert.alert('Dashboard Error', err.message || 'Could not load teacher dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleMarkRead = async (notification: NotificationItem) => {
    if (notification.is_read) return;
    try {
      await markNotificationRead(notification.id);
      // Update local state immediately
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          notifications: dashboardData.notifications.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          ),
        });
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not mark notification as read.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={currentTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: currentTheme.colors.muted }]}>
            Loading teacher personal portal...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const teacher = dashboardData?.teacher;
  const courses = dashboardData?.courses || [];
  const timetable = dashboardData?.timetable || [];
  const notifications = dashboardData?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredTimetable = viewMode === 'daily'
    ? timetable.filter((t) => t.day.toLowerCase() === selectedDay.toLowerCase())
    : timetable;

  // Group weekly by day
  const groupedWeekly: { [key: string]: TimetableEntry[] } = {};
  WEEKDAYS.forEach((d) => {
    groupedWeekly[d] = timetable.filter((t) => t.day.toLowerCase() === d.toLowerCase());
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 60 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <ScreenHeader
          title="Teacher Portal"
          subtitle="My courses, teaching schedule & alerts"
          badge={teacher?.teacher_code || 'T001'}
        />

        {/* 1. Header Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.profileTexts}>
              <Text style={styles.greeting}>Hello, {teacher?.full_name || 'Teacher'} 👋</Text>
              <Text style={styles.profileContact}>
                <Ionicons name="mail-outline" size={13} color={theme.colors.muted} /> {teacher?.email}
              </Text>
              <Text style={styles.profileContact}>
                <Ionicons name="call-outline" size={13} color={theme.colors.muted} /> {teacher?.phone}
              </Text>
            </View>
          </View>

          {/* Device Screen Lock Quick Action */}
          {isDeviceLockSupported && (
            <TouchableOpacity
              style={styles.lockAppBtn}
              onPress={() => {
                lockApp();
                Alert.alert('App Locked', 'Use your phone screen lock (fingerprint or PIN) to unlock.');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="lock-closed-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.lockAppText}>Lock Screen with Phone PIN / Fingerprint</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* 2. My 2 Assigned Courses Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="book-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>My 2 Assigned Courses</Text>
          </View>
          <View style={styles.coursesCountBadge}>
            <Text style={styles.coursesCountText}>{courses.length}/2 Allocated</Text>
          </View>
        </View>

        <View style={styles.coursesRow}>
          {courses.map((course) => (
            <Card key={course.id} style={styles.courseItemCard}>
              <View style={styles.courseItemHeader}>
                <Text style={styles.courseItemCode}>{course.course_code}</Text>
                <Ionicons name="ribbon-outline" size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.courseItemName}>{course.course_name}</Text>
              <Text style={styles.courseItemDesc} numberOfLines={2}>
                {course.description || 'Assigned curricular module for this semester.'}
              </Text>
            </Card>
          ))}
          {courses.length === 0 && (
            <Text style={styles.emptyNotice}>No courses assigned yet by administrator.</Text>
          )}
        </View>

        {/* 3. Daily / Weekly Timetable Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Teaching Timetable</Text>
          </View>

          {/* Segmented Daily / Weekly Toggle */}
          <View style={styles.segmentToggle}>
            <TouchableOpacity
              style={[styles.segmentBtn, viewMode === 'daily' && styles.segmentBtnActive]}
              onPress={() => setViewMode('daily')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentBtnText, viewMode === 'daily' && styles.segmentBtnTextActive]}>
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, viewMode === 'weekly' && styles.segmentBtnActive]}
              onPress={() => setViewMode('weekly')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentBtnText, viewMode === 'weekly' && styles.segmentBtnTextActive]}>
                Weekly
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Chips */}
        {viewMode === 'daily' && (
          <View style={styles.dayChipsRow}>
            {WEEKDAYS.map((w) => {
              const isSelected = selectedDay.toLowerCase() === w.toLowerCase();
              return (
                <TouchableOpacity
                  key={w}
                  style={[styles.dayChip, isSelected && styles.dayChipActive]}
                  onPress={() => setSelectedDay(w)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                    {w.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Timetable Lessons Display */}
        {viewMode === 'daily' ? (
          <View style={styles.lessonsContainer}>
            {filteredTimetable.length > 0 ? (
              filteredTimetable.map((item) => (
                <Card key={item.id} style={styles.lessonCard}>
                  <View style={styles.lessonTimeBox}>
                    <Text style={styles.lessonTimeText}>{item.start_time}</Text>
                    <Text style={styles.lessonTimeSub}>to {item.end_time}</Text>
                  </View>
                  <View style={styles.lessonDetails}>
                    <Text style={styles.lessonCourseName}>{item.course_name}</Text>
                    <View style={styles.lessonRoomRow}>
                      <Ionicons name="business" size={13} color={theme.colors.primary} />
                      <Text style={styles.lessonRoomText}>Classroom {item.room}</Text>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <View style={styles.noLessonsBox}>
                <Ionicons name="cafe-outline" size={28} color={theme.colors.muted} />
                <Text style={styles.noLessonsText}>No classes scheduled for {selectedDay}.</Text>
              </View>
            )}
          </View>
        ) : (
          /* Weekly View */
          <View style={styles.weeklyContainer}>
            {WEEKDAYS.map((w) => {
              const dayLessons = groupedWeekly[w] || [];
              return (
                <View key={w} style={styles.weeklyDayGroup}>
                  <View style={styles.weeklyDayHeader}>
                    <Text style={styles.weeklyDayTitle}>{w}</Text>
                    <Text style={styles.weeklyDayCount}>{dayLessons.length} lessons</Text>
                  </View>

                  {dayLessons.length > 0 ? (
                    dayLessons.map((item) => (
                      <View key={item.id} style={styles.weeklyLessonRow}>
                        <View style={styles.weeklyLessonTime}>
                          <Text style={styles.weeklyTimeText}>
                            {item.start_time} - {item.end_time}
                          </Text>
                        </View>
                        <View style={styles.weeklyLessonInfo}>
                          <Text style={styles.weeklyCourseText}>{item.course_name}</Text>
                          <Text style={styles.weeklyRoomText}>Room {item.room}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.weeklyNoClass}>Free day / No lectures</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 4. Notifications Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="notifications-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} New</Text>
            </View>
          )}
        </View>

        <View style={styles.notificationsContainer}>
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <TouchableOpacity
                key={n.id}
                style={[
                  styles.notifCard,
                  !n.is_read && styles.notifCardUnread,
                ]}
                onPress={() => handleMarkRead(n)}
                activeOpacity={0.8}
              >
                <View style={styles.notifIconCol}>
                  <View
                    style={[
                      styles.notifIconCircle,
                      !n.is_read && styles.notifIconCircleUnread,
                    ]}
                  >
                    <Ionicons
                      name={n.is_read ? 'notifications-off-outline' : 'notifications'}
                      size={18}
                      color={n.is_read ? theme.colors.muted : theme.colors.primary}
                    />
                  </View>
                </View>
                <View style={styles.notifTextCol}>
                  <View style={styles.notifTitleRow}>
                    <Text style={[styles.notifTitle, !n.is_read && styles.notifTitleUnread]}>
                      {n.title}
                    </Text>
                    {!n.is_read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifMessage}>{n.message}</Text>
                  <Text style={styles.notifDate}>
                    {n.created_at ? new Date(n.created_at).toLocaleString() : 'Recent'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noNotifsBox}>
              <Ionicons name="checkmark-done-circle-outline" size={32} color={theme.colors.muted} />
              <Text style={styles.noNotifsText}>No timetable change alerts.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    paddingTop: theme.spacing.xs,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.muted,
    fontSize: theme.fontSize.sm,
  },
  profileCard: {
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginRight: 14,
  },
  profileTexts: {
    flex: 1,
  },
  greeting: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileContact: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 2,
  },
  lockAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  lockAppText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginLeft: 6,
  },
  coursesCountBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  coursesCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  coursesRow: {
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  courseItemCard: {
    padding: theme.spacing.md,
    marginBottom: 4,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  courseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseItemCode: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  courseItemName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  courseItemDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    lineHeight: 18,
  },
  emptyNotice: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  segmentToggle: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: theme.borderRadius.sm,
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  segmentBtnTextActive: {
    color: theme.colors.primary,
  },
  dayChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dayChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  dayChipTextActive: {
    color: theme.colors.white,
  },
  lessonsContainer: {
    marginBottom: theme.spacing.md,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  lessonTimeBox: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 70,
  },
  lessonTimeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  lessonTimeSub: {
    fontSize: 10,
    color: theme.colors.primaryDark,
    marginTop: 2,
  },
  lessonDetails: {
    flex: 1,
  },
  lessonCourseName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  lessonRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonRoomText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginLeft: 4,
    fontWeight: '500',
  },
  noLessonsBox: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noLessonsText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 6,
  },
  weeklyContainer: {
    marginBottom: theme.spacing.md,
  },
  weeklyDayGroup: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 10,
  },
  weeklyDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 4,
  },
  weeklyDayTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  weeklyDayCount: {
    fontSize: 11,
    color: theme.colors.muted,
  },
  weeklyLessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  weeklyLessonTime: {
    width: 90,
  },
  weeklyTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  weeklyLessonInfo: {
    flex: 1,
  },
  weeklyCourseText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  weeklyRoomText: {
    fontSize: 11,
    color: theme.colors.muted,
  },
  weeklyNoClass: {
    fontSize: 11,
    color: theme.colors.muted,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  unreadBadge: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.white,
  },
  notificationsContainer: {
    marginBottom: theme.spacing.md,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 8,
  },
  notifCardUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BFDBFE',
  },
  notifIconCol: {
    marginRight: 10,
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconCircleUnread: {
    backgroundColor: theme.colors.primaryLight,
  },
  notifTextCol: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  notifTitleUnread: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.danger,
  },
  notifMessage: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    lineHeight: 18,
  },
  notifDate: {
    fontSize: 10,
    color: theme.colors.muted,
    marginTop: 4,
  },
  noNotifsBox: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noNotifsText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 6,
  },
});
