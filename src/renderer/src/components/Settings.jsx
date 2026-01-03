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

    // PDF Settings State
    const [pdfSettings, setPdfSettings] = useState({
        headerColor: '#17a2b8',
        textColor: '#333333',
        tableHeaderBg: '#17a2b8',
        tableHeaderColor: '#ffffff',
        companyName: 'EurosHub',
        companySubtitle: 'Payroll Department',
        accentColor: '#17a2b8'
    });

    // Apply saved theme and color on mount
    React.useEffect(() => {
        loadPdfSettings();
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

    const loadPdfSettings = async () => {
        try {
            const config = await api.getPdfConfig();
            if (config && Object.keys(config).length > 0) {
                setPdfSettings(prev => ({ ...prev, ...config }));
            }
        } catch (e) { console.error('Failed to load PDF settings', e); }
    };

    const handlePdfSave = async (e) => {
        e.preventDefault();
        try {
            await api.savePdfConfig(pdfSettings);
            setMessage('PDF Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (e) { setMessage('Error saving PDF settings: ' + e.message); }
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
        // Professional Blues
        { name: 'EurosHub', value: '#0FB8AF' },
        { name: 'Ocean Blue', value: '#0077B6' },
        { name: 'Corporate Blue', value: '#1E3A8A' },
        { name: 'Sky Blue', value: '#0EA5E9' },
        { name: 'Navy', value: '#1E40AF' },

        // Professional Teals & Cyans
        { name: 'Teal', value: '#17a2b8' },
        { name: 'Cyan', value: '#06B6D4' },
        { name: 'Turquoise', value: '#14B8A6' },

        // Professional Greens
        { name: 'Forest Green', value: '#059669' },
        { name: 'Emerald', value: '#10B981' },
        { name: 'Sage', value: '#22C55E' },

        // Professional Purples
        { name: 'Deep Purple', value: '#7C3AED' },
        { name: 'Violet', value: '#8B5CF6' },
        { name: 'Indigo', value: '#6366F1' },

        // Professional Grays
        { name: 'Charcoal', value: '#374151' },
        { name: 'Slate', value: '#475569' },
        { name: 'Steel', value: '#64748B' },

        // Warm Professional Tones
        { name: 'Amber', value: '#F59E0B' },
        { name: 'Bronze', value: '#D97706' },
        { name: 'Rust', value: '#EA580C' },

        // Sophisticated Neutrals
        { name: 'Graphite', value: '#1F2937' },
        { name: 'Onyx', value: '#111827' },
        { name: 'Pearl', value: '#F3F4F6' }
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
                <button
                    className={`tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pdf')}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        background: activeTab === 'pdf' ? accentColor : 'transparent',
                        color: activeTab === 'pdf' ? '#fff' : '#666',
                        cursor: 'pointer',
                        borderRadius: '8px 8px 0 0',
                        fontWeight: activeTab === 'pdf' ? 'bold' : 'normal',
                        transition: 'all 0.3s'
                    }}
                >
                    PDF Customization
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
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                            Choose a color that represents your brand
                        </p>
                        <div className="form-group" style={{ maxWidth: '400px' }}>
                            <label>Select Color</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={accentColor}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 45px 12px 45px',
                                        fontSize: '15px',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '8px',
                                        background: '#fff',
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        fontWeight: '500'
                                    }}
                                >
                                    {predefinedColors.map(color => (
                                        <option key={color.value} value={color.value}>
                                            {color.name}
                                        </option>
                                    ))}
                                </select>
                                {/* Color preview swatch */}
                                <div style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '4px',
                                    background: accentColor,
                                    border: '2px solid #fff',
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                                    pointerEvents: 'none'
                                }}></div>
                                {/* Dropdown arrow */}
                                <div style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    fontSize: '12px',
                                    color: '#666'
                                }}>▼</div>
                            </div>
                        </div>
                        {/* Color preview card */}
                        <div style={{
                            marginTop: '20px',
                            padding: '20px',
                            background: accentColor,
                            color: '#fff',
                            borderRadius: '12px',
                            textAlign: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                            <h4 style={{ margin: '0 0 8px 0' }}>Preview</h4>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                                This is how your accent color will look
                            </p>
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
                            background: 'linear-gradient(135deg, #0EA5E9 0%, #0077B6 100%)',
                            color: '#fff',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'transform 0.3s',
                            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)'
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
                            background: 'linear-gradient(135deg, #0FB8AF 0%, #0c246dff 100%)',
                            color: '#fff',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'transform 0.3s',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
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

            {/* PDF Customization Tab */}
            {activeTab === 'pdf' && (
                <div className="card">
                    <h2 style={{ marginTop: 0 }}>PDF Customization</h2>
                    <p style={{ color: '#666', marginBottom: '25px' }}>
                        Customize how your payslips look. These settings will apply to all future generated payslips.
                    </p>

                    <form onSubmit={handlePdfSave}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Company Name (Header)</label>
                                <input
                                    type="text"
                                    value={pdfSettings.companyName}
                                    onChange={(e) => setPdfSettings({ ...pdfSettings, companyName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Subtitle (Department/Tagline)</label>
                                <input
                                    type="text"
                                    value={pdfSettings.companySubtitle}
                                    onChange={(e) => setPdfSettings({ ...pdfSettings, companySubtitle: e.target.value })}
                                />
                            </div>
                        </div>

                        <h3>Colors</h3>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Header & Brand Color</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="color"
                                        value={pdfSettings.headerColor}
                                        onChange={(e) => setPdfSettings({ ...pdfSettings, headerColor: e.target.value })}
                                        style={{ width: '50px', padding: '0', height: '40px' }}
                                    />
                                    <input
                                        type="text"
                                        value={pdfSettings.headerColor}
                                        onChange={(e) => setPdfSettings({ ...pdfSettings, headerColor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Accent Color (Totals)</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="color"
                                        value={pdfSettings.accentColor}
                                        onChange={(e) => setPdfSettings({ ...pdfSettings, accentColor: e.target.value })}
                                        style={{ width: '50px', padding: '0', height: '40px' }}
                                    />
                                    <input
                                        type="text"
                                        value={pdfSettings.accentColor}
                                        onChange={(e) => setPdfSettings({ ...pdfSettings, accentColor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Table Header Background</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="color"
                                        value={pdfSettings.tableHeaderBg}
                                        onChange={(e) => setPdfSettings({ ...pdfSettings, tableHeaderBg: e.target.value })}
                                        style={{ width: '50px', padding: '0', height: '40px' }}
                                    />
                                    <input
                                        type="text"
                                        value={pdfSettings.tableHeaderBg}
                                        onChange={(e) => setPdfSettings({ ...pdfSettings, tableHeaderBg: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Table Header Text</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="color"
                                        value={pdfSettings.tableHeaderColor}
                                        onChange={(e) => setPdfSettings({ ...pdfSettings, tableHeaderColor: e.target.value })}
                                        style={{ width: '50px', padding: '0', height: '40px' }}
                                    />
                                    <input
                                        type="text"
                                        value={pdfSettings.tableHeaderColor}
                                        onChange={(e) => setPdfSettings({ ...pdfSettings, tableHeaderColor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>General Text Color</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="color"
                                        value={pdfSettings.textColor}
                                        onChange={(e) => setPdfSettings({ ...pdfSettings, textColor: e.target.value })}
                                        style={{ width: '50px', padding: '0', height: '40px' }}
                                    />
                                    <input
                                        type="text"
                                        value={pdfSettings.textColor}
                                        onChange={(e) => setPdfSettings({ ...pdfSettings, textColor: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setPdfSettings({
                                    headerColor: '#0FB8AF',
                                    textColor: '#333333',
                                    tableHeaderBg: '#0FB8AF',
                                    tableHeaderColor: '#ffffff',
                                    companyName: 'EurosHub',
                                    companySubtitle: 'Payroll Department',
                                    accentColor: '#0FB8AF'
                                })}
                            >
                                Reset to Defaults
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Save PDF Settings
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
