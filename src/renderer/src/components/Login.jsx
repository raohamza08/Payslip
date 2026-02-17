import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
    const [isSignup, setIsSignup] = useState(window.location.pathname === '/signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [masterPassword, setMasterPassword] = useState('');
    const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
    const [requiresMasterPassword, setRequiresMasterPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Check if email requires master password (admin role)
    const checkEmailRole = async (emailValue) => {
        if (!isSignup || !emailValue) return;
        try {
            const result = await api.checkRole(emailValue);
            if (result.exists && (result.role === 'admin' || result.role === 'super_admin')) {
                setRequiresMasterPassword(true);
            } else {
                setRequiresMasterPassword(false);
            }
        } catch (e) {
            console.error('Failed to check role:', e);
        }
    };

    const [showPassword, setShowPassword] = useState(false);
    const [showMaster, setShowMaster] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSignup) {
                // Validate master password for admins
                if (requiresMasterPassword) {
                    if (!masterPassword || masterPassword.length < 8) {
                        setError('Master password must be at least 8 characters');
                        setLoading(false);
                        return;
                    }
                    if (masterPassword !== confirmMasterPassword) {
                        setError('Master passwords do not match');
                        setLoading(false);
                        return;
                    }
                }

                const result = await api.signup(email, password, masterPassword || null);
                alert(`Account created as ${result.role}! Please login.`);
                setIsSignup(false);
                setMasterPassword('');
                setConfirmMasterPassword('');
                setRequiresMasterPassword(false);
            } else {
                const res = await api.login(email, password);
                if (res.success) {
                    onLogin(res.user);
                }
            }
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const ToggleBtn = ({ show, onToggle }) => (
        <button
            type="button"
            onClick={onToggle}
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
            {show ? '🙈' : '🙉'}
        </button>
    );

    return (
        <div className="auth-container">
            <div className="login-box">
                <div className="login-title">EurosHub Portal</div>
                <p style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
                    {isSignup ? 'Create your account' : 'Sign in to your account'}
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (isSignup) checkEmailRole(e.target.value);
                            }}
                            onBlur={() => isSignup && checkEmailRole(email)}
                            placeholder="name@euroshub.com"
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>{isSignup ? 'Login Password' : 'Password'}</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete={isSignup ? "new-password" : "current-password"}
                                style={{ paddingRight: '40px' }}
                                required
                            />
                            <ToggleBtn show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                        </div>
                        {isSignup && <small style={{ color: '#666', fontSize: '12px' }}>Used for logging into the system</small>}
                    </div>

                    {isSignup && requiresMasterPassword && (
                        <>
                            <div className="form-group">
                                <label>Master Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showMaster ? "text" : "password"}
                                        value={masterPassword}
                                        onChange={(e) => setMasterPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        style={{ paddingRight: '40px' }}
                                        required
                                    />
                                    <ToggleBtn show={showMaster} onToggle={() => setShowMaster(!showMaster)} />
                                </div>
                                <small style={{ color: '#666', fontSize: '12px' }}>Used for accessing sensitive sections (min. 8 characters)</small>
                            </div>
                            <div className="form-group">
                                <label>Confirm Master Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showMaster ? "text" : "password"}
                                        value={confirmMasterPassword}
                                        onChange={(e) => setConfirmMasterPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        style={{ paddingRight: '40px' }}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Login')}
                    </button>
                    {error && <div className="error-msg" style={{ marginTop: 10 }}>{error}</div>}
                </form>

                <div style={{ marginTop: 20, textAlign: 'center', fontSize: '14px' }}>
                    {isSignup ? (
                        <span>Already have an account? <a href="#" onClick={() => setIsSignup(false)} style={{ color: 'var(--accent)' }}>Login</a></span>
                    ) : (
                        <span>New here? <a href="#" onClick={() => setIsSignup(true)} style={{ color: 'var(--accent)' }}>Sign up</a></span>
                    )}
                </div>
            </div>
        </div>
    );
}
