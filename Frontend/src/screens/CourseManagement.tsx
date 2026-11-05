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
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  Course,
} from '../api/client';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInputField } from '../components/TextInputField';
import { EmptyState } from '../components/EmptyState';
import { theme } from '../theme';

export const CourseManagement: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err: any) {
      Alert.alert('Load Error', err.message || 'Could not fetch courses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedCourseId(null);
    setCourseCode(`CS1${(courses.length + 1).toString().padStart(2, '0')}`);
    setCourseName('');
    setDescription('');
    setModalVisible(true);
  };

  const openEditModal = (course: Course) => {
    setIsEditing(true);
    setSelectedCourseId(course.id);
    setCourseCode(course.course_code);
    setCourseName(course.course_name);
    setDescription(course.description || '');
    setModalVisible(true);
  };

  const handleSaveCourse = async () => {
    if (!courseCode.trim() || !courseName.trim()) {
      Alert.alert('Validation Error', 'Course Code and Course Name are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && selectedCourseId) {
        await updateCourse(selectedCourseId, {
          course_code: courseCode.trim().toUpperCase(),
          course_name: courseName.trim(),
          description: description.trim(),
        });
        Alert.alert('Success', 'Course updated successfully.');
      } else {
        await createCourse({
          course_code: courseCode.trim().toUpperCase(),
          course_name: courseName.trim(),
          description: description.trim(),
        });
        Alert.alert('Success', 'Course registered successfully.');
      }
      setModalVisible(false);
      fetchCourses();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = (course: Course) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete ${course.course_code} - ${course.course_name}? This will also delete any related timetable entries.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCourse(course.id);
              fetchCourses();
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message);
            }
          },
        },
      ]
    );
  };

  const renderCourseCard = ({ item }: { item: Course }) => {
    const hasTeacher = !!item.assigned_teacher;

    return (
      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{item.course_code}</Text>
          </View>
          <View style={styles.actionsBox}>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={styles.iconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteCourse(item)}
              style={[styles.iconBtn, styles.deleteBtn]}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.courseName}>{item.course_name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description || 'No course description provided.'}
        </Text>

        <View style={styles.teacherSection}>
          <View style={styles.teacherRow}>
            <Ionicons
              name={hasTeacher ? 'person' : 'person-outline'}
              size={15}
              color={hasTeacher ? theme.colors.primary : theme.colors.muted}
            />
            <Text style={styles.teacherLabel}>Teacher:</Text>
            <Text
              style={[
                styles.teacherValue,
                !hasTeacher && styles.teacherUnassigned,
              ]}
            >
              {hasTeacher
                ? `${item.assigned_teacher?.full_name} (${item.assigned_teacher?.teacher_code})`
                : 'Unassigned'}
            </Text>
          </View>
          <Text style={styles.assignHint}>Assigned via Teacher screen</Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScreenHeader
          title="Courses"
          subtitle="Curriculum syllabus & teacher assignment"
          badge={`${courses.length} Registered`}
          rightActionTitle="Register"
          rightIcon={<Ionicons name="add" size={18} color={theme.colors.white} />}
          onRightAction={openCreateModal}
        />

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading curriculum courses...</Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCourseCard}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 60 },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="book-outline"
                title="No Courses Registered"
                description="Register curriculum courses to start building institutional timetable."
                actionTitle="Register Course"
                onAction={openCreateModal}
              />
            }
          />
        )}

        {/* CREATE / EDIT COURSE MODAL */}
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
                  { paddingBottom: Math.max(insets.bottom, 20) + 12 },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isEditing ? 'Edit Course' : 'Register New Course'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.muted} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <TextInputField
                    label="Course Code"
                    value={courseCode}
                    onChangeText={setCourseCode}
                    placeholder="e.g. CS101"
                    autoCapitalize="characters"
                  />
                  <TextInputField
                    label="Course Name"
                    value={courseName}
                    onChangeText={setCourseName}
                    placeholder="e.g. Java Programming"
                  />
                  <TextInputField
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Brief introduction / syllabus topics"
                    multiline
                  />

                  <View style={styles.modalButtonRow}>
                    <PrimaryButton
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setModalVisible(false)}
                      style={styles.halfButton}
                    />
                    <PrimaryButton
                      title={isEditing ? 'Save Changes' : 'Register'}
                      loading={submitting}
                      onPress={handleSaveCourse}
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  codeText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: theme.fontSize.xs,
  },
  actionsBox: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F1F5F9',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  courseName: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  teacherSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teacherLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginLeft: 6,
    marginRight: 4,
  },
  teacherValue: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.text,
  },
  teacherUnassigned: {
    color: theme.colors.warning,
    fontStyle: 'italic',
  },
  assignHint: {
    fontSize: 10,
    color: theme.colors.muted,
    fontStyle: 'italic',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: theme.spacing.md,
  },
  halfButton: {
    flex: 1,
  },
});
