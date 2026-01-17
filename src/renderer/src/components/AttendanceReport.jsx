import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AttendanceReport() {
    const [activeTab, setActiveTab] = useState('attendance');
    const [attendanceData, setAttendanceData] = useState([]);
    const [kpiData, setKpiData] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (activeTab === 'attendance') {
            loadAttendance();
        } else {
            loadKPIs();
        }
    }, [month, year, activeTab]);

    const loadAttendance = async () => {
        setLoading(true);
        try {
            const data = await api.getAttendanceReport(month, year);
            setAttendanceData(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    };

    const loadKPIs = async () => {
        setLoading(true);
        try {
            const [kpis, emps] = await Promise.all([
                api.fetchJson('/api/performance'),
                api.getEmployees()
            ]);
            setKpiData(Array.isArray(kpis) ? kpis : []);
            setEmployees(Array.isArray(emps) ? emps : []);
        } catch (e) {
            console.error(e);
            setKpiData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (activeTab === 'attendance') exportAttendance();
        else exportKPIs();
    };

    const exportAttendance = () => {
        if (attendanceData.length === 0) return alert('No data to export');
        const headers = ['Employee ID', 'Name', 'Present', 'Absent', 'Leave', 'Sitting Hours', 'Total Days'];
        const csvContent = [
            headers.join(','),
            ...attendanceData.map(row => [
                row.employee_id || row.id,
                `"${row.name}"`,
                row.present,
                row.absent,
                row.leave,
                row.sitting_hours || '0.00',
                row.total
            ].join(','))
        ].join('\n');
        downloadCSV(csvContent, `Attendance_Report_${month}_${year}.csv`);
    };

    const exportKPIs = () => {
        if (kpiData.length === 0) return alert('No data to export');
        const headers = ['Employee', 'Period', 'Quality', 'Speed', 'Initiative', 'Teamwork', 'Attendance', 'Final Rating'];
        const csvContent = [
            headers.join(','),
            ...kpiData.map(row => [
                `"${row.employees?.name || 'Unknown'}"`,
                `"${row.period}"`,
                row.quality_rating,
                row.speed_rating,
                row.initiative_rating,
                row.teamwork_rating,
                row.attendance_rating,
                row.final_rating
            ].join(','))
        ].join('\n');
        downloadCSV(csvContent, `KPI_Performance_Report.csv`);
    };

    const downloadCSV = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.click();
    };

    return (
        <div className="view-container">
            <div className="tab-nav">
                <button
                    className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('attendance')}
                >
                    Attendance Report
                </button>
                <button
                    className={`tab-btn ${activeTab === 'kpi' ? 'active' : ''}`}
                    onClick={() => setActiveTab('kpi')}
                >
                    KPI Performance Report
                </button>
            </div>

            <div className="filter-bar">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {activeTab === 'attendance' && (
                        <>
                            <div className="form-group" style={{ margin: 0 }}>
                                <select value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <select value={year} onChange={e => setYear(parseInt(e.target.value))}>
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <option key={i} value={2024 + i}>{2024 + i}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                    <button className="btn btn-secondary" onClick={handleExport}>
                        Export CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Loading report data...</div>
            ) : activeTab === 'attendance' ? (
                <div className="card shadow" style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Name</th>
                                <th>Shift</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Leaves</th>
                                <th>Sitting Hours</th>
                                <th>Total Days</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceData.map(row => (
                                <tr key={row.id}>
                                    <td>{row.employee_id || row.id.substring(0, 8)}</td>
                                    <td><strong>{row.name}</strong></td>
                                    <td><span className="badge secondary">{row.shift_type || 'Morning'}</span></td>
                                    <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{row.present}</td>
                                    <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{row.absent}</td>
                                    <td style={{ color: '#f59e0b', fontWeight: 'bold' }}>{row.leave}</td>
                                    <td style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{row.sitting_hours || '0.00'} hrs</td>
                                    <td>{row.total}</td>
                                </tr>
                            ))}
                            {attendanceData.length === 0 && <tr><td colSpan="6" className="text-center p-20">No data found for this period.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card shadow" style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Period</th>
                                <th>Quality</th>
                                <th>Speed</th>
                                <th>Initiative</th>
                                <th>Teamwork</th>
                                <th>Attendance</th>
                                <th>Final Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {kpiData.map(row => (
                                <tr key={row.id}>
                                    <td><strong>{row.employees?.name || 'Unknown'}</strong></td>
                                    <td>{row.period}</td>
                                    <td>{row.quality_rating}/5</td>
                                    <td>{row.speed_rating}/5</td>
                                    <td>{row.initiative_rating}/5</td>
                                    <td>{row.teamwork_rating}/5</td>
                                    <td>{row.attendance_rating}/5</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '5px',
                                            background: row.final_rating >= 4 ? '#dcfce7' : row.final_rating >= 3 ? '#fef9c3' : '#fee2e2',
                                            color: row.final_rating >= 4 ? '#166534' : row.final_rating >= 3 ? '#854d0e' : '#991b1b',
                                            fontWeight: 'bold'
                                        }}>
                                            {row.final_rating} / 5.0
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {kpiData.length === 0 && <tr><td colSpan="8" className="text-center p-20">No performance reviews found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
