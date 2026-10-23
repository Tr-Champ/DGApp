import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: Colors.primary },
                headerTintColor: '#fff',
                headerShown: false,
            }}
        />
    );
}
