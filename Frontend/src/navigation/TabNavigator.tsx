import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TeacherManagement } from '../screens/TeacherManagement';
import { CourseManagement } from '../screens/CourseManagement';
import { TimetableManagement } from '../screens/TimetableManagement';
import { TeacherDashboard } from '../screens/TeacherDashboard';
import { AdminDashboard } from '../screens/AdminDashboard';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  // Ensure tabs have enough padding for phone navigation home keys / gesture navigation bar
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);
  const tabHeight = 60 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="TeacherManagement"
        component={TeacherManagement}
        options={{
          tabBarLabel: 'Teachers',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="CourseManagement"
        component={CourseManagement}
        options={{
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="TimetableManagement"
        component={TimetableManagement}
        options={{
          tabBarLabel: 'Timetable',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="TeacherDashboard"
        component={TeacherDashboard}
        options={{
          tabBarLabel: 'My Portal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={{
          tabBarLabel: 'Admin',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
