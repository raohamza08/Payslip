import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Attendance() {
    const [employees, setEmployees] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

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

    const handleMark = async (employee_id, status) => {
        try {
            await api.markAttendance({
                employee_id,
                date: selectedDate,
                status,
                notes: ''
            });
            setMessage(`Marked ${status} for employee`);
            loadData();
            setTimeout(() => setMessage(''), 3000);
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div>
            <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1>Attendance Management</h1>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ width: 200, padding: '8px 12px' }}
                />
            </div>

            {message && (
                <div style={{
                    padding: '12px 20px',
                    background: '#dcfce7',
                    color: '#166534',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #86efac'
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
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
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
                                    <td className="flex-row">
                                        <button
                                            className="btn btn-success"
                                            style={{ padding: '4px 8px', fontSize: '12px' }}
                                            onClick={() => handleMark(emp.id, 'Present')}
                                        >
                                            Present
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '4px 8px', fontSize: '12px' }}
                                            onClick={() => handleMark(emp.id, 'Absent')}
                                        >
                                            Absent
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '4px 8px', fontSize: '12px', background: '#fef9c3', border: '1px solid #ca8a04', color: '#854d0e' }}
                                            onClick={() => handleMark(emp.id, 'Leave')}
                                        >
                                            Leave
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
