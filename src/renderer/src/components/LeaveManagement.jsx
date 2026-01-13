import React, { useState, useEffect } from 'react';
import api from '../api';

export default function LeaveManagement({ user }) {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');

    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const [formData, setFormData] = useState({
        leave_type: 'Annual Leave',
        start_date: '',
        end_date: '',
        reason: '',
        days_count: 0
    });

    const leaveTypes = [
        'Annual Leave',
        'Sick Leave',
        'Casual Leave',
        'Unpaid Leave',
        'Emergency Leave',
        'Half Leave',
        'Maternity Leave',
        'Paternity Leave',
        'Study Leave',
        'Bereavement Leave'
    ];

    useEffect(() => {
        loadLeaves();
    }, []);

    const loadLeaves = async () => {
        setLoading(true);
        try {
            const data = await api.getLeaves();
            setLeaves(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setLeaves([]);
        }
        setLoading(false);
    };

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
            await api.requestLeave(formData);
            alert('Leave request submitted successfully!');
            setShowModal(false);
            setFormData({
                leave_type: 'Annual Leave',
                start_date: '',
                end_date: '',
                reason: '',
                days_count: 0
            });
            loadLeaves();
        } catch (e) {
            alert(e.message);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        if (!confirm(`Are you sure you want to ${status.toLowerCase()} this leave request?`)) return;
        try {
            const comment = status === 'Rejected' ? prompt('Reason for rejection (optional):') : '';
            await api.updateLeaveStatus(id, status, comment || '');
            alert(`Leave request ${status.toLowerCase()} successfully!`);
            loadLeaves();
        } catch (e) {
            alert(e.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return { bg: '#dcfce7', color: '#166534' };
            case 'Rejected': return { bg: '#fee2e2', color: '#991b1b' };
            case 'Pending': return { bg: '#fef9c3', color: '#854d0e' };
            default: return { bg: '#f3f4f6', color: '#4b5563' };
        }
    };

    const filteredLeaves = leaves.filter(leave => {
        if (filter === 'all') return true;
        return leave.status === filter;
    });

    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.email === 'hamzabadar.euroshub@gmail.com';
    const isSuperAdmin = user?.role === 'super_admin' || user?.email === 'hamzabadar.euroshub@gmail.com';

    // Calculate leave statistics by category
    const leaveByCategory = {};
    leaves.filter(l => l.status === 'Approved').forEach(leave => {
        const type = leave.leave_type || 'Other';
        if (!leaveByCategory[type]) {
            leaveByCategory[type] = 0;
        }
        leaveByCategory[type] += Number(leave.days_count) || 0;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Leave Management</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        className="form-control"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: '150px' }}
                    >
                        <option value="all">All Requests</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Request Leave
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid-3" style={{ marginBottom: '20px' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', opacity: 0.9 }}>Total Requests</h3>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{leaves.length}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', opacity: 0.9 }}>Pending</h3>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                        {leaves.filter(l => l.status === 'Pending').length}
                    </div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', opacity: 0.9 }}>Approved</h3>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                        {leaves.filter(l => l.status === 'Approved').length}
                    </div>
                </div>
            </div>

            {/* Leave Requests Table */}
            <div className="card" style={{ overflowX: 'auto' }}>
                <table className="table">
                    <thead>
                        <tr>
                            {isAdmin && <th>Employee</th>}
                            <th>Type</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Days</th>
                            <th>Reason</th>
                            <th>Status</th>
                            {isAdmin && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeaves.map(leave => {
                            const statusStyle = getStatusColor(leave.status);
                            return (
                                <tr key={leave.id}>
                                    {isAdmin && (
                                        <td>
                                            <strong>{leave.employees?.name || 'Unknown'}</strong>
                                            {(!leave.employees?.name || leave.employees?.name === 'Unknown') && (
                                                <div style={{ fontSize: '10px', color: 'red' }}>ID: {leave.employee_id?.substring(0, 8)}...</div>
                                            )}
                                        </td>
                                    )}
                                    <td>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            background: '#e0f2fe',
                                            color: '#0369a1',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            {leave.leave_type}
                                        </span>
                                    </td>
                                    <td>{leave.start_date}</td>
                                    <td>{leave.end_date}</td>
                                    <td><strong>{leave.days_count || 0}</strong> days</td>
                                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {leave.reason || '-'}
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                            background: statusStyle.bg, color: statusStyle.color
                                        }}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                                    onClick={() => { setSelectedLeave(leave); setShowViewModal(true); }}
                                                >
                                                    View
                                                </button>
                                                {leave.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            className="btn btn-success"
                                                            style={{ padding: '4px 8px', fontSize: '12px' }}
                                                            onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            className="btn btn-danger"
                                                            style={{ padding: '4px 8px', fontSize: '12px' }}
                                                            onClick={() => handleStatusUpdate(leave.id, 'Rejected')}
                                                        >
                                                            ✗
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {filteredLeaves.length === 0 && (
                            <tr>
                                <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                    {loading ? 'Loading...' : 'No leave requests found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Request Leave Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <h2>Request Leave</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Leave Type *</label>
                                    <select
                                        className="form-control"
                                        value={formData.leave_type}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                        required
                                    >
                                        {leaveTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Duration</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={`${formData.days_count} day(s)`}
                                        readOnly
                                        style={{ background: '#f3f4f6', fontWeight: 'bold' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Start Date *</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={formData.start_date}
                                        onChange={(e) => handleDateChange('start_date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date *</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={formData.end_date}
                                        onChange={(e) => handleDateChange('end_date', e.target.value)}
                                        min={formData.start_date}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Reason *</label>
                                <textarea
                                    className="form-control"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    rows="4"
                                    placeholder="Please provide a detailed reason for your leave request..."
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {showViewModal && selectedLeave && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '500px' }}>
                        <div className="flex-row flex-between" style={{ alignItems: 'center' }}>
                            <h2>Leave Details</h2>
                            <div className={`badge ${(selectedLeave.status || 'Pending').toLowerCase()}`}>{selectedLeave.status || 'Pending'}</div>
                        </div>

                        <div style={{ margin: '20px 0', fontSize: '14px', lineHeight: '1.6' }}>
                            <p><strong>Employee:</strong> {selectedLeave.employees?.name || 'Unknown'} <span style={{ fontSize: '11px', color: '#888' }}>({selectedLeave.employee_id})</span></p>
                            <p><strong>Type:</strong> {selectedLeave.leave_type}</p>
                            <p><strong>Date:</strong> {selectedLeave.start_date} to {selectedLeave.end_date} ({selectedLeave.days_count} days)</p>
                            <p style={{ marginTop: '10px' }}><strong>Reason:</strong></p>
                            <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '4px', fontStyle: 'italic' }}>
                                "{selectedLeave.reason}"
                            </div>
                            {selectedLeave.comment && (
                                <div style={{ marginTop: '10px' }}>
                                    <p><strong>Admin Comment:</strong></p>
                                    <p style={{ color: '#666' }}>{selectedLeave.comment}</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
                            {selectedLeave.status === 'Pending' && isAdmin && (
                                <>
                                    <button className="btn btn-danger" onClick={() => {
                                        handleStatusUpdate(selectedLeave.id, 'Rejected');
                                        setShowViewModal(false);
                                    }}>Reject</button>
                                    <button className="btn btn-success" onClick={() => {
                                        handleStatusUpdate(selectedLeave.id, 'Approved');
                                        setShowViewModal(false);
                                    }}>Approve</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
