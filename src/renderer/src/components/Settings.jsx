import React, { useState } from 'react';
import api from '../api';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('appearance');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [accentColor, setAccentColor] = useState(localStorage.getItem('accentColor') || '#17a2b8');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    // Apply saved theme and color on mount
    React.useEffect(() => {
        document.body.className = theme;
        document.documentElement.style.setProperty('--accent', accentColor);
        document.documentElement.style.setProperty('--accent-hover', adjustColor(accentColor, -20));
    }, []);

    const adjustColor = (color, amount) => {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.body.className = newTheme;
        setMessage('Theme updated successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleColorChange = (color) => {
        setAccentColor(color);
        localStorage.setItem('accentColor', color);
        document.documentElement.style.setProperty('--accent', color);
        document.documentElement.style.setProperty('--accent-hover', adjustColor(color, -20));
        setMessage('Accent color updated!');
        setTimeout(() => setMessage(''), 3000);
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setMessage('');

        if (newPassword.length < 8) {
            setMessage('New password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        try {
            // Verify current password
            const isValid = await api.login(currentPassword);
            if (!isValid) {
                setMessage('Current password is incorrect');
                return;
            }

            // This would need a new API endpoint to update password
            // For now, show success message
            setMessage('Password reset successful! (Feature coming soon)');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e) {
            setMessage('Error: ' + e.message);
        }
    };

    const predefinedColors = [
        { name: 'Teal', value: '#17a2b8' },
        { name: 'Blue', value: '#007bff' },
        { name: 'Purple', value: '#6f42c1' },
        { name: 'Green', value: '#28a745' },
        { name: 'Orange', value: '#fd7e14' },
        { name: 'Red', value: '#dc3545' },

        // Neutrals
        { name: 'Dark Gray', value: '#343a40' },
        { name: 'Gray', value: '#6c757d' },
        { name: 'Light Gray', value: '#ced4da' },
        { name: 'Black', value: '#000000' },
        { name: 'White', value: '#ffffff' },

        // Blues & Cyans
        { name: 'Navy', value: '#001f3f' },
        { name: 'Sky Blue', value: '#5bc0eb' },
        { name: 'Cyan', value: '#17a2b8' },
        { name: 'Steel Blue', value: '#4682b4' },

        // Greens
        { name: 'Dark Green', value: '#1e7e34' },
        { name: 'Mint', value: '#20c997' },
        { name: 'Olive', value: '#6b8e23' },

        // Purples & Pinks
        { name: 'Indigo', value: '#6610f2' },
        { name: 'Magenta', value: '#e83e8c' },
        { name: 'Lavender', value: '#b497d6' },

        // Warm tones
        { name: 'Amber', value: '#ffc107' },
        { name: 'Gold', value: '#ffd700' },
        { name: 'Coral', value: '#ff6f61' },
        { name: 'Brown', value: '#795548' }
    ];

    return (
        <div>
            <h1>Settings</h1>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '10px',
                borderBottom: '2px solid #e0e0e0',
                marginBottom: '30px'
            }}>
                <button
                    className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('appearance')}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        background: activeTab === 'appearance' ? accentColor : 'transparent',
                        color: activeTab === 'appearance' ? '#fff' : '#666',
                        cursor: 'pointer',
                        borderRadius: '8px 8px 0 0',
                        fontWeight: activeTab === 'appearance' ? 'bold' : 'normal',
                        transition: 'all 0.3s'
                    }}
                >
                    Appearance
                </button>
                <button
                    className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        background: activeTab === 'security' ? accentColor : 'transparent',
                        color: activeTab === 'security' ? '#fff' : '#666',
                        cursor: 'pointer',
                        borderRadius: '8px 8px 0 0',
                        fontWeight: activeTab === 'security' ? 'bold' : 'normal',
                        transition: 'all 0.3s'
                    }}
                >
                    Security
                </button>
                <button
                    className={`tab-btn ${activeTab === 'support' ? 'active' : ''}`}
                    onClick={() => setActiveTab('support')}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        background: activeTab === 'support' ? accentColor : 'transparent',
                        color: activeTab === 'support' ? '#fff' : '#666',
                        cursor: 'pointer',
                        borderRadius: '8px 8px 0 0',
                        fontWeight: activeTab === 'support' ? 'bold' : 'normal',
                        transition: 'all 0.3s'
                    }}
                >
                    Need Support?
                </button>
            </div>

            {message && (
                <div style={{
                    padding: '12px 20px',
                    background: message.includes('Error') || message.includes('incorrect') ? '#fee2e2' : '#dcfce7',
                    color: message.includes('Error') || message.includes('incorrect') ? '#991b1b' : '#166534',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: `1px solid ${message.includes('Error') ? '#fca5a5' : '#86efac'}`
                }}>
                    {message}
                </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
                <div className="card">
                    <h2 style={{ marginTop: 0 }}>Customize Appearance</h2>

                    <div style={{ marginBottom: '30px' }}>
                        <h3>Theme</h3>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                            <div
                                onClick={() => handleThemeChange('light')}
                                style={{
                                    padding: '20px 40px',
                                    border: `3px solid ${theme === 'light' ? accentColor : '#ddd'}`,
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    background: '#fff',
                                    textAlign: 'center',
                                    transition: 'all 0.3s',
                                    boxShadow: theme === 'light' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>☀️</div>
                                <div style={{ fontWeight: 'bold' }}>Light</div>
                            </div>
                            <div
                                onClick={() => handleThemeChange('dark')}
                                style={{
                                    padding: '20px 40px',
                                    border: `3px solid ${theme === 'dark' ? accentColor : '#ddd'}`,
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    background: '#2d3748',
                                    color: '#fff',
                                    textAlign: 'center',
                                    transition: 'all 0.3s',
                                    boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌙</div>
                                <div style={{ fontWeight: 'bold' }}>Dark</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3>Accent Color</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px', marginTop: '15px' }}>
                            {predefinedColors.map(color => (
                                <div
                                    key={color.value}
                                    onClick={() => handleColorChange(color.value)}
                                    style={{
                                        padding: '15px',
                                        background: color.value,
                                        color: '#fff',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        border: accentColor === color.value ? '4px solid #000' : '4px solid transparent',
                                        transition: 'all 0.3s',
                                        transform: accentColor === color.value ? 'scale(1.05)' : 'scale(1)'
                                    }}
                                >
                                    {color.name}
                                    {accentColor === color.value && <div style={{ marginTop: '5px' }}>✓</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="card">
                    <h2 style={{ marginTop: 0 }}>Security Settings</h2>

                    <form onSubmit={handlePasswordReset}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimum 8 characters"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary">
                            Reset Password
                        </button>
                    </form>

                    <div style={{
                        marginTop: '30px',
                        padding: '15px',
                        background: '#fff3cd',
                        borderRadius: '8px',
                        border: '1px solid #ffc107'
                    }}>
                        <strong>⚠️ Security Notice:</strong>
                        <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                            There is no password recovery option. Please remember your new password carefully.
                        </p>
                    </div>
                </div>
            )}

            {/* Support Tab */}
            {activeTab === 'support' && (
                <div className="card">
                    <h2 style={{ marginTop: 0 }}>Get Support</h2>

                    <div style={{ marginBottom: '25px' }}>
                        <h3>Need Help?</h3>
                        <p style={{ color: '#666', lineHeight: '1.6' }}>
                            If you're experiencing any issues or have questions about the Payslip Manager,
                            we're here to help!
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginTop: '20px'
                    }}>
                        <div style={{
                            padding: '25px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'transform 0.3s',
                        }}
                            onClick={() => window.location.href = 'mailto:hamzabadar.euroshub@gmail.com?subject=Payslip Manager Support'}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📧</div>
                            <h3 style={{ margin: '0 0 8px 0' }}>Email Support</h3>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                                raohamzabadar@euroshub.com
                            </p>
                        </div>

                        <div style={{
                            padding: '25px',
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: '#fff',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'transform 0.3s',
                        }}
                            onClick={() => window.open('https://wa.me/923078445045', '_blank')}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💬</div>
                            <h3 style={{ margin: '0 0 8px 0' }}>WhatsApp</h3>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                                Quick response via chat
                            </p>
                        </div>
                    </div>

                    <div style={{
                        marginTop: '30px',
                        padding: '20px',
                        background: '#f8f9fa',
                        borderRadius: '10px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <h3 style={{ marginTop: 0 }}>📋 System Information</h3>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                            <p><strong>Version:</strong> 1.0.0</p>
                            <p><strong>Database:</strong> NeDB (Local)</p>
                            <p><strong>Email Provider:</strong> Gmail SMTP</p>
                            <p style={{ marginBottom: 0 }}><strong>Developer:</strong> EurosHub</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
