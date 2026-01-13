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
        <div style={{ padding: '20px' }}>
            <div className="flex-row flex-between portal-header" style={{ marginBottom: '30px', alignItems: 'center' }}>
                <div>
                    <h1 style={{ marginBottom: '5px' }}>Welcome, {profile.name}</h1>
                    <p style={{ color: 'var(--text-light)' }}>{profile.job_title} | {profile.department}</p>
                </div>
                <div className="badge portal-status" style={{ padding: '10px 20px', fontSize: '14px', background: 'var(--accent)', color: 'white' }}>
                    Status: {profile.status}
                </div>
            </div>

            <nav className="portal-nav" style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border)', marginBottom: '30px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '5px' }}>
                {['Dashboard', 'Attendance', 'My Leaves', 'My Payslips', 'My Assets', 'Performance', 'Documents'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                        className={`nav-tab ${activeTab === tab.toLowerCase().replace(' ', '-') ? 'active' : ''}`}
                        style={{
                            padding: '10px 5px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: activeTab === tab.toLowerCase().replace(' ', '-') ? 'var(--accent)' : 'var(--text)',
                            borderBottom: activeTab === tab.toLowerCase().replace(' ', '-') ? '3px solid var(--accent)' : 'none',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            {activeTab === 'dashboard' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    <div className="card shadow">
                        <h3>Attendance & Sitting</h3>
                        <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)', margin: '15px 0' }}>
                            {profile.sitting_hours || '0.0'} hrs
                        </p>
                        <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>Total sitting hours this month</p>
                    </div>

                    <div className="card shadow">
                        <h3>Leave Balance</h3>
                        <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--warning)', margin: '15px 0' }}>
                            {leaves && leaves.filter(l => l.status === 'Approved').reduce((acc, l) => acc + (Number(l.days_count) || 0), 0)} / 20
                        </p>
                        <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>Days used this year</p>
                    </div>

                    <div className="card shadow">
                        <h3>KPI Rating</h3>
                        <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)', margin: '15px 0' }}>
                            {recentPerformance ? `${recentPerformance.final_rating} / 5` : 'N/A'}
                        </p>
                        {recentPerformance && (
                            <div style={{ marginTop: '10px', fontSize: '13px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                <p><strong>Feedback:</strong> {recentPerformance.comments || 'No comments'}</p>
                                <p style={{ color: '#888', marginTop: '5px' }}>Period: {recentPerformance.period}</p>
                            </div>
                        )}
                        {!recentPerformance && <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>No recent review</p>}
                    </div>

                    <div className="card shadow">
                        <h3>My Assets</h3>
                        <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#6366f1', margin: '15px 0' }}>
                            {assets.length}
                        </p>
                        <ul style={{ paddingLeft: '20px', fontSize: '12px', color: '#666' }}>
                            {assets.slice(0, 3).map(a => <li key={a.id}>{a.name}</li>)}
                        </ul>
                    </div>

                    <div className="card shadow" style={{ gridColumn: 'span 2' }}>
                        <h3>Recent Payslips</h3>
                        <table className="table" style={{ marginTop: '10px' }}>
                            <thead>
                                <tr><th>Period</th><th>Issue Date</th><th>Net Pay</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {recentPayslips.map(ps => (
                                    <tr key={ps.id}>
                                        <td>{ps.pay_period_start}</td>
                                        <td>{ps.issue_date}</td>
                                        <td><strong>{ps.net_pay.toLocaleString()}</strong></td>
                                        <td><button className="btn btn-sm btn-secondary" onClick={() => api.openPayslip(ps.id)}>View</button></td>
                                    </tr>
                                ))}
                                {recentPayslips.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No payslips found</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    <div className="card shadow" style={{ gridRow: 'span 2' }}>
                        <h3>Warnings & Alerts</h3>
                        {warnings.length === 0 ? (
                            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--success)' }}>No active warnings</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                {warnings.map(w => (
                                    <div
                                        key={w.id}
                                        onClick={() => setActiveTab('my-warnings')}
                                        style={{
                                            padding: '10px', borderLeft: '4px solid var(--danger)',
                                            background: '#fff1f2', borderRadius: '4px', cursor: 'pointer',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateX(5px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}
                                    >
                                        <strong>{w.level}</strong>
                                        <p style={{ fontSize: '13px', margin: '5px 0' }}>{w.reason}</p>
                                        <span style={{ fontSize: '11px', color: '#888' }}>{w.date}</span>
                                    </div>
                                ))}
                            </div>
                        )}
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
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadLogs();
    }, [month, year]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await api.getSittingHours(employeeId, month, year);
            setLogs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

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
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>First IN</th>
                                <th>Last OUT</th>
                                <th>Total Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.day}>
                                    <td>{new Date(log.day).toLocaleDateString()}</td>
                                    <td>{log.in ? new Date(log.in).toLocaleTimeString() : '-'}</td>
                                    <td>{log.out ? new Date(log.out).toLocaleTimeString() : '-'}</td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{log.hours} hrs</td>
                                </tr>
                            ))}
                            {logs.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No logs found for this period.</td></tr>}
                        </tbody>
                    </table>
                </div>
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
        <div className="card shadow p-20">
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
                    {leaves.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No leaves found</td></tr>}
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
                                    <select className="form-control" value={formData.leave_type} onChange={e => handleTypeChange(e.target.value)}>
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
                                    <input type="text" className="form-control" readOnly value={`${formData.days_count} day(s)`} style={{ background: '#f3f4f6' }} />
                                </div>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" className="form-control" required value={formData.start_date} onChange={e => handleDateChange('start_date', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input type="date" className="form-control" required value={formData.end_date} onChange={e => handleDateChange('end_date', e.target.value)} min={formData.start_date} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <textarea className="form-control" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
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
        <div className="card shadow p-20">
            <h2>My Assigned Assets</h2>
            <div className="grid-3" style={{ marginTop: '20px', gap: '20px' }}>
                {assets.map(a => (
                    <div key={a.id} className="card border" style={{ padding: '15px' }}>
                        <h4 style={{ color: 'var(--accent)' }}>{a.name}</h4>
                        <p style={{ fontSize: '12px', color: '#888' }}>Tag: {a.asset_tag}</p>
                        <hr style={{ margin: '10px 0', borderColor: '#eee' }} />
                        <div style={{ fontSize: '13px' }}>
                            <p><strong>Assigned To:</strong> <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{employeeName}</span></p>
                            <p><strong>Date of Issue:</strong> {a.assigned_date || 'N/A'}</p>
                            <p><strong>Date of Return:</strong> {a.return_date || 'N/A'}</p>
                            <p><strong>Condition:</strong> {a.condition}</p>
                        </div>
                    </div>
                ))}
            </div>
            {assets.length === 0 && <p style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No assets assigned to you yet.</p>}
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
        <div className="card shadow p-20">
            <h2>My Disciplinary Records</h2>
            <div className="table-container" style={{ marginTop: '20px' }}>
                <table className="table">
                    <thead><tr><th>Date</th><th>Severity</th><th>Reason</th><th>Admin Action</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {warnings.map(w => (
                            <tr key={w.id}>
                                <td>{w.date}</td>
                                <td><span className="badge danger">{w.level}</span></td>
                                <td>{w.reason}</td>
                                <td>{w.action_taken}</td>
                                <td>
                                    {w.explanation ? (
                                        <span className="badge success">Explanation Provided</span>
                                    ) : (
                                        <span className="badge warning">Needs Reply</span>
                                    )}
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setSelectedWarning(w)}>
                                        {w.explanation ? 'View Details' : 'Reply / Explain'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {warnings.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No warnings on record. Keep it up!</td></tr>}
                    </tbody>
                </table>
            </div>

            {selectedWarning && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <h3>Warning Details</h3>
                        <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <p><strong>Date:</strong> {selectedWarning.date}</p>
                            <p><strong>Severity:</strong> {selectedWarning.level}</p>
                            <p><strong>Reason:</strong> {selectedWarning.reason}</p>
                            <p><strong>Action Taken:</strong> {selectedWarning.action_taken}</p>
                        </div>

                        {selectedWarning.explanation ? (
                            <div style={{ marginBottom: '20px' }}>
                                <h4>Your Explanation</h4>
                                <div style={{ borderLeft: '4px solid var(--success)', padding: '10px 15px', background: '#f0fdf4', color: '#166534' }}>
                                    {selectedWarning.explanation}
                                </div>
                                <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>Submitted on: {new Date(selectedWarning.explanation_date).toLocaleString()}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitExplanation}>
                                <h4>Submit Your Explanation</h4>
                                <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                                    Please provide your version of events or any mitigating circumstances.
                                    This will be visible to Management.
                                </p>
                                <textarea
                                    className="form-control"
                                    rows="5"
                                    required
                                    placeholder="Enter your explanation here..."
                                    value={explanation}
                                    onChange={e => setExplanation(e.target.value)}
                                />
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedWarning(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Submit Explanation</button>
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

    return (
        <div className="card shadow p-20">
            <h2>Performance Trend</h2>
            <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="rating" stroke="var(--accent)" strokeWidth={3} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <h2 style={{ marginTop: '30px' }}>Historical Ratings</h2>
            <table className="table" style={{ marginTop: '10px' }}>
                <thead>
                    <tr>
                        <th>Period</th>
                        <th>Quality</th>
                        <th>Speed</th>
                        <th>Initiative</th>
                        <th>Teamwork</th>
                        <th>Final Rating</th>
                        <th>Comments</th>
                    </tr>
                </thead>
                <tbody>
                    {performanceHistory.map(p => (
                        <tr key={p.id}>
                            <td>{p.period}</td>
                            <td>{p.quality_rating}/5</td>
                            <td>{p.speed_rating}/5</td>
                            <td>{p.initiative_rating}/5</td>
                            <td>{p.teamwork_rating}/5</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{p.final_rating}/5.0</td>
                            <td>{p.comments}</td>
                        </tr>
                    ))}
                    {performanceHistory.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center' }}>No performance data available.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

function DocumentModule({ employeeId }) {
    const [docs, setDocs] = useState([]);
    useEffect(() => {
        api.getDocuments(employeeId).then(setDocs);
    }, []);

    const handleDownload = (path, name) => {
        const url = `http://localhost:3000/uploads/documents/${path}`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="card shadow p-20">
            <h2>My Documents</h2>
            <div className="grid-3" style={{ marginTop: '20px', gap: '20px' }}>
                {docs.map(doc => (
                    <div key={doc.id} className="card border" style={{ padding: '15px', position: 'relative' }}>
                        <div style={{ fontSize: '30px', marginBottom: '10px' }}>📄</div>
                        <h4 style={{ margin: '0 0 5px 0' }}>{doc.name}</h4>
                        <p style={{ fontSize: '11px', color: '#888' }}>
                            Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                        <button
                            className="btn btn-sm btn-primary"
                            style={{ marginTop: '15px', width: '100%' }}
                            onClick={() => handleDownload(doc.file_path, doc.name)}
                        >
                            Download
                        </button>
                    </div>
                ))}
            </div>
            {docs.length === 0 && <p style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No shared documents available.</p>}
        </div>
    );
}
