import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { DevIcon } from '../../components/DevInfoModal';

export default function TabLayout() {
    const { user } = useAuth();
    const { cartCount } = useCart();
    const isAdmin = user?.role === 'admin' || user?.is_admin === true;
    const insets = useSafeAreaInsets();

    // Dynamically calculate bottom padding to avoid phones' soft navigation bar (Back/Home/Recents)
    // On devices like Samsung where the user can show/hide keys, insets.bottom updates automatically
    const isAndroid = Platform.OS === 'android';
    const bottomPadding = insets.bottom > 0 ? insets.bottom : (isAndroid ? 10 : 6);
    const tabHeight = 54 + bottomPadding;

    return (
        <Tabs
            backBehavior="history"
            screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarHideOnKeyboard: true,
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: tabHeight,
                    paddingBottom: bottomPadding,
                    paddingTop: 6,
                    elevation: 10,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 2,
                },
                headerStyle: {
                    backgroundColor: Colors.primary,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                },
                headerRight: () => <DevIcon />,
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
                    tabBarBadge: !isAdmin && cartCount > 0 ? cartCount : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: '700',
                    },
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
            {/* Root index redirect so /(tabs) routes smoothly to tab1 */}
            <Tabs.Screen
                name="index"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}