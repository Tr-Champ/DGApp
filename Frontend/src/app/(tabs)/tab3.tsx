import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminConfirmOrders from '../../screens/admin/AdminConfirmOrders';
import CustomerCart from '../../screens/user/CustomerCart';

export default function Tab3() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.is_admin === true;

    return isAdmin ? <AdminConfirmOrders /> : <CustomerCart />;
}
