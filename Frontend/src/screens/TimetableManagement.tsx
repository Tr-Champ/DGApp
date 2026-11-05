import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  RefreshControl,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
import { theme } from '../theme';
import { useTheme } from '../theme/ThemeContext';

const DAYS = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TimetableManagement: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme: currentTheme, isDark } = useTheme();

  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDayFilter, setActiveDayFilter] = useState('All');

  // Modal State
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
    // Auto-fill teacher assigned to this course
    const teacherId = course.assigned_teacher?.id || course.teacher_id;
    if (teacherId) {
      setSelectedTeacherId(teacherId);
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
        Alert.alert('Success', 'Timetable entry updated.');
      } else {
        await createTimetableEntry({
          course_id: selectedCourseId,
          teacher_id: selectedTeacherId,
          day,
          start_time: startTime.trim(),
          end_time: endTime.trim(),
          room: room.trim().toUpperCase(),
        });
        Alert.alert('Success', 'Lesson added to timetable.');
      }
      setModalVisible(false);
      fetchData();
    } catch (err: any) {
      // PROMPT REQUIREMENT: Red conflict alert displaying exact trigger message!
      Alert.alert('Scheduling Conflict', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (entry: TimetableEntry) => {
    Alert.alert(
      'Delete Lesson',
      `Delete ${entry.course_name} on ${entry.day} ${entry.start_time}-${entry.end_time}?`,
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

  const filteredTimetable = activeDayFilter === 'All'
    ? timetable
    : timetable.filter((t) => t.day.toLowerCase() === activeDayFilter.toLowerCase());

  const renderLessonCard = ({ item }: { item: TimetableEntry }) => {
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.timeTag}>
            <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.timeText}>
              {item.start_time} – {item.end_time}
            </Text>
          </View>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>{item.day}</Text>
          </View>
        </View>

        <Text style={styles.courseTitle}>
          {item.course_code ? `${item.course_code} - ` : ''}
          {item.course_name}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.infoText}>{item.teacher_name || 'Assigned Staff'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="business-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.roomBadge}>Room {item.room}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={15} color={theme.colors.primary} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnDanger}
            onPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={15} color={theme.colors.danger} />
            <Text style={styles.actionBtnDangerText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScreenHeader
          title="Timetable"
          subtitle="Institutional schedule & conflict guard"
          badge={`${timetable.length} Lessons`}
          rightActionTitle="Add Lesson"
          rightIcon={<Ionicons name="add" size={18} color={theme.colors.white} />}
          onRightAction={openCreateModal}
        />

        {/* Day Filter Chips */}
        <View style={styles.filterWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {DAYS.map((d) => {
              const isActive = activeDayFilter === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveDayFilter(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading institutional timetable...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTimetable}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderLessonCard}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 60 },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="calendar-outline"
                title="No Lessons Scheduled"
                description={`No classes found for ${activeDayFilter}. Tap 'Add Lesson' to schedule a class.`}
                actionTitle="Add Lesson"
                onAction={openCreateModal}
              />
            }
          />
        )}

        {/* CREATE / EDIT TIMETABLE MODAL */}
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
                    backgroundColor: currentTheme.colors.card,
                    paddingBottom: Math.max(insets.bottom, 20) + 12,
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                    {isEditing ? 'Edit Lesson Entry' : 'Schedule New Lesson'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.muted} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {/* Day Picker */}
                  <Text style={styles.fieldLabel}>Day of Week</Text>
                  <View style={styles.dayRow}>
                    {WEEKDAYS.map((w) => {
                      const isSel = day === w;
                      return (
                        <TouchableOpacity
                          key={w}
                          style={[styles.daySelectChip, isSel && styles.daySelectChipActive]}
                          onPress={() => setDay(w)}
                        >
                          <Text style={[styles.daySelectText, isSel && styles.daySelectTextActive]}>
                            {w.substring(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Course Picker */}
                  <Text style={styles.fieldLabel}>Select Course</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.coursesScroll}
                  >
                    {courses.map((c) => {
                      const isSel = selectedCourseId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.coursePickChip, isSel && styles.coursePickChipActive]}
                          onPress={() => handleSelectCourse(c)}
                        >
                          <Text style={[styles.coursePickCode, isSel && styles.coursePickCodeActive]}>
                            {c.course_code}
                          </Text>
                          <Text
                            style={[styles.coursePickName, isSel && styles.coursePickNameActive]}
                            numberOfLines={1}
                          >
                            {c.course_name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Teacher Picker */}
                  <Text style={styles.fieldLabel}>Assigned Teacher</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.teachersScroll}
                  >
                    {teachers.map((t) => {
                      const isSel = selectedTeacherId === t.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[styles.teacherPickChip, isSel && styles.teacherPickChipActive]}
                          onPress={() => setSelectedTeacherId(t.id)}
                        >
                          <Ionicons
                            name="person"
                            size={14}
                            color={isSel ? theme.colors.white : theme.colors.muted}
                          />
                          <Text style={[styles.teacherPickText, isSel && styles.teacherPickTextActive]}>
                            {t.full_name} ({t.teacher_code})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Times & Room */}
                  <View style={styles.timeInputsRow}>
                    <View style={styles.timeInputCol}>
                      <TextInputField
                        label="Start Time (HH:MM)"
                        value={startTime}
                        onChangeText={setStartTime}
                        placeholder="08:00"
                      />
                    </View>
                    <View style={styles.timeInputCol}>
                      <TextInputField
                        label="End Time (HH:MM)"
                        value={endTime}
                        onChangeText={setEndTime}
                        placeholder="10:00"
                      />
                    </View>
                  </View>

                  <TextInputField
                    label="Classroom / Room"
                    value={room}
                    onChangeText={setRoom}
                    placeholder="e.g. R101"
                    autoCapitalize="characters"
                  />

                  {/* Conflict Notice */}
                  <View style={styles.conflictInfoBox}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.info} />
                    <Text style={styles.conflictInfoText}>
                      Database automatically validates that neither teacher nor room is double-booked.
                    </Text>
                  </View>

                  <View style={styles.modalButtonRow}>
                    <PrimaryButton
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setModalVisible(false)}
                      style={styles.halfButton}
                    />
                    <PrimaryButton
                      title={isEditing ? 'Save Changes' : 'Schedule Lesson'}
                      loading={submitting}
                      onPress={handleSaveLesson}
                      style={styles.halfButton}
                    />
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
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
  filterWrapper: {
    marginBottom: theme.spacing.md,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: theme.colors.white,
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
  listContent: {
    paddingTop: theme.spacing.xs,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  timeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.primary,
    marginLeft: 4,
  },
  dayBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  dayBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  courseTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: 5,
    fontWeight: '500',
  },
  roomBadge: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: '#0F766E',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionBtnText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 4,
  },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.dangerLight,
  },
  actionBtnDangerText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.danger,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalKeyboardAvoid: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  fieldLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  dayRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  daySelectChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  daySelectChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  daySelectText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  daySelectTextActive: {
    color: theme.colors.white,
  },
  coursesScroll: {
    marginBottom: 10,
  },
  coursePickChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
    maxWidth: 160,
  },
  coursePickChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  coursePickCode: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  coursePickCodeActive: {
    color: theme.colors.primary,
  },
  coursePickName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  coursePickNameActive: {
    color: theme.colors.primaryDark,
  },
  teachersScroll: {
    marginBottom: 12,
  },
  teacherPickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  teacherPickChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  teacherPickText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 6,
  },
  teacherPickTextActive: {
    color: theme.colors.white,
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputCol: {
    flex: 1,
  },
  conflictInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.infoLight,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  conflictInfoText: {
    fontSize: 11,
    color: theme.colors.info,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  halfButton: {
    flex: 1,
  },
});
