import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../api';

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
        <div style={{ maxWidth: 800, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h1>Compose Email</h1>

            {view === 'compose' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
                    <div className="form-group">
                        <label>Subject</label>
                        <input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Important Announcement..."
                        />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <label style={{ marginBottom: 5 }}>Message Body</label>
                        <ReactQuill
                            theme="snow"
                            value={body}
                            onChange={setBody}
                            modules={modules}
                            style={{ flex: 1, background: 'white', border: '1px solid #ccc' }}
                        />
                    </div>

                    <div style={{ textAlign: 'right', marginTop: 20 }}>
                        <button className="btn btn-primary" onClick={() => setView('recipients')} disabled={!subject || !body}>
                            Next: Select Recipients
                        </button>
                    </div>
                </div>
            )}

            {view === 'recipients' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h3>Select Recipients</h3>
                    <div style={{ marginBottom: 10 }}>
                        <label>
                            <input type="checkbox" checked={selectedEmps.size === employees.length && employees.length > 0} onChange={toggleAll} />
                            Select All ({employees.length})
                        </label>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
                        <table style={{ width: '100%' }}>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ width: 40, padding: 10 }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedEmps.has(emp.id)}
                                                onChange={() => toggleSelect(emp.id)}
                                            />
                                        </td>
                                        <td style={{ padding: 10 }}>
                                            <strong>{emp.name}</strong><br />
                                            <span style={{ color: '#666', fontSize: 12 }}>{emp.email}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
                        <button className="btn btn-secondary" onClick={() => setView('compose')}>Back</button>
                        <button className="btn btn-primary" onClick={startSending} disabled={selectedEmps.size === 0}>
                            Send to {selectedEmps.size} people
                        </button>
                    </div>
                </div>
            )}

            {view === 'sending' && (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <h3>Sending Emails...</h3>
                    <div style={{ fontSize: 24, margin: '20px 0' }}>{progress.current} / {progress.total}</div>

                    <div style={{ width: '100%', background: '#eee', height: 10, borderRadius: 5 }}>
                        <div style={{ width: `${(progress.current / progress.total) * 100}%`, background: '#10b981', height: '100%', borderRadius: 5, transition: 'width 0.3s' }}></div>
                    </div>

                    <div style={{ marginTop: 30, textAlign: 'left', maxHeight: 300, overflow: 'auto', border: '1px solid #eee', padding: 10 }}>
                        {logs.map((l, i) => (
                            <div key={i} style={{ color: l.status === 'Success' ? 'green' : 'red', fontSize: 12, marginBottom: 4 }}>
                                {l.status === 'Success' ? `✓ ${l.name}` : `✗ ${l.name}: ${l.msg}`}
                            </div>
                        ))}
                    </div>

                    {progress.current === progress.total && (
                        <div style={{ marginTop: 20 }}>
                            <button className="btn btn-primary" onClick={() => {
                                setView('compose');
                                setSubject('');
                                setBody('');
                                setLogs([]);
                                setProgress({ current: 0, total: 0, success: 0, failed: 0 });
                            }}>Send Another</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
