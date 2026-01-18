import React, { useState } from 'react';
import api from '../api';

export default function Settings({ user }) {
    const [activeTab, setActiveTab] = useState('appearance');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [accentColor, setAccentColor] = useState(localStorage.getItem('accentColor') || '#0FB8AF');
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

    const [neonColor, setNeonColor] = useState(localStorage.getItem('neonColor') || '#0075FF');
    const [neonIntensity, setNeonIntensity] = useState(localStorage.getItem('neonIntensity') || '0.15');
    const [neonSize, setNeonSize] = useState(localStorage.getItem('neonSize') || '40');
    const [neonX, setNeonX] = useState(localStorage.getItem('neonX') || '10');
    const [neonY, setNeonY] = useState(localStorage.getItem('neonY') || '10');
    const [neonShape, setNeonShape] = useState(localStorage.getItem('neonShape') || 'circular');

    const updateBodyClass = (t, s) => {
        document.body.className = `${t} neon-${s}`;
    };

    // Apply saved theme and color on mount
    React.useEffect(() => {
        loadPdfSettings();
        updateBodyClass(theme, neonShape);
        document.body.style.setProperty('--accent', accentColor);
        document.body.style.setProperty('--accent-hover', adjustColor(accentColor, -20));

        // Load Neon Settings
        document.body.style.setProperty('--neon-color', neonColor);
        document.body.style.setProperty('--neon-intensity', neonIntensity);
        document.body.style.setProperty('--neon-size', `${neonSize}%`);
        document.body.style.setProperty('--neon-position', `${neonX}% ${neonY}%`);
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
        updateBodyClass(newTheme, neonShape);
        setMessage('Theme updated successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleColorChange = (color) => {
        setAccentColor(color);
        localStorage.setItem('accentColor', color);
        document.body.style.setProperty('--accent', color);
        document.body.style.setProperty('--accent-hover', adjustColor(color, -20));
        document.body.style.setProperty('--accent-glow', `${color}66`); // 40% opacity glow
        setMessage('Accent color updated!');
        setTimeout(() => setMessage(''), 3000);
    };

    const updateNeonSetting = (key, value) => {
        switch (key) {
            case 'color':
                setNeonColor(value);
                localStorage.setItem('neonColor', value);
                document.body.style.setProperty('--neon-color', value);
                break;
            case 'intensity':
                setNeonIntensity(value);
                localStorage.setItem('neonIntensity', value);
                document.body.style.setProperty('--neon-intensity', value);
                break;
            case 'size':
                setNeonSize(value);
                localStorage.setItem('neonSize', value);
                document.body.style.setProperty('--neon-size', `${value}%`);
                break;
            case 'x':
                setNeonX(value);
                localStorage.setItem('neonX', value);
                document.body.style.setProperty('--neon-position', `${value}% ${neonY}%`);
                break;
            case 'y':
                setNeonY(value);
                localStorage.setItem('neonY', value);
                document.body.style.setProperty('--neon-position', `${neonX}% ${value}%`);
                break;
            case 'shape':
                setNeonShape(value);
                localStorage.setItem('neonShape', value);
                updateBodyClass(theme, value);
                break;
        }
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
            // Get current user email from the user prop
            const userEmail = user?.email || api.getUserEmail();
            if (!userEmail) {
                setMessage('Error: User email not found');
                return;
            }

            // Change password using the new API
            const success = await api.changePassword(userEmail, currentPassword, newPassword);

            if (success) {
                setMessage('Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage('Current password is incorrect');
            }
        } catch (e) {
            setMessage('Error: ' + e.message);
        }
    };

    const predefinedColors = [
        // Professional Blues
        { name: 'EuroShub', value: '#0FB8AF' },
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
            <div className="tab-nav">
                <button
                    className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('appearance')}
                >
                    Appearance
                </button>
                <button
                    className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    Security
                </button>
                <button
                    className={`tab-btn ${activeTab === 'support' ? 'active' : ''}`}
                    onClick={() => setActiveTab('support')}
                >
                    Need Support?
                </button>
                {user?.role !== 'employee' && (
                    <button
                        className={`tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pdf')}
                    >
                        PDF Customization
                    </button>
                )}
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
                                    padding: '8px 24px',
                                    border: `2px solid ${theme === 'light' ? accentColor : 'var(--glass-border)'}`,
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    background: theme === 'light' ? 'rgba(255,255,255,0.9)' : 'var(--glass-bg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.3s',
                                    boxShadow: theme === 'light' ? `0 4px 15px ${accentColor}33` : 'none'
                                }}
                            >
                                <div style={{ fontSize: '18px' }}>☀️</div>
                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#333' }}>Light</div>
                            </div>
                            <div
                                onClick={() => handleThemeChange('dark')}
                                style={{
                                    padding: '8px 24px',
                                    border: `2px solid ${theme === 'dark' ? accentColor : 'var(--glass-border)'}`,
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    background: theme === 'dark' ? 'rgba(26, 32, 44, 0.9)' : 'var(--glass-bg)',
                                    color: theme === 'dark' ? '#fff' : 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.3s',
                                    boxShadow: theme === 'dark' ? `0 4px 15px ${accentColor}33` : 'none'
                                }}
                            >
                                <div style={{ fontSize: '18px' }}>🌙</div>
                                <div style={{ fontWeight: '700', fontSize: '14px' }}>Dark</div>
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
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '10px',
                                        background: 'var(--bg-top)',
                                        color: 'var(--text-heading)',
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        fontWeight: '700',
                                        boxShadow: 'var(--shadow)'
                                    }}
                                >
                                    {predefinedColors.map(color => (
                                        <option key={color.value} value={color.value} style={{ background: 'var(--bg-top)', color: 'var(--text-heading)' }}>
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
                            <h4 style={{ margin: '0 0 8px 0', color: 'white' }}>Preview</h4>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                                This is how your accent color will look
                            </p>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px' }}>
                        <h3>Nebula Atmosphere</h3>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '20px' }}>
                            Customize the dynamic background lighting and neon effects.
                        </p>

                        <div className="grid-2" style={{ gap: '30px' }}>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Atmospheric Geometry</label>
                                <div className="tab-nav" style={{ marginTop: '10px', width: '100%', justifyContent: 'flex-start' }}>
                                    {[
                                        { id: 'circular', label: 'Classic Circular', icon: '⭕' },
                                        { id: 'wave', label: 'Soft Wave', icon: '🌊' },
                                        { id: 'line', label: 'Focus Line', icon: '📏' },
                                        { id: 'abstract', label: 'Cosmic Abstract', icon: '✨' },
                                        { id: 'prism', label: 'Refractive Prism', icon: '💎' },
                                        { id: 'aurora', label: 'Emerald Aurora', icon: '🌌' },
                                        { id: 'eclipse', label: 'Solar Eclipse', icon: '🌑' },
                                        { id: 'nova', label: 'Supernova', icon: '💥' }
                                    ].map(shape => (
                                        <button
                                            type="button"
                                            key={shape.id}
                                            className={`tab-btn ${neonShape === shape.id ? 'active' : ''}`}
                                            onClick={() => updateNeonSetting('shape', shape.id)}
                                            style={{}}
                                        >
                                            <span style={{ marginRight: '8px' }}>{shape.icon}</span>
                                            {shape.label}
                                        </button>
                                    ))}
                                </div>
                            </div>


                            <div className="form-group">
                                <label>Neon Glow Color</label>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={neonColor}
                                        onChange={(e) => updateNeonSetting('color', e.target.value)}
                                        style={{ width: '60px', height: '45px', padding: '0', borderRadius: '8px', cursor: 'pointer', border: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        value={neonColor.toUpperCase()}
                                        onChange={(e) => updateNeonSetting('color', e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Glow Intensity ({Math.round(neonIntensity * 100)}%)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={neonIntensity}
                                    onChange={(e) => updateNeonSetting('intensity', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Glow Dispersion ({neonSize}%)</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="80"
                                    value={neonSize}
                                    onChange={(e) => updateNeonSetting('size', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Focal Hub Position</label>
                                <div className="flex-row" style={{ gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.6 }}>Horizontal (X)</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={neonX}
                                            onChange={(e) => updateNeonSetting('x', e.target.value)}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.6 }}>Vertical (Y)</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={neonY}
                                            onChange={(e) => updateNeonSetting('y', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
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
                        border: '1px solid #ffc107',
                        color: '#856404'
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
                        <p style={{ color: 'var(--text-light)', lineHeight: '1.6' }}>
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
                        >
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📧</div>
                            <h3 style={{ margin: '0 0 8px 0', color: 'white' }}>Email Support</h3>
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
                        >
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💬</div>
                            <h3 style={{ margin: '0 0 8px 0', color: 'white' }}>WhatsApp</h3>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                                Quick response via chat
                            </p>
                        </div>
                    </div>

                    <div style={{
                        marginTop: '30px',
                        padding: '20px',
                        background: 'var(--item-hover)',
                        borderRadius: '10px',
                        border: '1px solid var(--border)'
                    }}>
                        <h3 style={{ marginTop: 0 }}>📋 System Information</h3>
                        <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>
                            <p><strong>Version:</strong> v3.9</p>
                            <p><strong>Database:</strong> Supabase (Global)</p>
                            <p><strong>Email Provider:</strong> Gmail SMTP Server</p>
                            <p style={{ marginBottom: 0 }}><strong>Developer:</strong> EurosHub</p>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Customization Tab */}
            {activeTab === 'pdf' && (
                <div className="card">
                    <h2 style={{ marginTop: 0 }}>PDF Customization</h2>
                    <p style={{ color: 'var(--text-light)', marginBottom: '25px' }}>
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
                                    companyName: 'EuroShub',
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
        </div >
    );
}
