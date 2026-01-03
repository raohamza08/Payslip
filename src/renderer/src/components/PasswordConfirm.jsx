import React, { useState } from 'react';

export default function PasswordConfirm({ onConfirm, onCancel, email, title = "Confirm Password", message = "Please enter your password to proceed." }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const isValid = await api.confirmAction(email, password);
            if (isValid) {
                onConfirm();
            } else {
                setError('Incorrect password');
            }
        } catch (err) {
            setError('Verification failed');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ width: '400px' }}>
                <h3 style={{ marginTop: 0 }}>{title}</h3>
                <p>{message}</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Master password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>
                    {error && <div className="error-msg" style={{ marginBottom: 15 }}>{error}</div>}
                    <div className="flex-row flex-end">
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Confirm</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Note: I need to import api here, but since this is a new file I'll add the import
import api from '../api';
