import React, { useState } from 'react';
import api from '../api';

export default function Setup({ onSetupComplete }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        try {
            await api.setup(email, password);
            onSetupComplete();
        } catch (e) {
            setError(e.message || 'Setup failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="login-box">
                <div className="login-title">Initial Setup</div>
                <p style={{ textAlign: 'center', marginBottom: 20 }}>Create your Super Admin account.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Super Admin Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 8 characters"
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
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                autoComplete="new-password"
                                style={{ paddingRight: '40px' }}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Account</button>
                    {error && <div className="error-msg">{error}</div>}
                </form>
            </div>
        </div>
    );
}
