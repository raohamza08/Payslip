import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSignup) {
                await api.signup(email, password);
                alert('Account created! Please login.');
                setIsSignup(false);
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

    return (
        <div className="auth-container">
            <div className="login-box">
                <div className="login-title">Payslips</div>
                <p style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
                    {isSignup ? 'Create your account' : 'Sign in to your account'}
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@euroshub.com"
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete={isSignup ? "new-password" : "current-password"}
                            required
                        />
                    </div>
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
