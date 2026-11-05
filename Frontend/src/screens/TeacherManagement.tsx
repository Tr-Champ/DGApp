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
  getTeachers,
  createTeacher,
  updateTeacher,
  assignCourses,
  getCourses,
  Teacher,
  Course,
} from '../api/client';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInputField } from '../components/TextInputField';
import { EmptyState } from '../components/EmptyState';
import { theme } from '../theme';

export const TeacherManagement: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create / Edit Teacher Modal state
  const [teacherModalVisible, setTeacherModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [teacherCode, setTeacherCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Assign Courses Modal state
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState<Teacher | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [teachersRes, coursesRes] = await Promise.all([
        getTeachers(),
        getCourses(),
      ]);
      setTeachers(teachersRes);
      setAllCourses(coursesRes);
    } catch (err: any) {
      Alert.alert('Load Error', err.message || 'Could not fetch teachers.');
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

  // Open Create Teacher Modal
  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedTeacherId(null);
    setTeacherCode(`T00${teachers.length + 1}`);
    setFullName('');
    setPhone('');
    setEmail('');
    setTeacherModalVisible(true);
  };

  // Open Edit Teacher Modal
  const openEditModal = (teacher: Teacher) => {
    setIsEditing(true);
    setSelectedTeacherId(teacher.id);
    setTeacherCode(teacher.teacher_code);
    setFullName(teacher.full_name);
    setPhone(teacher.phone);
    setEmail(teacher.email);
    setTeacherModalVisible(true);
  };

  // Handle Save Teacher
  const handleSaveTeacher = async () => {
    if (!teacherCode.trim() || !fullName.trim() || !phone.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (isEditing && selectedTeacherId) {
        await updateTeacher(selectedTeacherId, {
          teacher_code: teacherCode.trim(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        });
        Alert.alert('Success', 'Teacher updated successfully.');
      } else {
        await createTeacher({
          teacher_code: teacherCode.trim(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        });
        Alert.alert('Success', 'Teacher registered successfully.');
      }
      setTeacherModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Course Assignment Modal
  const openAssignModal = (teacher: Teacher) => {
    setAssigningTeacher(teacher);
    const initialIds = teacher.courses ? teacher.courses.map((c) => c.id) : [];
    setSelectedCourseIds(initialIds);
    setAssignModalVisible(true);
  };

  // Toggle course selection (strict maximum of 2)
  const toggleCourseSelection = (courseId: number) => {
    if (selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
    } else {
      if (selectedCourseIds.length >= 2) {
        Alert.alert('Course Limit', 'A teacher can be assigned EXACTLY two (2) courses.');
        return;
      }
      setSelectedCourseIds([...selectedCourseIds, courseId]);
    }
  };

  // Save Course Assignment
  const handleSaveCourseAssignment = async () => {
    if (!assigningTeacher) return;
    if (selectedCourseIds.length !== 2) {
      Alert.alert('Course Requirement', 'Please select EXACTLY two (2) courses.');
      return;
    }

    setAssignSubmitting(true);
    try {
      await assignCourses(assigningTeacher.id, selectedCourseIds);
      Alert.alert('Success', `2 courses assigned to ${assigningTeacher.full_name}.`);
      setAssignModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Assignment Error', err.message);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const renderTeacherCard = ({ item }: { item: Teacher }) => {
    const assignedCourses = item.courses || [];

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.teacherBadge}>
            <Text style={styles.teacherCodeText}>{item.teacher_code}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.teacherName}>{item.full_name}</Text>
            <Text style={styles.contactText}>
              <Ionicons name="mail-outline" size={13} color={theme.colors.muted} /> {item.email}
            </Text>
            <Text style={styles.contactText}>
              <Ionicons name="call-outline" size={13} color={theme.colors.muted} /> {item.phone}
            </Text>
          </View>
        </View>

        {/* Assigned Courses Section */}
        <View style={styles.assignedSection}>
          <View style={styles.assignedHeader}>
            <Text style={styles.assignedTitle}>Assigned Courses ({assignedCourses.length}/2):</Text>
            {assignedCourses.length === 2 ? (
              <View style={styles.tagComplete}>
                <Ionicons name="checkmark-circle" size={12} color={theme.colors.success} />
                <Text style={styles.tagCompleteText}>Allocated</Text>
              </View>
            ) : (
              <View style={styles.tagIncomplete}>
                <Ionicons name="alert-circle" size={12} color={theme.colors.warning} />
                <Text style={styles.tagIncompleteText}>Needs 2</Text>
              </View>
            )}
          </View>

          {assignedCourses.length > 0 ? (
            <View style={styles.coursesGrid}>
              {assignedCourses.map((c) => (
                <View key={c.id} style={styles.courseChip}>
                  <Text style={styles.courseChipCode}>{c.course_code}</Text>
                  <Text style={styles.courseChipName} numberOfLines={1}>
                    {c.course_name}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noCoursesText}>No courses assigned yet.</Text>
          )}
        </View>

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.actionBtnOutlineText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => openAssignModal(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="link-outline" size={16} color={theme.colors.white} />
            <Text style={styles.actionBtnPrimaryText}>Assign Courses</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScreenHeader
          title="Teachers"
          subtitle="Registered staff & course allocations"
          badge={`${teachers.length} Registered`}
          rightActionTitle="Register"
          rightIcon={<Ionicons name="add" size={18} color={theme.colors.white} />}
          onRightAction={openCreateModal}
        />

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading registered teachers...</Text>
          </View>
        ) : (
          <FlatList
            data={teachers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTeacherCard}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 60 },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title="No Teachers Found"
                description="Register teachers to start scheduling classes."
                actionTitle="Register Teacher"
                onAction={openCreateModal}
              />
            }
          />
        )}

        {/* CREATE / EDIT TEACHER MODAL */}
        <Modal
          visible={teacherModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setTeacherModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalKeyboardAvoid}
            >
              <View
                style={[
                  styles.modalContent,
                  { paddingBottom: Math.max(insets.bottom, 20) + 12 },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isEditing ? 'Edit Teacher Details' : 'Register New Teacher'}
                  </Text>
                  <TouchableOpacity onPress={() => setTeacherModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.muted} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <TextInputField
                    label="Teacher Code"
                    value={teacherCode}
                    onChangeText={setTeacherCode}
                    placeholder="e.g. T006"
                  />
                  <TextInputField
                    label="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Dr. Robert Mugabe"
                  />
                  <TextInputField
                    label="Phone Number"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="e.g. 0788123456"
                    keyboardType="phone-pad"
                  />
                  <TextInputField
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="e.g. robert@abc.edu"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <View style={styles.modalButtonRow}>
                    <PrimaryButton
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setTeacherModalVisible(false)}
                      style={styles.halfButton}
                    />
                    <PrimaryButton
                      title={isEditing ? 'Save Changes' : 'Register'}
                      loading={formSubmitting}
                      onPress={handleSaveTeacher}
                      style={styles.halfButton}
                    />
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* ASSIGN EXACTLY 2 COURSES MODAL */}
        <Modal
          visible={assignModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setAssignModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                styles.assignModalContent,
                { paddingBottom: Math.max(insets.bottom, 20) + 12 },
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Assign Exactly 2 Courses</Text>
                  <Text style={styles.modalSub}>
                    Teacher: {assigningTeacher?.full_name} ({assigningTeacher?.teacher_code})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.selectionCounterBox}>
                <Ionicons
                  name={selectedCourseIds.length === 2 ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                  color={selectedCourseIds.length === 2 ? theme.colors.success : theme.colors.primary}
                />
                <Text style={styles.selectionCounterText}>
                  Selected: {selectedCourseIds.length} of 2 required
                </Text>
              </View>

              <ScrollView style={styles.coursesSelectScroll} showsVerticalScrollIndicator={false}>
                {allCourses.map((c) => {
                  const isSelected = selectedCourseIds.includes(c.id);
                  const isAssignedToOther =
                    c.assigned_teacher &&
                    c.assigned_teacher.id !== assigningTeacher?.id;

                  return (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.8}
                      onPress={() => toggleCourseSelection(c.id)}
                      style={[
                        styles.courseSelectItem,
                        isSelected && styles.courseSelectItemActive,
                      ]}
                    >
                      <View style={styles.courseSelectLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxActive,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                          )}
                        </View>
                        <View style={styles.courseSelectTexts}>
                          <Text style={styles.courseSelectCode}>{c.course_code}</Text>
                          <Text style={styles.courseSelectName}>{c.course_name}</Text>
                          {isAssignedToOther && (
                            <Text style={styles.reassignHint}>
                              Currently with: {c.assigned_teacher?.full_name} (will reassign)
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.modalButtonRow}>
                <PrimaryButton
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setAssignModalVisible(false)}
                  style={styles.halfButton}
                />
                <PrimaryButton
                  title="Save Allocation"
                  loading={assignSubmitting}
                  disabled={selectedCourseIds.length !== 2}
                  onPress={handleSaveCourseAssignment}
                  style={styles.halfButton}
                />
              </View>
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
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
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
    alignItems: 'flex-start',
  },
  teacherBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginRight: 12,
  },
  teacherCodeText: {
    fontWeight: '700',
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
  },
  headerInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  contactText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 2,
  },
  assignedSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  assignedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignedTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagCompleteText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.success,
    marginLeft: 3,
  },
  tagIncomplete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagIncompleteText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.warning,
    marginLeft: 3,
  },
  coursesGrid: {
    gap: 6,
  },
  courseChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  courseChipCode: {
    fontWeight: '700',
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    marginRight: 6,
  },
  courseChipName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    flex: 1,
  },
  noCoursesText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionBtnOutlineText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  actionBtnPrimaryText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
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
    maxHeight: '85%',
  },
  assignModalContent: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalSub: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginTop: 2,
  },
  selectionCounterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  selectionCounterText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 8,
  },
  coursesSelectScroll: {
    maxHeight: 340,
    marginBottom: theme.spacing.lg,
  },
  courseSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginBottom: 8,
    backgroundColor: theme.colors.card,
  },
  courseSelectItemActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  courseSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  courseSelectTexts: {
    flex: 1,
  },
  courseSelectCode: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  courseSelectName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reassignHint: {
    fontSize: 11,
    color: theme.colors.warning,
    marginTop: 2,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: theme.spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
});
