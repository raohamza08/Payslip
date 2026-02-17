import React, { useState } from 'react';
import api from '../api';

export default function PasswordConfirm({ onConfirm, onCancel, email, title = "Confirm Password", message = "Please enter your password to proceed." }) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
            setError(err.message || 'Verification failed');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ width: '400px' }}>
                <h3 style={{ marginTop: 0 }}>{title}</h3>
                <p>{message}</p>
                <form onSubmit={handleSubmit}>
                    {/* Hidden username field for accessibility/autofill */}
                    <input type="text" name="email" value={email} readOnly style={{ display: 'none' }} autoComplete="username" />
                    <div className="form-group">
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Master password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                style={{ paddingRight: '40px' }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    zIndex: 5
                                }}
                            >
                                {showPassword ? '🙈' : '🙉'}
                            </button>
                        </div>
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
