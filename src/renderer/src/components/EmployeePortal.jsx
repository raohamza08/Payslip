import React, { useState, useEffect } from 'react';
import api from '../api';
import PayslipHistory from './PayslipHistory';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EmployeePortal({ user }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const portalData = await api.getPortalDashboard();
            setData(portalData);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    if (loading) return <div className="loading-screen">Loading EurosHub Portal...</div>;

    if (!data) return (
        <div className="p-20 text-center" style={{ marginTop: '100px' }}>
            <h1 className="text-danger">Profile Not Linked</h1>
            <p style={{ maxWidth: '500px', margin: '20px auto', color: 'var(--text-light)' }}>
                Your user account is not yet linked to an employee profile.
                Please ask your Admin to add your email <strong>({user?.email})</strong> to the <strong>Employees</strong> list.
            </p>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>Try Again</button>
        </div>
    );

    const { profile, leaves, recentPayslips, warnings, assets, recentPerformance } = data;

    return (
        <div className="view-container">
            <div className="flex-row flex-between portal-header" style={{ marginBottom: '30px' }}>
                <div>
                    <h1 style={{ marginBottom: '5px' }}>Welcome back, {profile.name}</h1>
                    <p className="text-light">{profile.job_title} | {profile.department}</p>
                </div>
                <div className="badge success" style={{ padding: '10px 20px', fontSize: '14px' }}>
                    {profile.status}
                </div>
            </div>

            <div className="tab-nav">
                {['Dashboard', 'Attendance', 'My Leaves', 'My Payslips', 'My Assets', 'Performance', 'Documents'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                        className={`tab-btn ${activeTab === tab.toLowerCase().replace(' ', '-') ? 'active' : ''}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'dashboard' && (
                <div className="grid-3" style={{ gap: '20px' }}>
                    <div className="card">
                        <h3>Attendance & Sitting</h3>
                        <p style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent)', margin: '15px 0' }}>
                            {profile.sitting_hours || '0.0'} hrs
                        </p>
                        <p className="text-light text-sm">Total sitting hours this month</p>
                    </div>

                    <div className="card">
                        <h3>Leave Balance</h3>
                        <p style={{ fontSize: '32px', fontWeight: '800', color: 'var(--warning)', margin: '15px 0' }}>
                            {leaves && leaves.filter(l => l.status === 'Approved').reduce((acc, l) => acc + (Number(l.days_count) || 0), 0)} / 26
                        </p>
                        <p className="text-light text-sm">Days used this year</p>
                    </div>

                    <div className="card">
                        <h3>KPI Rating</h3>
                        <p style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)', margin: '15px 0' }}>
                            {recentPerformance ? `${recentPerformance.final_rating} / 5` : 'N/A'}
                        </p>
                        {recentPerformance && (
                            <div style={{ marginTop: '10px', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                <p><strong>Feedback:</strong> {recentPerformance.comments || 'No comments'}</p>
                                <p className="text-light" style={{ marginTop: '5px' }}>Period: {recentPerformance.period}</p>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <div className="flex-row flex-between" style={{ marginBottom: '15px' }}>
                            <h3>Recent Payslips</h3>
                            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('my-payslips')}>View History</button>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr><th>Period</th><th>Issue Date</th><th>Net Pay</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {recentPayslips.map(ps => (
                                        <tr key={ps.id}>
                                            <td>{ps.pay_period_start}</td>
                                            <td>{ps.issue_date}</td>
                                            <td><strong>{ps.net_pay.toLocaleString()}</strong></td>
                                            <td><button className="btn btn-secondary btn-sm" onClick={() => api.openPayslip(ps.id)}>View PDF</button></td>
                                        </tr>
                                    ))}
                                    {recentPayslips.length === 0 && <tr><td colSpan="4" className="text-center">No payslips found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <h3>Assigned Assets</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
                            {assets.slice(0, 3).map(a => (
                                <div key={a.id} className="flex-row flex-between" style={{ padding: '8px', background: 'var(--bg)', borderRadius: '8px' }}>
                                    <span style={{ fontWeight: '600' }}>{a.name}</span>
                                    <span className="text-light text-sm">{a.asset_tag}</span>
                                </div>
                            ))}
                            {assets.length === 0 && <p className="text-light text-center">No assets assigned</p>}
                            {assets.length > 3 && <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('my-assets')}>+{assets.length - 3} more</button>}
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-modules would be implemented as separate components or conditional renders here */}
            {activeTab === 'attendance' && <AttendanceModule employeeId={profile.id} />}
            {activeTab === 'my-leaves' && <LeaveModule employeeId={profile.id} />}
            {activeTab === 'my-assets' && <AssetModule employeeId={profile.id} employeeName={profile.name} />}
            {activeTab === 'my-warnings' && <WarningModule employeeId={profile.id} />}
            {activeTab === 'my-payslips' && <PayslipHistory employeeId={profile.id} />}
            {activeTab === 'performance' && <PerformanceModule performanceHistory={data.performanceHistory} />}
            {activeTab === 'documents' && <DocumentModule employeeId={profile.id} />}
        </div>
    );
}

// Internal sub-components for simplicity (in a real app, these would be separate files)
function AttendanceModule({ employeeId }) {
    const [logs, setLogs] = useState([]);
    const [rawLogs, setRawLogs] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadData();
    }, [month, year]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [attData, scanData, leaveData] = await Promise.all([
                api.getSittingHours(employeeId, month, year),
                api.getMyBiometricLogs(),
                api.getLeaves(employeeId)
            ]);
            setLogs(attData);
            setRawLogs(scanData);
            setLeaves(leaveData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get all days in the selected month
    const getDaysInMonth = () => {
        const days = [];
        const date = new Date(year, month - 1, 1);
        while (date.getMonth() === month - 1) {
            days.push(new Date(date).toISOString().split('T')[0]);
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const days = getDaysInMonth();
    const logMap = logs.reduce((acc, l) => ({ ...acc, [l.day]: l }), {});
    const leaveMap = leaves.reduce((acc, l) => {
        if (l.status !== 'Approved') return acc;
        // Simple range check for days in this month
        let start = new Date(l.start_date);
        let end = new Date(l.end_date);
        let curr = new Date(start);
        while (curr <= end) {
            acc[curr.toISOString().split('T')[0]] = l.leave_type;
            curr.setDate(curr.getDate() + 1);
        }
        return acc;
    }, {});

    return (
        <div className="card shadow">
            <div className="flex-row flex-between" style={{ marginBottom: '20px' }}>
                <h2>My Attendance & Sitting Hours</h2>
                <div className="flex-row" style={{ gap: '10px' }}>
                    <select className="form-control" value={month} onChange={e => setMonth(e.target.value)}>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select className="form-control" value={year} onChange={e => setYear(e.target.value)}>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {loading ? <p>Loading logs...</p> : (
                <>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>First IN</th>
                                    <th>Last OUT</th>
                                    <th>Total Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {days.map(day => {
                                    const log = logMap[day];
                                    const leaveType = leaveMap[day];
                                    const isPast = new Date(day) < new Date(new Date().setHours(0, 0, 0, 0));
                                    const isToday = day === new Date().toISOString().split('T')[0];

                                    let status = <span className="badge secondary">Upcoming</span>;
                                    if (log) status = <span className="badge success">PRESENT</span>;
                                    else if (leaveType) status = <span className="badge warning">{leaveType} (LEAVE)</span>;
                                    else if (isPast) status = <span className="badge danger">ABSENT</span>;
                                    else if (isToday) status = <span className="badge warning">TODAY</span>;

                                    return (
                                        <tr key={day} style={{ opacity: isPast || isToday ? 1 : 0.6 }}>
                                            <td>{new Date(day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                            <td>{status}</td>
                                            <td>{log?.in ? new Date(log.in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td>{log?.out ? new Date(log.out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td style={{ fontWeight: 'bold', color: log?.hours > 0 ? 'var(--accent)' : 'inherit' }}>
                                                {log?.hours ? `${log.hours} hrs` : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Recent Biometric Scans</h3>
                    <div className="table-container" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                        <table className="table">
                            <thead><tr><th>Time</th><th>Verification</th><th className="text-center">Direction</th></tr></thead>
                            <tbody>
                                {rawLogs.map(log => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                        <td>Biometric/ID Card</td>
                                        <td className="text-center">
                                            <span className={`badge ${log.direction === 'IN' ? 'success' : 'danger'}`}>
                                                {log.direction}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {rawLogs.length === 0 && <tr><td colSpan="3" className="text-center text-light">No recent scans detected.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

function LeaveModule({ employeeId }) {
    const [leaves, setLeaves] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ leave_type: 'Annual', start_date: '', end_date: '', reason: '', days_count: 0 });

    useEffect(() => { load(); }, []);
    const load = async () => setLeaves(await api.getLeaves(employeeId));

    const calculateDays = (start, end, type) => {
        if (!start || !end) return 0;
        if (type === 'Half Leave' && start === end) return 0.5;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const handleDateChange = (field, value) => {
        const updated = { ...formData, [field]: value };
        if (updated.start_date && updated.end_date) {
            updated.days_count = calculateDays(updated.start_date, updated.end_date, updated.leave_type);
        }
        setFormData(updated);
    };

    const handleTypeChange = (type) => {
        const updated = { ...formData, leave_type: type };
        if (updated.start_date && updated.end_date) {
            updated.days_count = calculateDays(updated.start_date, updated.end_date, type);
        }
        setFormData(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.requestLeave({ ...formData, employee_id: employeeId });
            setShowForm(false);
            setFormData({ leave_type: 'Annual', start_date: '', end_date: '', reason: '', days_count: 0 });
            load();
        } catch (e) { alert(e.message); }
    };

    return (
        <div className="card">
            <div className="flex-row flex-between" style={{ marginBottom: '20px' }}>
                <h2>My Leave Requests</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>Request Leave</button>
            </div>

            <table className="table">
                <thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Comment</th></tr></thead>
                <tbody>
                    {leaves.map(l => (
                        <tr key={l.id}>
                            <td>{l.leave_type}</td>
                            <td>{l.start_date} to {l.end_date}</td>
                            <td>{l.days_count}</td>
                            <td>
                                <span className={`badge ${(l.status || 'Pending').toLowerCase()}`}>{l.status || 'Pending'}</span>
                            </td>
                            <td>{l.comment || '-'}</td>
                        </tr>
                    ))}
                    {leaves.length === 0 && <tr><td colSpan="5" className="text-center">No leave requests found.</td></tr>}
                </tbody>
            </table>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Request Leave</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Leave Type</label>
                                    <select value={formData.leave_type} onChange={e => handleTypeChange(e.target.value)}>
                                        <option>Annual</option>
                                        <option>Sick</option>
                                        <option>Casual</option>
                                        <option>Unpaid</option>
                                        <option>Half Leave</option>
                                        <option>Emergency</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Duration</label>
                                    <input type="text" readOnly value={`${formData.days_count} day(s)`} style={{ background: 'var(--item-hover)' }} />
                                </div>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" required value={formData.start_date} onChange={e => handleDateChange('start_date', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input type="date" required value={formData.end_date} onChange={e => handleDateChange('end_date', e.target.value)} min={formData.start_date} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <textarea rows="3" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function AssetModule({ employeeId, employeeName }) {
    const [assets, setAssets] = useState([]);
    useEffect(() => { api.getAssets(employeeId).then(setAssets); }, []);

    return (
        <div className="card">
            <h2>My Assigned Assets</h2>
            <div className="grid-3" style={{ marginTop: '20px', gap: '20px' }}>
                {assets.map(a => (
                    <div key={a.id} className="card" style={{ padding: '15px', background: 'var(--item-hover)' }}>
                        <h4 style={{ color: 'var(--accent)' }}>{a.name}</h4>
                        <p className="text-sm text-light">Tag: {a.asset_tag}</p>
                        <hr style={{ margin: '15px 0', borderColor: 'var(--border)' }} />
                        <div style={{ fontSize: '13px' }}>
                            <p><strong>Issued To:</strong> {employeeName}</p>
                            <p><strong>Date:</strong> {a.assigned_date || 'N/A'}</p>
                            <p><strong>Condition:</strong> {a.condition}</p>
                        </div>
                    </div>
                ))}
            </div>
            {assets.length === 0 && <p className="text-light text-center" style={{ padding: '40px' }}>No company assets assigned to your profile.</p>}
        </div>
    );
}

function WarningModule({ employeeId }) {
    const [warnings, setWarnings] = useState([]);
    const [selectedWarning, setSelectedWarning] = useState(null);
    const [explanation, setExplanation] = useState('');

    useEffect(() => { load(); }, []);
    const load = async () => setWarnings(await api.getWarnings(employeeId));

    const handleSubmitExplanation = async (e) => {
        e.preventDefault();
        try {
            await api.submitWarningExplanation(selectedWarning.id, explanation);
            alert('Explanation submitted successfully.');
            setSelectedWarning(null);
            setExplanation('');
            load();
        } catch (e) { alert(e.message); }
    };

    return (
        <div className="card">
            <h2>My Disciplinary Records</h2>
            <div className="table-container" style={{ marginTop: '20px' }}>
                <table className="table">
                    <thead><tr><th>Date</th><th>Severity</th><th>Reason</th><th>Status</th><th className="text-center">Actions</th></tr></thead>
                    <tbody>
                        {warnings.map(w => (
                            <tr key={w.id}>
                                <td>{w.date}</td>
                                <td><span className="badge danger">{w.level}</span></td>
                                <td>{w.reason}</td>
                                <td>
                                    {w.explanation ? (
                                        <span className="badge success">Resolved</span>
                                    ) : (
                                        <span className="badge warning">Action Required</span>
                                    )}
                                </td>
                                <td className="text-center">
                                    <button className="btn btn-sm btn-secondary" onClick={() => setSelectedWarning(w)}>
                                        {w.explanation ? 'View Details' : 'Reply Now'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {warnings.length === 0 && <tr><td colSpan="5" className="text-center">No disciplinary records found.</td></tr>}
                    </tbody>
                </table>
            </div>

            {selectedWarning && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Disciplinary Incident</h3>
                        <div style={{ background: 'var(--item-hover)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                            <p><strong>Date:</strong> {selectedWarning.date}</p>
                            <p><strong>Reason:</strong> {selectedWarning.reason}</p>
                            <p><strong>Administrative Action:</strong> {selectedWarning.action_taken}</p>
                        </div>

                        {selectedWarning.explanation ? (
                            <div className="card" style={{ background: 'var(--item-hover)', border: '1px solid var(--success)' }}>
                                <h4 style={{ color: 'var(--success)', marginBottom: '10px' }}>Your Explanation</h4>
                                <p>{selectedWarning.explanation}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitExplanation}>
                                <label>Your Response</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Provide your explanation for internal review..."
                                    value={explanation}
                                    onChange={e => setExplanation(e.target.value)}
                                />
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedWarning(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Submit Response</button>
                                </div>
                            </form>
                        )}
                        {selectedWarning.explanation && (
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setSelectedWarning(null)}>Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function PerformanceModule({ performanceHistory }) {
    const chartData = performanceHistory.map(p => ({
        period: p.period,
        rating: p.final_rating
    }));

    // Theme-aware colors
    const isDark = document.body.classList.contains('dark');
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0FB8AF';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

    return (
        <div className="card">
            <div className="flex-row flex-between" style={{ marginBottom: '20px' }}>
                <div>
                    <h2>Performance Trend</h2>
                    <p className="text-light text-sm">Visualize your rating history over time.</p>
                </div>
            </div>

            <div style={{ height: '340px', width: '100%', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis
                            dataKey="period"
                            stroke={textColor}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            domain={[0, 5]}
                            stroke={textColor}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--card-bg)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                boxShadow: 'var(--shadow-lg)',
                                color: 'var(--text-heading)'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="rating"
                            stroke={accentColor}
                            strokeWidth={4}
                            dot={{ fill: accentColor, strokeWidth: 2, r: 6, stroke: isDark ? '#060b28' : '#fff' }}
                            activeDot={{ r: 8, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <h2 style={{ marginTop: '40px', marginBottom: '15px' }}>Detailed History</h2>
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>Quality</th>
                            <th>Speed</th>
                            <th>Initiative</th>
                            <th>Teamwork</th>
                            <th>Final</th>
                            <th>Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {performanceHistory.map(p => (
                            <tr key={p.id}>
                                <td><strong>{p.period}</strong></td>
                                <td>{p.quality_rating}/5</td>
                                <td>{p.speed_rating}/5</td>
                                <td>{p.initiative_rating}/5</td>
                                <td>{p.teamwork_rating}/5</td>
                                <td style={{ fontWeight: '800', color: 'var(--accent)' }}>{p.final_rating}</td>
                                <td className="text-sm" style={{ maxWidth: '250px' }}>{p.comments}</td>
                            </tr>
                        ))}
                        {performanceHistory.length === 0 && <tr><td colSpan="7" className="text-center">No performance data available.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DocumentModule({ employeeId }) {
    const [docs, setDocs] = useState([]);
    useEffect(() => {
        api.getDocuments(employeeId).then(setDocs);
    }, []);

    const handleDownload = (path, name) => {
        const url = `/uploads/documents/${path}`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="view-container">
            <div className="toolbar">
                <h2>My Documents</h2>
                <p className="text-light">Access shared company policies and personal documents.</p>
            </div>
            <div className="grid-3" style={{ gap: '20px' }}>
                {docs.map(doc => (
                    <div key={doc.id} className="card clickable" onClick={() => handleDownload(doc.file_path, doc.name)}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>📄</div>
                        <h4 style={{ margin: '0 0 5px 0' }}>{doc.name}</h4>
                        <p className="text-sm text-light">Uploaded: {new Date(doc.created_at).toLocaleDateString()}</p>
                        <button className="btn btn-secondary btn-sm" style={{ marginTop: '20px', width: '100%' }}>Download Link</button>
                    </div>
                ))}
            </div>
            {docs.length === 0 && <p className="text-light text-center" style={{ padding: '60px' }}>Your document vault is currently empty.</p>}
        </div>
    );
}
