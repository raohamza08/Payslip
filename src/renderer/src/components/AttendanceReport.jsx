import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AttendanceReport() {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadReport();
    }, [month, year]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const data = await api.getAttendanceReport(month, year);
            setReport(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (report.length === 0) return alert('No data to export');

        const headers = ['Employee ID', 'Name', 'Present', 'Absent', 'Leave', 'Total Days'];
        const csvContent = [
            headers.join(','),
            ...report.map(row => [
                row.employee_id || row.id,
                `"${row.name}"`,
                row.present,
                row.absent,
                row.leave,
                row.total
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Attendance_Report_${month}_${year}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1>Attendance Report</h1>
                <div className="flex-row">
                    <select value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select value={year} onChange={e => setYear(parseInt(e.target.value))}>
                        {Array.from({ length: 5 }, (_, i) => (
                            <option key={i} value={2024 + i}>{2024 + i}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary" onClick={handleExport} style={{ marginLeft: 10 }}>
                        📊 Export to Excel
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Leaves</th>
                            <th>Total Days</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.map(row => (
                            <tr key={row.id}>
                                <td>{row.employee_id || row.id.substring(0, 8)}</td>
                                <td>{row.name}</td>
                                <td style={{ color: 'green', fontWeight: 'bold' }}>{row.present}</td>
                                <td style={{ color: 'red', fontWeight: 'bold' }}>{row.absent}</td>
                                <td style={{ color: 'orange', fontWeight: 'bold' }}>{row.leave}</td>
                                <td>{row.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
