import React, { useState, useEffect } from 'react';
import api from '../api';
import { UserIcon, LockIcon, SaveIcon, CancelIcon } from './Icons';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [resetType, setResetType] = useState('master'); // 'master' or 'login'
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await api.getUsers();
            // Map users to ensure permissions is an array
            const mapped = (data || []).map(u => ({
                ...u,
                permissions: Array.isArray(u.permissions) ? u.permissions : []
            }));
            setUsers(mapped);
        } catch (e) {
            console.error('Failed to load users:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage('');

        if (newPassword.length < 8) {
            setMessage('Password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        try {
            if (resetType === 'master') {
                await api.resetUserMasterPassword(editingUser.email, newPassword);
                setMessage(`Master password updated for ${editingUser.email}`);
            } else {
                await api.resetUserLoginPassword(editingUser.email, newPassword);
                setMessage(`Login password updated for ${editingUser.email}`);
            }

            setEditingUser(null);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setMessage(''), 3000);
        } catch (e) {
            setMessage('Error: ' + e.message);
        }
    };

    const handleUpdateAccess = async (userId, role, permissions) => {
        try {
            await Promise.all([
                api.updateUserRole(userId, role),
                api.updateUserPermissions(userId, permissions)
            ]);
            setMessage('User access updated successfully');
            loadUsers();
            setEditingUser(null);
            setTimeout(() => setMessage(''), 3000);
        } catch (e) {
            setMessage('Error updating access: ' + e.message);
        }
    };

    const getRoleBadge = (role) => {
        const badges = {
            super_admin: { label: 'Super Admin', className: 'pending' },
            admin: { label: 'Admin', className: 'approved' },
            employee: { label: 'Employee', className: '' }
        };
        const badge = badges[role] || badges.employee;
        return <span className={`badge ${badge.className}`}>{badge.label}</span>;
    };

    return (
        <div>
            <h1>User Management</h1>
            <p style={{ marginBottom: 20, color: '#666' }}>
                Manage user accounts and reset master passwords for admin users.
            </p>

            {message && (
                <div style={{
                    padding: '12px 20px',
                    background: message.includes('Error') ? '#fee2e2' : '#dcfce7',
                    color: message.includes('Error') ? '#991b1b' : '#166534',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: `1px solid ${message.includes('Error') ? '#fca5a5' : '#86efac'}`
                }}>
                    {message}
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th style={{ textAlign: 'right', paddingRight: '40px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td><strong>{user.email}</strong></td>
                                <td>{getRoleBadge(user.role)}</td>
                                <td className="table-number">{new Date(user.created_at).toLocaleDateString()}</td>
                                <td style={{ paddingRight: '40px' }}>
                                    <div className="table-action-cell">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => {
                                                setEditingUser(user);
                                                setResetType('permissions');
                                            }}
                                        >
                                            <UserIcon />
                                            Permissions
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                setEditingUser(user);
                                                setResetType('login');
                                            }}
                                        >
                                            <LockIcon />
                                            RLP
                                        </button>
                                        {(user.role === 'admin' || user.role === 'super_admin') && (
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => {
                                                    setEditingUser(user);
                                                    setResetType('master');
                                                }}
                                            >
                                                <LockIcon />
                                                RMP
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>
                                    {loading ? 'Loading users...' : 'No users found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="card shadow" style={{ marginTop: '20px', padding: '20px' }}>
                <h3>Quick Guide</h3>
                <ul>
                    <li><strong>RLP</strong>: Resets the password used to log in to the system.</li>
                    <li><strong>RMP</strong>: Resets the security PIN for sensitive admin sections (Admins only).</li>
                </ul>
            </div>

            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '500px' }}>
                        {resetType === 'permissions' ? (
                            <AccessEditor
                                user={editingUser}
                                onSave={(role, perms) => handleUpdateAccess(editingUser.id, role, perms)}
                                onCancel={() => setEditingUser(null)}
                            />
                        ) : (
                            <>
                                <h3>Reset {resetType === 'master' ? 'Master Password' : 'Login Password'}</h3>
                                <p style={{ color: '#666', marginBottom: 20 }}>
                                    For user: <strong>{editingUser.email}</strong>
                                </p>
                                <form onSubmit={handleResetPassword}>
                                    <div className="form-group">
                                        <label>New {resetType === 'master' ? 'Master' : 'Login'} Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Minimum 8 characters"
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-type password"
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setEditingUser(null);
                                                setNewPassword('');
                                                setConfirmPassword('');
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Reset Password
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function AccessEditor({ user, onSave, onCancel }) {
    const modules = [
        { id: 'employees', label: 'Employee Management', desc: 'Add/Edit/Delete workers' },
        { id: 'payroll', label: 'Payroll & Salaries', desc: 'Process payroll and view grids' },
        { id: 'attendance', label: 'Attendance Logs', desc: 'View and Sync biometric records' },
        { id: 'reports', label: 'Reports & KPIs', desc: 'View monthly stats and analytics' },
        { id: 'expenses', label: 'Company Expenses', desc: 'Track and manage costs' },
        { id: 'performance', label: 'KPIs & Reviews', desc: 'Conduct performance reviews' },
        { id: 'assets', label: 'Asset Management', desc: 'Manage company equipment' },
        { id: 'warnings', label: 'Discipline & Warnings', desc: 'Issue and track warnings' },
        { id: 'email', label: 'Marketing/Emails', desc: 'Broadcast emails and composer' },
        { id: 'admin-leaves', label: 'Leave Approvals', desc: 'Review and approve leave requests' }
    ];

    const [role, setRole] = useState(user.role || 'employee');
    const [selected, setSelected] = useState(user.permissions || []);

    const toggle = (id) => {
        if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
        else setSelected([...selected, id]);
    };

    return (
        <div>
            <h3>Access Management: {user.email}</h3>

            <div style={{ marginBottom: '25px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>System Role</label>
                <div className="flex-row" style={{ gap: '10px' }}>
                    <button
                        className={`btn ${role === 'employee' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setRole('employee')}
                        style={{ flex: 1 }}
                    >
                        Employee
                    </button>
                    <button
                        className={`btn ${role === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setRole('admin')}
                        style={{ flex: 1 }}
                    >
                        Admin
                    </button>
                    <button
                        className={`btn ${role === 'super_admin' ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => setRole('super_admin')}
                        style={{ flex: 1 }}
                    >
                        Super Admin
                    </button>
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    {role === 'super_admin' && 'Full system access including user management.'}
                    {role === 'admin' && 'Standard HR access (Requires Master PIN for sensitive areas).'}
                    {role === 'employee' && 'Default portal access (Add module permissions below).'}
                </p>
            </div>

            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>Module Permissions</label>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                {modules.map(mod => (
                    <div
                        key={mod.id}
                        onClick={() => toggle(mod.id)}
                        style={{
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            marginBottom: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: selected.includes(mod.id) ? '#f0f9ff' : 'white',
                            borderColor: selected.includes(mod.id) ? 'var(--accent)' : '#ddd',
                            transition: 'all 0.2s'
                        }}>
                        <input
                            type="checkbox"
                            checked={selected.includes(mod.id)}
                            onChange={() => { }}
                            style={{ width: '16px', height: '16px' }}
                        />
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{mod.label}</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>{mod.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="modal-actions" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                <button className="btn btn-primary" onClick={() => onSave(role, selected)}>Save Changes</button>
            </div>
        </div>
    );
}
