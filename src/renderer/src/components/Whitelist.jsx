import React, { useState, useEffect } from 'react';
import api from '../api';
import { AddIcon, DeleteIcon } from './Icons';

export default function Whitelist() {
    const [emails, setEmails] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState('employee');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadWhitelist();
    }, []);

    const loadWhitelist = async () => {
        try {
            const data = await api.getWhitelist();
            setEmails(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newEmail) return;
        setLoading(true);
        try {
            await api.addToWhitelist(newEmail, selectedRole);
            setNewEmail('');
            setSelectedRole('employee');
            loadWhitelist();
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this email from whitelist?')) return;
        try {
            await api.deleteFromWhitelist(id);
            loadWhitelist();
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div>
            <h1>Signup Whitelist</h1>
            <p style={{ marginBottom: 20, color: '#666' }}>Only emails listed here will be allowed to sign up for an account.</p>

            <div className="card" style={{ marginBottom: 20 }}>
                <form onSubmit={handleAdd} className="flex-row" style={{ gap: 10, flexWrap: 'wrap' }}>
                    <input
                        type="email"
                        placeholder="Enter email to whitelist..."
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        style={{ flex: '1 1 250px' }}
                        required
                    />
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="form-control"
                        style={{ width: '150px' }}
                    >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <AddIcon />
                        {loading ? 'Adding...' : 'Add to Whitelist'}
                    </button>
                </form>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Email Address</th>
                            <th>Role</th>
                            <th>Whitelisted On</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {emails.map(item => (
                            <tr key={item.id}>
                                <td><strong>{item.email}</strong></td>
                                <td>
                                    <span className={`badge ${item.role === 'super_admin' ? 'pending' : item.role === 'admin' ? 'approved' : ''}`}>
                                        {item.role === 'super_admin' ? 'Super Admin' : item.role === 'admin' ? 'Admin' : 'Employee'}
                                    </span>
                                </td>
                                <td>{new Date(item.created_at).toLocaleDateString()}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        <DeleteIcon />
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {emails.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>No emails whitelisted yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
