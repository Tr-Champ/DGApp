import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminReports from '../../screens/admin/AdminReports';
import CustomerOrders from '../../screens/user/CustomerOrders';

export default function Tab4() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.is_admin === true;

    return isAdmin ? <AdminReports /> : <CustomerOrders />;
}
