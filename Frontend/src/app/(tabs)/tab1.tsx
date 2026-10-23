import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from '../../screens/admin/AdminDashboard';
import CustomerHome from '../../screens/user/CustomerHome';

export default function Tab1() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.is_admin === true;

    return isAdmin ? <AdminDashboard /> : <CustomerHome />;
}
