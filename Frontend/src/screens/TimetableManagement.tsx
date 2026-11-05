import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  RefreshControl,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { theme as defaultTheme } from '../theme';
import {
  getTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  getCourses,
  getTeachers,
  TimetableEntry,
  Course,
  Teacher,
} from '../api/client';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInputField } from '../components/TextInputField';
import { EmptyState } from '../components/EmptyState';

const DAYS = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PRESET_TIMES = [
  { start: '08:00', end: '10:00', label: '08:00 – 10:00' },
  { start: '10:00', end: '12:00', label: '10:00 – 12:00' },
  { start: '13:00', end: '15:00', label: '13:00 – 15:00' },
  { start: '15:00', end: '17:00', label: '15:00 – 17:00' },
];
const PRESET_ROOMS = ['R101', 'R102', 'R103', 'R104', 'R105'];

export const TimetableManagement: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  const isAdmin = user?.role === 'admin';
  const currentTeacherId = user?.teacher_id;

  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDayFilter, setActiveDayFilter] = useState('All');

  // Modal State for Admin Add/Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('R101');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown Picker sheet states
  const [pickerModalType, setPickerModalType] = useState<'teacher' | 'course' | 'day' | 'time' | 'room' | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [ttRes, coursesRes, teachersRes] = await Promise.all([
        getTimetable(),
        getCourses(),
        getTeachers(),
      ]);
      setTimetable(ttRes);
      setCourses(coursesRes);
      setTeachers(teachersRes);
    } catch (err: any) {
      Alert.alert('Load Error', err.message || 'Could not load timetable data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // TEACHER ISOLATION: Teachers ONLY see their own lessons
  const visibleTimetable = !isAdmin && currentTeacherId
    ? timetable.filter((t) => t.teacher_id === currentTeacherId)
    : timetable;

  // Filter by active day chip
  const filteredTimetable = activeDayFilter === 'All'
    ? visibleTimetable
    : visibleTimetable.filter((t) => t.day.toLowerCase() === activeDayFilter.toLowerCase());

  // Group lessons by day (Monday -> Friday)
  const groupedByDay: { [key: string]: TimetableEntry[] } = {};
  const daysToDisplay = activeDayFilter === 'All' ? WEEKDAYS : [activeDayFilter];
  daysToDisplay.forEach((d) => {
    groupedByDay[d] = visibleTimetable.filter((t) => t.day.toLowerCase() === d.toLowerCase());
  });

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedEntryId(null);
    setDay(activeDayFilter === 'All' ? 'Monday' : activeDayFilter);
    setStartTime('08:00');
    setEndTime('10:00');
    setRoom('R101');

    if (courses.length > 0) {
      const firstCourse = courses[0];
      setSelectedCourseId(firstCourse.id);
      setSelectedTeacherId(firstCourse.assigned_teacher?.id || firstCourse.teacher_id || (teachers[0]?.id || 1));
    }
    setModalVisible(true);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setIsEditing(true);
    setSelectedEntryId(entry.id);
    setDay(entry.day);
    setStartTime(entry.start_time);
    setEndTime(entry.end_time);
    setRoom(entry.room);
    setSelectedCourseId(entry.course_id);
    setSelectedTeacherId(entry.teacher_id);
    setModalVisible(true);
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourseId(course.id);
    // Auto-fill teacher assigned to this course to reduce admin effort
    const teacherId = course.assigned_teacher?.id || course.teacher_id;
    if (teacherId) {
      setSelectedTeacherId(teacherId);
    }
  };

  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacherId(teacher.id);
    // If teacher has assigned courses, pre-select their first course
    if (teacher.courses && teacher.courses.length > 0) {
      setSelectedCourseId(teacher.courses[0].id);
    }
  };

  const handleSaveLesson = async () => {
    if (!selectedCourseId || !selectedTeacherId || !day || !startTime.trim() || !endTime.trim() || !room.trim()) {
      Alert.alert('Validation Error', 'All fields (Course, Teacher, Day, Times, Room) are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && selectedEntryId) {
        await updateTimetableEntry(selectedEntryId, {
          course_id: selectedCourseId,
          teacher_id: selectedTeacherId,
          day,
          start_time: startTime.trim(),
          end_time: endTime.trim(),
          room: room.trim().toUpperCase(),
        });
        Alert.alert('Success', 'Timetable entry updated successfully.');
      } else {
        await createTimetableEntry({
          course_id: selectedCourseId,
          teacher_id: selectedTeacherId,
          day,
          start_time: startTime.trim(),
          end_time: endTime.trim(),
          room: room.trim().toUpperCase(),
        });
        Alert.alert('Success', 'Lesson scheduled successfully.');
      }
      setModalVisible(false);
      fetchData();
    } catch (err: any) {
      // PROMPT REQUIREMENT: Show exact DB trigger conflict error in red alert!
      Alert.alert('Scheduling Conflict', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (entry: TimetableEntry) => {
    Alert.alert(
      'Delete Lesson',
      `Delete lesson for ${entry.course_name} on ${entry.day} ${entry.start_time}–${entry.end_time}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTimetableEntry(entry.id);
              fetchData();
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message);
            }
          },
        },
      ]
    );
  };

  const selectedTeacherObj = teachers.find((t) => t.id === selectedTeacherId);
  const selectedCourseObj = courses.find((c) => c.id === selectedCourseId);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScreenHeader
          title="Weekly Timetable"
          subtitle={
            !isAdmin && currentTeacherId
              ? `Personal schedule for ${user?.teacher_name || user?.username} (Isolated)`
              : 'Institutional schedule & conflict guard'
          }
          badge={!isAdmin ? 'My Classes' : `${timetable.length} Lessons`}
          rightActionTitle={isAdmin ? 'Add Lesson' : undefined}
          rightIcon={isAdmin ? <Ionicons name="add" size={18} color="#FFFFFF" /> : undefined}
          onRightAction={isAdmin ? openCreateModal : undefined}
        />

        {/* Day Filter Chips [All] [Mon] [Tue] [Wed] [Thu] [Fri] */}
        <View style={styles.filterWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {DAYS.map((d) => {
              const isActive = activeDayFilter === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? theme.colors.primary : theme.colors.card,
                      borderColor: isActive ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setActiveDayFilter(d)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? '#FFFFFF' : theme.colors.textSecondary },
                    ]}
                  >
                    {d === 'All' ? 'All' : d.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
              Loading weekly timetable...
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 60 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
            }
          >
            {daysToDisplay.map((dayName) => {
              const dayLessons = groupedByDay[dayName] || [];

              return (
                <View key={dayName} style={styles.daySection}>
                  {/* Day Divider Header: ── MONDAY ──────────────── */}
                  <View style={styles.dayHeaderRow}>
                    <View style={[styles.dayLine, { backgroundColor: theme.colors.border }]} />
                    <Text style={[styles.dayHeaderText, { color: theme.colors.primary }]}>
                      ── {dayName.toUpperCase()} ──
                    </Text>
                    <View style={[styles.dayLine, { backgroundColor: theme.colors.border }]} />
                  </View>

                  {dayLessons.length > 0 ? (
                    dayLessons.map((item) => (
                      /* Layout per user's prompt diagram:
                         ┌───────────────────────────────┐
                         │ 08:00–10:00          R101     │
                         │ Java Programming              │
                         │ 👨‍🏫 John                       │
                         └───────────────────────────────┘
                      */
                      <Card
                        key={item.id}
                        style={[
                          styles.lessonCard,
                          {
                            backgroundColor: theme.colors.card,
                            borderColor: theme.colors.cardBorder,
                          },
                        ]}
                      >
                        {/* Top Line: Time and Room Badge */}
                        <View style={styles.lessonTopRow}>
                          <View style={styles.timeWrapper}>
                            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                            <Text style={[styles.timeText, { color: theme.colors.text }]}>
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

                        {/* Middle Line: Course Name (Large Bold) */}
                        <Text style={[styles.courseNameText, { color: theme.colors.text }]}>
                          {item.course_name}
                        </Text>

                        {/* Bottom Line: Teacher Name */}
                        <View style={styles.lessonBottomRow}>
                          <View style={styles.teacherRow}>
                            <Ionicons name="person" size={15} color={theme.colors.muted} />
                            <Text style={[styles.teacherNameText, { color: theme.colors.textSecondary }]}>
                              {item.teacher_name || 'Assigned Teacher'}
                            </Text>
                          </View>

                          {/* Admin Edit/Delete Controls */}
                          {isAdmin && (
                            <View style={styles.adminControlsRow}>
                              <TouchableOpacity
                                style={[
                                  styles.adminIconBtn,
                                  { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                                ]}
                                onPress={() => openEditModal(item)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[styles.adminIconBtn, styles.deleteIconBtn]}
                                onPress={() => handleDelete(item)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </Card>
                    ))
                  ) : (
                    <View
                      style={[
                        styles.noClassBox,
                        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                      ]}
                    >
                      <Text style={[styles.noClassText, { color: theme.colors.muted }]}>
                        No scheduled lessons for {dayName}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {visibleTimetable.length === 0 && (
              <EmptyState
                icon="calendar-outline"
                title="No Lessons Found"
                description={
                  !isAdmin
                    ? 'No timetable lessons scheduled for your account yet.'
                    : 'The institutional timetable is empty. Tap Add Lesson to begin.'
                }
                actionTitle={isAdmin ? 'Add Lesson' : undefined}
                onAction={isAdmin ? openCreateModal : undefined}
              />
            )}
          </ScrollView>
        )}

        {/* ============================================================= */}
        {/* ADMIN ADD / EDIT TIMETABLE MODAL WITH DROPDOWNS */}
        {/* ============================================================= */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalKeyboardAvoid}
            >
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: theme.colors.card,
                    paddingBottom: Math.max(insets.bottom, 20) + 12,
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {isEditing ? 'Edit Lesson Entry' : 'Schedule New Lesson'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.muted} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {/* 1. Teacher Dropdown Picker */}
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                    1. Teacher (Dropdown)
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.dropdownTrigger,
                      { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                    ]}
                    onPress={() => setPickerModalType('teacher')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dropdownTriggerLeft}>
                      <Ionicons name="person-circle-outline" size={20} color={theme.colors.primary} />
                      <Text style={[styles.dropdownTriggerText, { color: theme.colors.text }]}>
                        {selectedTeacherObj
                          ? `${selectedTeacherObj.full_name} (${selectedTeacherObj.teacher_code})`
                          : 'Select Teacher...'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color={theme.colors.muted} />
                  </TouchableOpacity>

                  {/* 2. Course Dropdown Picker */}
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                    2. Course (Dropdown)
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.dropdownTrigger,
                      { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                    ]}
                    onPress={() => setPickerModalType('course')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dropdownTriggerLeft}>
                      <Ionicons name="book-outline" size={20} color={theme.colors.primary} />
                      <Text style={[styles.dropdownTriggerText, { color: theme.colors.text }]}>
                        {selectedCourseObj
                          ? `${selectedCourseObj.course_code}: ${selectedCourseObj.course_name}`
                          : 'Select Course...'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color={theme.colors.muted} />
                  </TouchableOpacity>

                  {/* 3. Day Dropdown Picker */}
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                    3. Day of Week
                  </Text>
                  <View style={styles.dayChipSelectorRow}>
                    {WEEKDAYS.map((w) => {
                      const isSel = day.toLowerCase() === w.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={w}
                          style={[
                            styles.dayMiniChip,
                            {
                              backgroundColor: isSel ? theme.colors.primary : theme.colors.background,
                              borderColor: isSel ? theme.colors.primary : theme.colors.border,
                            },
                          ]}
                          onPress={() => setDay(w)}
                        >
                          <Text
                            style={[
                              styles.dayMiniText,
                              { color: isSel ? '#FFFFFF' : theme.colors.textSecondary },
                            ]}
                          >
                            {w.substring(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* 4. Time Slots Quick Selector */}
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                    4. Time Slot
                  </Text>
                  <View style={styles.timeSlotsGrid}>
                    {PRESET_TIMES.map((slot) => {
                      const isSel = startTime === slot.start && endTime === slot.end;
                      return (
                        <TouchableOpacity
                          key={slot.label}
                          style={[
                            styles.timeSlotChip,
                            {
                              backgroundColor: isSel ? theme.colors.primary : theme.colors.background,
                              borderColor: isSel ? theme.colors.primary : theme.colors.border,
                            },
                          ]}
                          onPress={() => {
                            setStartTime(slot.start);
                            setEndTime(slot.end);
                          }}
                        >
                          <Text
                            style={[
                              styles.timeSlotText,
                              { color: isSel ? '#FFFFFF' : theme.colors.textSecondary },
                            ]}
                          >
                            {slot.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* 5. Classroom Quick Selector */}
                  <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                    5. Classroom / Room
                  </Text>
                  <View style={styles.roomsGrid}>
                    {PRESET_ROOMS.map((r) => {
                      const isSel = room === r;
                      return (
                        <TouchableOpacity
                          key={r}
                          style={[
                            styles.roomChip,
                            {
                              backgroundColor: isSel ? theme.colors.primary : theme.colors.background,
                              borderColor: isSel ? theme.colors.primary : theme.colors.border,
                            },
                          ]}
                          onPress={() => setRoom(r)}
                        >
                          <Text
                            style={[
                              styles.roomChipText,
                              { color: isSel ? '#FFFFFF' : theme.colors.textSecondary },
                            ]}
                          >
                            {r}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Conflict Notice */}
                  <View
                    style={[
                      styles.conflictNoticeBox,
                      {
                        backgroundColor: isDark ? '#082F49' : '#F0F9FF',
                        borderColor: isDark ? '#0284C7' : '#BAE6FD',
                      },
                    ]}
                  >
                    <Ionicons name="shield-checkmark" size={16} color={theme.colors.info} />
                    <Text style={[styles.conflictNoticeText, { color: theme.colors.info }]}>
                      Overlapping teacher or room bookings are actively blocked by PostgreSQL triggers.
                    </Text>
                  </View>

                  <View style={styles.modalButtonsRow}>
                    <PrimaryButton
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setModalVisible(false)}
                      style={styles.halfBtn}
                    />
                    <PrimaryButton
                      title={isEditing ? 'Save Changes' : 'Schedule Lesson'}
                      loading={submitting}
                      onPress={handleSaveLesson}
                      style={styles.halfBtn}
                    />
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* ============================================================= */}
        {/* DROPDOWN PICKER BOTTOM SHEET MODAL (TEACHER OR COURSE) */}
        {/* ============================================================= */}
        <Modal
          visible={pickerModalType !== null}
          animationType="fade"
          transparent
          onRequestClose={() => setPickerModalType(null)}
        >
          <View style={styles.pickerOverlay}>
            <View
              style={[
                styles.pickerSheet,
                {
                  backgroundColor: theme.colors.card,
                  paddingBottom: Math.max(insets.bottom, 20) + 12,
                },
              ]}
            >
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
                  {pickerModalType === 'teacher' ? 'Select Teacher' : 'Select Course'}
                </Text>
                <TouchableOpacity onPress={() => setPickerModalType(null)}>
                  <Ionicons name="close" size={24} color={theme.colors.muted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.pickerList}>
                {pickerModalType === 'teacher' &&
                  teachers.map((t) => {
                    const isSelected = selectedTeacherId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[
                          styles.pickerItem,
                          {
                            backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.background,
                            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          },
                        ]}
                        onPress={() => {
                          handleSelectTeacher(t);
                          setPickerModalType(null);
                        }}
                      >
                        <Ionicons
                          name="person"
                          size={18}
                          color={isSelected ? theme.colors.primary : theme.colors.muted}
                        />
                        <View style={styles.pickerItemTextCol}>
                          <Text style={[styles.pickerItemMain, { color: theme.colors.text }]}>
                            {t.full_name} ({t.teacher_code})
                          </Text>
                          <Text style={[styles.pickerItemSub, { color: theme.colors.muted }]}>
                            {t.courses && t.courses.length > 0
                              ? `Assigned: ${t.courses.map((c) => c.course_code).join(', ')}`
                              : 'No courses allocated'}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                {pickerModalType === 'course' &&
                  courses.map((c) => {
                    const isSelected = selectedCourseId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.pickerItem,
                          {
                            backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.background,
                            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          },
                        ]}
                        onPress={() => {
                          handleSelectCourse(c);
                          setPickerModalType(null);
                        }}
                      >
                        <Ionicons
                          name="book"
                          size={18}
                          color={isSelected ? theme.colors.primary : theme.colors.muted}
                        />
                        <View style={styles.pickerItemTextCol}>
                          <Text style={[styles.pickerItemMain, { color: theme.colors.text }]}>
                            {c.course_code}: {c.course_name}
                          </Text>
                          <Text style={[styles.pickerItemSub, { color: theme.colors.muted }]}>
                            {c.assigned_teacher
                              ? `Teacher: ${c.assigned_teacher.full_name}`
                              : 'Unassigned'}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
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
  filterWrapper: {
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
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
  listContent: {
    paddingTop: 6,
  },
  daySection: {
    marginBottom: 20,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  lessonCard: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
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
  lessonBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teacherNameText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  adminControlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adminIconBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  deleteIconBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  noClassBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noClassText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalKeyboardAvoid: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 4,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  dayChipSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  dayMiniChip: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  dayMiniText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  timeSlotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roomsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  roomChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  roomChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  conflictNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  conflictNoticeText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  halfBtn: {
    flex: 1,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '65%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  pickerList: {
    maxHeight: 320,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  pickerItemTextCol: {
    marginLeft: 10,
    flex: 1,
  },
  pickerItemMain: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerItemSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
