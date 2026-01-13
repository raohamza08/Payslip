import React, { useState, useEffect } from 'react';
import api from '../api';

export default function UserManagement() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        // Mock or real fetch
        // api.getUsers().then(setUsers);
        // Since we don't have a getUsers API exposed yet, we'll placeholder it.
    }, []);

    return (
        <div className="p-20">
            <h1>User Management</h1>
            <p>To manage user roles (Admin vs Employee), please use the Supabase Dashboard or Database Access for now.</p>
            <p>Future update will allow direct role management here.</p>
            <div className="card shadow" style={{ marginTop: '20px', padding: '20px' }}>
                <h3>Quick Guide</h3>
                <ul>
                    <li><strong>Super Admin</strong>: Full access to everything.</li>
                    <li><strong>Admin</strong>: Access to HR/Payroll but no Logs/Whitelist.</li>
                    <li><strong>Employee</strong>: Portal access only.</li>
                </ul>
            </div>
        </div>
    );
}
