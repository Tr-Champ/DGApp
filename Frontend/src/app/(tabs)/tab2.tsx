import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminProductsCrud from '../../screens/admin/AdminProductsCrud';
import CustomerSearch from '../../screens/user/CustomerSearch';

export default function Tab2() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.is_admin === true;

    return isAdmin ? <AdminProductsCrud /> : <CustomerSearch />;
}
