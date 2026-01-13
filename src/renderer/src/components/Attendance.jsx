import React, { useState, useEffect } from 'react';
import api from '../api';
import { exportToCSV } from '../utils/exportToCSV';

const leaveTypes = [
    "Casual Leave", "Sick Leave", "Annual Leave", "Earned Leave",
    "Family/Compassionate Leave", "Unpaid Leave", "Half Day Leave",
    "Festive Leave", "Matrimonial Leave", "Work From Home", "Study Leave", "Other"
];

export default function Attendance() {
    const [employees, setEmployees] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Leave Modal State
    const [leaveModal, setLeaveModal] = useState({ show: false, empId: null });
    const [leaveReason, setLeaveReason] = useState({ type: 'Casual Leave', note: '' });

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const emps = await api.getEmployees();
            setEmployees(emps);
            const att = await api.getAttendance(selectedDate);
            const attMap = {};
            att.forEach(a => {
                attMap[a.employee_id] = a;
            });
            setAttendanceData(attMap);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleMark = async (employee_id, status, notes = '') => {
        try {
            await api.markAttendance({
                employee_id,
                date: selectedDate,
                status,
                notes
            });
            setMessage(`Marked ${status} for employee`);
            loadData();
            setTimeout(() => setMessage(''), 3000);
        } catch (e) {
            alert(e.message);
        }
    };

    const openLeaveModal = (id) => {
        setLeaveModal({ show: true, empId: id });
        setLeaveReason({ type: 'Casual Leave', note: '' });
    };

    const confirmLeave = async () => {
        // Construct detailed reason
        let finalNote = leaveReason.type;
        if (leaveReason.type === 'Other' || leaveReason.note) {
            finalNote = leaveReason.type === 'Other' ? leaveReason.note : `${leaveReason.type} - ${leaveReason.note}`;
        }

        await handleMark(leaveModal.empId, 'Leave', finalNote);
        setLeaveModal({ show: false, empId: null });
    };

    const handleExport = () => {
        const data = employees.map(emp => {
            const att = attendanceData[emp.id] || {};
            return {
                EmployeeID: emp.employee_id || emp.id,
                Name: emp.name,
                Date: selectedDate,
                Status: att.status || 'Not Marked',
                Notes: att.notes || ''
            };
        });
        exportToCSV(data, `Attendance_${selectedDate}`);
    };

    return (
        <div>
            <div className="toolbar">
                <h1>Attendance Management</h1>
                <div className="toolbar-group">
                    <button className="btn btn-secondary" onClick={handleExport}>Export to Excel</button>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="form-control"
                        style={{ width: 'auto' }}
                    />
                </div>
            </div>

            {message && (
                <div style={{
                    padding: '12px 20px', background: '#dcfce7', color: '#166534',
                    borderRadius: '8px', marginBottom: '20px', border: '1px solid #86efac'
                }}>
                    {message}
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => {
                            const att = attendanceData[emp.id] || {};
                            return (
                                <tr key={emp.id}>
                                    <td>{emp.employee_id || emp.id.substring(0, 8)}</td>
                                    <td>{emp.name}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                                            backgroundColor: att.status === 'Present' ? '#dcfce7' :
                                                att.status === 'Absent' ? '#fee2e2' :
                                                    att.status === 'Leave' ? '#fef9c3' : '#f3f4f6',
                                            color: att.status === 'Present' ? '#166534' :
                                                att.status === 'Absent' ? '#991b1b' :
                                                    att.status === 'Leave' ? '#854d0e' : '#4b5563'
                                        }}>
                                            {att.status || 'Not Marked'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '12px', color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {att.notes || '-'}
                                    </td>
                                    <td className="flex-row">
                                        <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleMark(emp.id, 'Present')}>Present</button>
                                        <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleMark(emp.id, 'Absent')}>Absent</button>
                                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', background: '#fef9c3', border: '1px solid #ca8a04', color: '#854d0e' }} onClick={() => openLeaveModal(emp.id)}>Leave</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Leave Modal */}
            {leaveModal.show && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Mark Leave</h2>
                        <div className="form-group">
                            <label>Leave Type</label>
                            <select
                                className="form-control"
                                value={leaveReason.type}
                                onChange={e => setLeaveReason({ ...leaveReason, type: e.target.value })}
                            >
                                {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {(leaveReason.type === 'Other' || true) && (
                            <div className="form-group">
                                <label>{leaveReason.type === 'Other' ? 'Specify Reason' : 'Additional Note (Optional)'}</label>
                                <input
                                    className="form-control"
                                    value={leaveReason.note}
                                    onChange={e => setLeaveReason({ ...leaveReason, note: e.target.value })}
                                    placeholder={leaveReason.type === 'Other' ? "Enter custom reason..." : "e.g. Morning off"}
                                    required={leaveReason.type === 'Other'}
                                />
                            </div>
                        )}

                        <div className="flex-row flex-end" style={{ marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setLeaveModal({ show: false, empId: null })}>Cancel</button>
                            <button className="btn btn-primary" onClick={confirmLeave}>Confirm Leave</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
