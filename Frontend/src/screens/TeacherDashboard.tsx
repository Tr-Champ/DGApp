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
import { useTheme } from '../theme/ThemeContext';
import { theme as defaultTheme } from '../theme';
import {
  getTeacherDashboard,
  markNotificationRead,
  TeacherDashboardData,
  TimetableEntry,
  NotificationItem,
} from '../api/client';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TeacherDashboard: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, lockApp, isDeviceLockSupported } = useAuth();
  const { theme: currentTheme, isDark } = useTheme();

  // ISOLATION: Always use the logged-in teacher's teacher_id
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[currentTheme.colors.primary]} />
        }
      >
        <ScreenHeader
          title="Teacher Portal"
          subtitle={`Personal workspace for ${teacher?.full_name || 'Staff'}`}
          badge={teacher?.teacher_code || 'T001'}
        />

        {/* 1. Header Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatarCircle, { backgroundColor: currentTheme.colors.primaryLight, borderColor: currentTheme.colors.border }]}>
              <Ionicons name="person" size={32} color={currentTheme.colors.primary} />
            </View>
            <View style={styles.profileTexts}>
              <Text style={[styles.greeting, { color: currentTheme.colors.text }]}>
                Hello, {teacher?.full_name || 'Teacher'} 👋
              </Text>
              <Text style={[styles.profileContact, { color: currentTheme.colors.muted }]}>
                <Ionicons name="mail-outline" size={13} color={currentTheme.colors.muted} /> {teacher?.email}
              </Text>
              <Text style={[styles.profileContact, { color: currentTheme.colors.muted }]}>
                <Ionicons name="call-outline" size={13} color={currentTheme.colors.muted} /> {teacher?.phone}
              </Text>
            </View>
          </View>

          {/* Device Screen Lock Quick Action */}
          {isDeviceLockSupported && (
            <TouchableOpacity
              style={[styles.lockAppBtn, { borderTopColor: currentTheme.colors.border }]}
              onPress={() => {
                lockApp();
                Alert.alert('App Locked', 'Use your phone screen lock (fingerprint, face, or PIN) to unlock.');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="lock-closed-outline" size={16} color={currentTheme.colors.primary} />
              <Text style={[styles.lockAppText, { color: currentTheme.colors.primary }]}>
                Lock Screen with Phone PIN / Fingerprint
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* 2. My 2 Assigned Courses Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="book-outline" size={18} color={currentTheme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              My 2 Assigned Courses
            </Text>
          </View>
          <View style={[styles.coursesCountBadge, { backgroundColor: currentTheme.colors.primaryLight }]}>
            <Text style={[styles.coursesCountText, { color: currentTheme.colors.primary }]}>
              {courses.length}/2 Allocated
            </Text>
          </View>
        </View>

        <View style={styles.coursesRow}>
          {courses.map((course) => (
            <Card key={course.id} style={styles.courseItemCard}>
              <View style={styles.courseItemHeader}>
                <Text style={[styles.courseItemCode, { color: currentTheme.colors.primary }]}>
                  {course.course_code}
                </Text>
                <Ionicons name="ribbon-outline" size={16} color={currentTheme.colors.primary} />
              </View>
              <Text style={[styles.courseItemName, { color: currentTheme.colors.text }]}>
                {course.course_name}
              </Text>
              <Text style={[styles.courseItemDesc, { color: currentTheme.colors.muted }]} numberOfLines={2}>
                {course.description || 'Assigned curricular module for this semester.'}
              </Text>
            </Card>
          ))}
          {courses.length === 0 && (
            <Text style={[styles.emptyNotice, { color: currentTheme.colors.muted }]}>
              No courses assigned yet by administrator.
            </Text>
          )}
        </View>

        {/* 3. Daily / Weekly Timetable Section (Matches User Diagram) */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={18} color={currentTheme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              My Timetable (Isolated)
            </Text>
          </View>

          {/* Segmented Daily / Weekly Toggle */}
          <View style={[styles.segmentToggle, { backgroundColor: currentTheme.colors.background }]}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                viewMode === 'daily' && [styles.segmentBtnActive, { backgroundColor: currentTheme.colors.card }],
              ]}
              onPress={() => setViewMode('daily')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  { color: viewMode === 'daily' ? currentTheme.colors.primary : currentTheme.colors.muted },
                ]}
              >
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                viewMode === 'weekly' && [styles.segmentBtnActive, { backgroundColor: currentTheme.colors.card }],
              ]}
              onPress={() => setViewMode('weekly')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  { color: viewMode === 'weekly' ? currentTheme.colors.primary : currentTheme.colors.muted },
                ]}
              >
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
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.card,
                      borderColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedDay(w)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      { color: isSelected ? '#FFFFFF' : currentTheme.colors.textSecondary },
                    ]}
                  >
                    {w.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Timetable Lessons Display (Matches User Diagram) */}
        {viewMode === 'daily' ? (
          <View style={styles.lessonsContainer}>
            {filteredTimetable.length > 0 ? (
              filteredTimetable.map((item) => (
                <Card key={item.id} style={styles.diagramLessonCard}>
                  <View style={styles.lessonTopRow}>
                    <View style={styles.timeWrapper}>
                      <Ionicons name="time-outline" size={16} color={currentTheme.colors.primary} />
                      <Text style={[styles.timeText, { color: currentTheme.colors.text }]}>
                        {item.start_time}–{item.end_time}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.roomBadge,
                        {
                          backgroundColor: isDark ? '#064E3B' : '#CCFBF1',
                          borderColor: isDark ? '#047857' : '#99F6E4',
                        },
                      ]}
                    >
                      <Text style={[styles.roomText, { color: isDark ? '#6EE7B7' : '#0F766E' }]}>
                        {item.room}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.courseNameText, { color: currentTheme.colors.text }]}>
                    {item.course_name}
                  </Text>

                  <View style={styles.teacherNameRow}>
                    <Ionicons name="person" size={14} color={currentTheme.colors.muted} />
                    <Text style={[styles.teacherNameText, { color: currentTheme.colors.textSecondary }]}>
                      👨‍🏫 {teacher?.full_name || item.teacher_name}
                    </Text>
                  </View>
                </Card>
              ))
            ) : (
              <View style={[styles.noLessonsBox, { backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }]}>
                <Ionicons name="cafe-outline" size={28} color={currentTheme.colors.muted} />
                <Text style={[styles.noLessonsText, { color: currentTheme.colors.muted }]}>
                  No classes scheduled for {selectedDay}.
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Weekly View Grouped by Day */
          <View style={styles.weeklyContainer}>
            {WEEKDAYS.map((w) => {
              const dayLessons = groupedWeekly[w] || [];
              return (
                <View key={w} style={styles.weeklyDayGroup}>
                  <View style={styles.dayHeaderRow}>
                    <View style={[styles.dayLine, { backgroundColor: currentTheme.colors.border }]} />
                    <Text style={[styles.dayHeaderText, { color: currentTheme.colors.primary }]}>
                      ── {w.toUpperCase()} ──
                    </Text>
                    <View style={[styles.dayLine, { backgroundColor: currentTheme.colors.border }]} />
                  </View>

                  {dayLessons.length > 0 ? (
                    dayLessons.map((item) => (
                      <Card key={item.id} style={styles.diagramLessonCard}>
                        <View style={styles.lessonTopRow}>
                          <View style={styles.timeWrapper}>
                            <Ionicons name="time-outline" size={16} color={currentTheme.colors.primary} />
                            <Text style={[styles.timeText, { color: currentTheme.colors.text }]}>
                              {item.start_time}–{item.end_time}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.roomBadge,
                              {
                                backgroundColor: isDark ? '#064E3B' : '#CCFBF1',
                                borderColor: isDark ? '#047857' : '#99F6E4',
                              },
                            ]}
                          >
                            <Text style={[styles.roomText, { color: isDark ? '#6EE7B7' : '#0F766E' }]}>
                              {item.room}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.courseNameText, { color: currentTheme.colors.text }]}>
                          {item.course_name}
                        </Text>

                        <View style={styles.teacherNameRow}>
                          <Ionicons name="person" size={14} color={currentTheme.colors.muted} />
                          <Text style={[styles.teacherNameText, { color: currentTheme.colors.textSecondary }]}>
                            👨‍🏫 {teacher?.full_name || item.teacher_name}
                          </Text>
                        </View>
                      </Card>
                    ))
                  ) : (
                    <View style={[styles.noLessonsBox, { backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border, marginBottom: 10 }]}>
                      <Text style={[styles.noLessonsText, { color: currentTheme.colors.muted }]}>
                        Free day / No lectures on {w}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 4. Notifications Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="notifications-outline" size={18} color={currentTheme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              My Timetable Alerts
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: currentTheme.colors.danger }]}>
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
                  {
                    backgroundColor: currentTheme.colors.card,
                    borderColor: !n.is_read ? currentTheme.colors.primary : currentTheme.colors.border,
                  },
                ]}
                onPress={() => handleMarkRead(n)}
                activeOpacity={0.8}
              >
                <View style={styles.notifIconCol}>
                  <View
                    style={[
                      styles.notifIconCircle,
                      {
                        backgroundColor: !n.is_read
                          ? currentTheme.colors.primaryLight
                          : currentTheme.colors.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name={n.is_read ? 'notifications-off-outline' : 'notifications'}
                      size={18}
                      color={n.is_read ? currentTheme.colors.muted : currentTheme.colors.primary}
                    />
                  </View>
                </View>
                <View style={styles.notifTextCol}>
                  <View style={styles.notifTitleRow}>
                    <Text
                      style={[
                        styles.notifTitle,
                        { color: !n.is_read ? currentTheme.colors.text : currentTheme.colors.textSecondary },
                      ]}
                    >
                      {n.title}
                    </Text>
                    {!n.is_read && <View style={[styles.unreadDot, { backgroundColor: currentTheme.colors.danger }]} />}
                  </View>
                  <Text style={[styles.notifMessage, { color: currentTheme.colors.textSecondary }]}>
                    {n.message}
                  </Text>
                  <Text style={[styles.notifDate, { color: currentTheme.colors.muted }]}>
                    {n.created_at ? new Date(n.created_at).toLocaleString() : 'Recent'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.noNotifsBox, { backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }]}>
              <Ionicons name="checkmark-done-circle-outline" size={32} color={currentTheme.colors.muted} />
              <Text style={[styles.noNotifsText, { color: currentTheme.colors.muted }]}>
                No personal timetable alerts.
              </Text>
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
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 14,
  },
  profileTexts: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileContact: {
    fontSize: 12,
    marginTop: 2,
  },
  lockAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  lockAppText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  coursesCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  coursesCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  coursesRow: {
    marginBottom: 14,
    gap: 8,
  },
  courseItemCard: {
    padding: 14,
    marginBottom: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  courseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseItemCode: {
    fontSize: 12,
    fontWeight: '700',
  },
  courseItemName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  courseItemDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  emptyNotice: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  segmentToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  segmentBtnActive: {
    elevation: 1,
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lessonsContainer: {
    marginBottom: 14,
  },
  diagramLessonCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  lessonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  roomBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  roomText: {
    fontSize: 12,
    fontWeight: '800',
  },
  courseNameText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  teacherNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  teacherNameText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  daySection: {
    marginBottom: 16,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayLine: {
    flex: 1,
    height: 1,
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginHorizontal: 10,
  },
  weeklyContainer: {
    marginBottom: 14,
  },
  weeklyDayGroup: {
    marginBottom: 12,
  },
  noLessonsBox: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  noLessonsText: {
    fontSize: 12,
    marginTop: 6,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notificationsContainer: {
    marginBottom: 16,
  },
  notifCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  notifIconCol: {
    marginRight: 10,
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 13,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifMessage: {
    fontSize: 12,
    lineHeight: 18,
  },
  notifDate: {
    fontSize: 10,
    marginTop: 4,
  },
  noNotifsBox: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  noNotifsText: {
    fontSize: 12,
    marginTop: 6,
  },
});
