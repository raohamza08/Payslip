import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../api';
import { SendIcon, CancelIcon, CheckIcon, RefreshIcon } from './Icons';

export default function EmailComposer() {
    const [view, setView] = useState('compose'); // compose, recipients, sending
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const [employees, setEmployees] = useState([]);
    const [selectedEmps, setSelectedEmps] = useState(new Set());

    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const data = await api.getEmployees();
            setEmployees(data.filter(e => e.email && e.status === 'Active'));
        } catch (e) { console.error(e); }
    };

    const toggleSelect = (id) => {
        const newSet = new Set(selectedEmps);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedEmps(newSet);
    };

    const toggleAll = () => {
        if (selectedEmps.size === employees.length) setSelectedEmps(new Set());
        else setSelectedEmps(new Set(employees.map(e => e.id)));
    };

    const startSending = async () => {
        setView('sending');
        const recipients = employees.filter(e => selectedEmps.has(e.id));
        setProgress({ current: 0, total: recipients.length, success: 0, failed: 0 });
        setLogs([]);

        for (let i = 0; i < recipients.length; i++) {
            const emp = recipients[i];
            try {
                await api.sendCustomEmail(emp.email, subject, body);
                setLogs(prev => [...prev, { name: emp.name, status: 'Success' }]);
                setProgress(p => ({ ...p, current: i + 1, success: p.success + 1 }));
            } catch (e) {
                setLogs(prev => [...prev, { name: emp.name, status: 'Fail', msg: e.message }]);
                setProgress(p => ({ ...p, current: i + 1, failed: p.failed + 1 }));
            }
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }]
        ],
    };

    return (
        <div>
            <div className="toolbar">
                <h1>Broadcast Email</h1>
                <div className="toolbar-group">
                    {view === 'compose' && (
                        <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>
                            Step 1 of 3: Compose Message
                        </div>
                    )}
                    {view === 'recipients' && (
                        <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>
                            Step 2 of 3: Select Recipients ({selectedEmps.size} selected)
                        </div>
                    )}
                    {view === 'sending' && (
                        <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>
                            Step 3 of 3: Sending Emails
                        </div>
                    )}
                </div>
            </div>

            {view === 'compose' && (
                <div className="card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label>Email Subject *</label>
                            <input
                                className="form-control"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Enter email subject (e.g., Important Company Announcement)"
                                style={{ fontSize: '16px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ marginBottom: '8px', fontWeight: '600' }}>Message Body *</label>
                            <div style={{
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                minHeight: '400px'
                            }}>
                                <ReactQuill
                                    theme="snow"
                                    value={body}
                                    onChange={setBody}
                                    modules={modules}
                                    style={{ height: '350px', background: 'var(--bg-top)' }}
                                    placeholder="Compose your message here..."
                                />
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            paddingTop: '20px',
                            borderTop: '1px solid var(--border)'
                        }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => setView('recipients')}
                                disabled={!subject || !body}
                            >
                                <SendIcon />
                                Next: Select Recipients
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'recipients' && (
                <div className="card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{
                            padding: '15px',
                            background: 'var(--item-hover)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ marginBottom: '10px' }}>
                                <strong>Subject:</strong> {subject}
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>
                                Select employees who will receive this email
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px',
                            background: 'var(--item-hover)',
                            borderRadius: '8px'
                        }}>
                            <input
                                type="checkbox"
                                checked={selectedEmps.size === employees.length && employees.length > 0}
                                onChange={toggleAll}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label style={{ margin: 0, cursor: 'pointer', fontWeight: '600' }} onClick={toggleAll}>
                                Select All Employees ({employees.length} total)
                            </label>
                        </div>

                        <div style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            border: '1px solid var(--border)',
                            borderRadius: '8px'
                        }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}></th>
                                        <th>Employee</th>
                                        <th>Email</th>
                                        <th>Department</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map(emp => (
                                        <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => toggleSelect(emp.id)}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEmps.has(emp.id)}
                                                    onChange={() => toggleSelect(emp.id)}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td><strong>{emp.name}</strong></td>
                                            <td style={{ color: 'var(--text-light)' }}>{emp.email}</td>
                                            <td>{emp.department || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: '20px',
                            borderTop: '1px solid var(--border)'
                        }}>
                            <button className="btn btn-secondary" onClick={() => setView('compose')}>
                                <CancelIcon />
                                Back to Compose
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={startSending}
                                disabled={selectedEmps.size === 0}
                            >
                                <SendIcon />
                                Send to {selectedEmps.size} {selectedEmps.size === 1 ? 'Person' : 'People'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'sending' && (
                <div className="card">
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <h2 style={{ marginBottom: '30px', color: 'var(--text-heading)' }}>
                            {progress.current === progress.total ? 'Email Campaign Complete!' : 'Sending Emails...'}
                        </h2>

                        <div style={{
                            fontSize: '48px',
                            fontWeight: 'bold',
                            margin: '20px 0',
                            color: 'var(--accent)'
                        }}>
                            {progress.current} / {progress.total}
                        </div>

                        <div style={{
                            width: '100%',
                            background: 'var(--item-hover)',
                            height: '20px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            marginBottom: '30px'
                        }}>
                            <div style={{
                                width: `${(progress.current / progress.total) * 100}%`,
                                background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent-hover) 100%)',
                                height: '100%',
                                transition: 'width 0.3s ease',
                                borderRadius: '10px'
                            }}></div>
                        </div>

                        <div className="grid-3" style={{ marginBottom: '30px' }}>
                            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)' }}>
                                <div style={{ fontSize: '14px', opacity: 0.8 }}>Successful</div>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10B981' }}>{progress.success}</div>
                            </div>
                            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)' }}>
                                <div style={{ fontSize: '14px', opacity: 0.8 }}>Failed</div>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#EF4444' }}>{progress.failed}</div>
                            </div>
                            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)' }}>
                                <div style={{ fontSize: '14px', opacity: 0.8 }}>Remaining</div>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)' }}>
                                    {progress.total - progress.current}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            textAlign: 'left',
                            maxHeight: '300px',
                            overflow: 'auto',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '15px',
                            background: 'var(--bg-top)'
                        }}>
                            <h4 style={{ marginBottom: '15px' }}>Delivery Log</h4>
                            {logs.map((l, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px',
                                    marginBottom: '5px',
                                    borderRadius: '4px',
                                    background: l.status === 'Success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                                }}>
                                    <span style={{ fontSize: '16px' }}>
                                        {l.status === 'Success' ? '✓' : '✗'}
                                    </span>
                                    <span style={{
                                        color: l.status === 'Success' ? '#10B981' : '#EF4444',
                                        fontWeight: '600'
                                    }}>
                                        {l.name}
                                    </span>
                                    {l.msg && <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>- {l.msg}</span>}
                                </div>
                            ))}
                        </div>

                        {progress.current === progress.total && (
                            <div style={{ marginTop: '30px' }}>
                                <button className="btn btn-primary" onClick={() => {
                                    setView('compose');
                                    setSubject('');
                                    setBody('');
                                    setLogs([]);
                                    setSelectedEmps(new Set());
                                    setProgress({ current: 0, total: 0, success: 0, failed: 0 });
                                }}>
                                    <RefreshIcon />
                                    Compose New Email
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
