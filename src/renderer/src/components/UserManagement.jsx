import React, { useState, useEffect } from 'react';
import api from '../api';

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
            setUsers(data || []);
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
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td><strong>{user.email}</strong></td>
                                <td>{getRoleBadge(user.role)}</td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ marginRight: 5 }}
                                        onClick={() => {
                                            setEditingUser(user);
                                            setResetType('login');
                                        }}
                                    >
                                        Reset Login PW
                                    </button>
                                    {(user.role === 'admin' || user.role === 'super_admin') && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                setEditingUser(user);
                                                setResetType('master');
                                            }}
                                        >
                                            Reset Master PW
                                        </button>
                                    )}
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
                    <li><strong>Reset Login PW</strong>: Resets the password used to log in to the system.</li>
                    <li><strong>Reset Master PW</strong>: Resets the security PIN for sensitive admin sections (Admins only).</li>
                </ul>
            </div>

            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '500px' }}>
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
                    </div>
                </div>
            )}
        </div>
    );
}
