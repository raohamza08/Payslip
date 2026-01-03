import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Whitelist() {
    const [emails, setEmails] = useState([]);
    const [newEmail, setNewEmail] = useState('');
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
            await api.addToWhitelist(newEmail);
            setNewEmail('');
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
                <form onSubmit={handleAdd} className="flex-row" style={{ gap: 10 }}>
                    <input
                        type="email"
                        placeholder="Enter email to whitelist..."
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        style={{ flex: 1 }}
                        required
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Adding...' : 'Add to Whitelist'}
                    </button>
                </form>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Email Address</th>
                            <th>Whitelisted On</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {emails.map(item => (
                            <tr key={item.id}>
                                <td><strong>{item.email}</strong></td>
                                <td>{new Date(item.created_at).toLocaleDateString()}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {emails.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: 20 }}>No emails whitelisted yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
