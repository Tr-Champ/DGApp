import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.is_admin === true;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 6,
                },
                headerStyle: {
                    backgroundColor: Colors.primary,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                },
            }}
        >
            <Tabs.Screen
                name="tab1"
                options={{
                    title: isAdmin ? 'Dashboard' : 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name={isAdmin ? 'grid-outline' : 'home-outline'}
                            size={size}
                            color={color as string}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="tab2"
                options={{
                    title: isAdmin ? 'Products' : 'Search',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name={isAdmin ? 'cube-outline' : 'search-outline'}
                            size={size}
                            color={color as string}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="tab3"
                options={{
                    title: isAdmin ? 'Deliveries' : 'Cart',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name={isAdmin ? 'checkmark-done-circle-outline' : 'cart-outline'}
                            size={size}
                            color={color as string}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="tab4"
                options={{
                    title: isAdmin ? 'Reports' : 'Orders',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name={isAdmin ? 'bar-chart-outline' : 'list-outline'}
                            size={size}
                            color={color as string}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="person-outline"
                            size={size}
                            color={color as string}
                        />
                    ),
                }}
            />
            {/* Hidden legacy tab redirects so old deep links don't break */}
            <Tabs.Screen
                name="index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}