import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Discipline() {
    const [warnings, setWarnings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedWarning, setSelectedWarning] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        severity: 'Low',
        reason: '',
        date: new Date().toISOString().split('T')[0],
        action_taken: 'Verbal Warning'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [warnData, empData] = await Promise.all([
                api.fetchJson('/api/warnings'),
                api.getEmployees()
            ]);
            setWarnings(Array.isArray(warnData) ? warnData : []);
            setEmployees(Array.isArray(empData) ? empData : []);
        } catch (e) {
            console.error(e);
            setWarnings([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.fetchJson('/api/warnings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            alert('Warning issued successfully.');
            setShowModal(false);
            setFormData({
                employee_id: '', severity: 'Low', reason: '',
                date: new Date().toISOString().split('T')[0], action_taken: 'Verbal Warning'
            });
            loadData();
        } catch (e) {
            alert(e.message);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Low': return { bg: '#fef9c3', color: '#854d0e' };
            case 'Medium': return { bg: '#ffedd5', color: '#c2410c' };
            case 'High': return { bg: '#fee2e2', color: '#991b1b' };
            case 'Critical': return { bg: '#000', color: '#fff' };
            default: return { bg: '#f3f4f6', color: '#4b5563' };
        }
    };

    return (
        <div className="p-20">
            <div className="toolbar">
                <h1>Disciplinary Actions</h1>
                <div className="toolbar-group">
                    <button className="btn btn-danger" onClick={() => setShowModal(true)}>
                        Issue Warning
                    </button>
                </div>
            </div>

            <div className="card shadow" style={{ overflowX: 'auto' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Employee</th>
                            <th>Severity</th>
                            <th>Reason</th>
                            <th>Action Taken</th>
                            <th>Explanation Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {warnings.map(warn => {
                            const emp = employees.find(e => e.id === warn.employee_id);
                            const style = getSeverityColor(warn.severity);
                            return (
                                <tr key={warn.id || warn._id}>
                                    <td>{warn.date}</td>
                                    <td><strong>{emp ? emp.name : 'Unknown'}</strong></td>
                                    <td>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '12px',
                                            fontSize: '12px', fontWeight: 'bold',
                                            background: style.bg, color: style.color
                                        }}>
                                            {warn.severity}
                                        </span>
                                    </td>
                                    <td>{warn.reason}</td>
                                    <td>{warn.action_taken}</td>
                                    <td>
                                        {warn.explanation ? (
                                            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ Submitted</span>
                                        ) : (
                                            <span style={{ color: '#999' }}>No reply yet</span>
                                        )}
                                    </td>
                                    <td>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedWarning(warn)}>
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {warnings.length === 0 && (
                            <tr>
                                <td colSpan="7" className="text-center p-20">No disciplinary records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedWarning && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <div className="flex-row flex-between" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                            <h2 style={{ margin: 0 }}>Warning Details</h2>
                            <button onClick={() => setSelectedWarning(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                        </div>

                        <div className="grid-2" style={{ marginBottom: '15px' }}>
                            <div>
                                <label style={{ color: '#666', fontSize: '12px' }}>Employee</label>
                                <div style={{ fontWeight: 'bold' }}>{employees.find(e => e.id === selectedWarning.employee_id)?.name || 'Unknown'}</div>
                            </div>
                            <div>
                                <label style={{ color: '#666', fontSize: '12px' }}>Date Issued</label>
                                <div style={{ fontWeight: 'bold' }}>{selectedWarning.date}</div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ color: '#666', fontSize: '12px' }}>Severity</label>
                            <div>
                                <span style={{
                                    padding: '4px 12px', borderRadius: '12px',
                                    fontSize: '12px', fontWeight: 'bold',
                                    background: getSeverityColor(selectedWarning.severity).bg,
                                    color: getSeverityColor(selectedWarning.severity).color
                                }}>
                                    {selectedWarning.severity}
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ color: '#666', fontSize: '12px' }}>Incident / Reason</label>
                            <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '5px', border: '1px solid #eee' }}>
                                {selectedWarning.reason}
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ color: '#666', fontSize: '12px' }}>Action Taken</label>
                            <div style={{ fontWeight: 'bold' }}>{selectedWarning.action_taken}</div>
                        </div>

                        <div className="form-group" style={{ marginTop: '20px', borderTop: '2px solid #eee', paddingTop: '15px' }}>
                            <label style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px' }}>Employee Explanation</label>
                            {selectedWarning.explanation ? (
                                <div style={{
                                    background: '#f0fdf4', padding: '15px', borderRadius: '8px',
                                    border: '1px solid #bbf7d0', color: '#166534', marginTop: '10px',
                                    fontStyle: 'italic', lineHeight: '1.5'
                                }}>
                                    "{selectedWarning.explanation}"
                                    <div style={{ fontSize: '11px', color: '#166534', marginTop: '10px', textAlign: 'right' }}>
                                        Submitted on: {new Date(selectedWarning.explanation_date).toLocaleString()}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: '#999', marginTop: '10px', fontStyle: 'italic' }}>
                                    Employee has not submitted an explanation yet.
                                </div>
                            )}
                        </div>

                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button className="btn btn-primary" onClick={() => setSelectedWarning(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Issue Disciplinary Warning</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Employee *</label>
                                <select className="form-control" required
                                    value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })}>
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Severity *</label>
                                <select className="form-control"
                                    value={formData.severity} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                    <option>Critical</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Reason / Incident *</label>
                                <textarea className="form-control" rows="3" required
                                    value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Describe the incident..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Action Taken</label>
                                <input type="text" className="form-control"
                                    value={formData.action_taken} onChange={e => setFormData({ ...formData, action_taken: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" className="form-control"
                                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-danger">Issue Warning</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
