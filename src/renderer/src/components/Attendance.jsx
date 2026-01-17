import React, { useState, useEffect } from 'react';
import api from '../api';

const DEFAULT_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhxvyDalfBTJrGtts4KF51x8rP2Cm-dPVb9u_3S2IiD9SH-1-8LQtxuNO5zNELhps0gxV0K6_Zmjwo/pub?gid=719528164&single=true&output=csv';

export default function Attendance() {
    const [view, setView] = useState('sync'); // 'sync' | 'logs'
    const [status, setStatus] = useState('Idle');
    const [report, setReport] = useState([]);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [csvUrl, setCsvUrl] = useState(localStorage.getItem('attendance_sheet_url') || DEFAULT_URL);
    const [showConfig, setShowConfig] = useState(false);

    // Absentees View State
    const [absentees, setAbsentees] = useState([]);
    const [loadingAbsentees, setLoadingAbsentees] = useState(false);
    const [shiftFilter, setShiftFilter] = useState('ALL');

    // Logs View State
    const [logs, setLogs] = useState([]);
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [directionFilter, setDirectionFilter] = useState('ALL');

    useEffect(() => {
        if (view === 'sync' && csvUrl) runAutoSync();
        if (view === 'logs') loadLogs();
    }, [view, logDate]);

    const handleUrlChange = (e) => {
        const val = e.target.value;
        setCsvUrl(val);
        localStorage.setItem('attendance_sheet_url', val);
    };

    const runAutoSync = async () => {
        if (!csvUrl) { setStatus('Config Needed'); return; }

        setStatus('Syncing...');
        try {
            const text = await api.fetchCSVProxy(csvUrl);
            const rows = text.trim().split(/\r?\n/).map(line => {
                // Safer split that handles basic CSV (doesn't handle commas inside quotes, 
                // but biometric CSVs usually don't have those).
                return line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
            });

            if (rows.length < 2) throw new Error('Empty CSV');

            const headers = rows[0];
            const data = rows.slice(1);

            const colMap = {
                userId: headers.findIndex(h => h.toLowerCase().includes('userid') || h.toLowerCase().includes('user id')),
                userName: headers.findIndex(h => h.toLowerCase().includes('username') || h.toLowerCase().includes('name')),
                date: headers.findIndex(h => h.toLowerCase().includes('punch date') || h.toLowerCase().includes('date')),
                time: headers.findIndex(h => h.toLowerCase().includes('punch time') || h.toLowerCase().includes('time')),
                type: headers.findIndex(h => h.toLowerCase().includes('type') || h.toLowerCase().includes('status'))
            };

            if (Object.values(colMap).some(i => i === -1)) {
                const missing = Object.entries(colMap).filter(([k, v]) => v === -1).map(([k]) => k).join(', ');
                throw new Error(`Missing columns: ${missing}.`);
            }

            const logsToImport = [];
            let skipped = 0;

            for (const row of data) {
                if (row.length < headers.length) continue;
                const userId = row[colMap.userId];
                const userName = row[colMap.userName];
                const dateStr = row[colMap.date];
                const timeStr = row[colMap.time];
                const type = row[colMap.type];

                if (!userName) { skipped++; continue; }

                let timestamp = null;
                try {
                    const d = new Date(`${dateStr} ${timeStr}`);
                    if (!isNaN(d.getTime())) timestamp = d.toISOString();
                    else { skipped++; continue; }
                } catch (e) { skipped++; continue; }

                logsToImport.push({ name: userName, userId, timestamp, type });
            }

            const res = await api.importBiometricLogs(logsToImport);

            setLastSyncTime(new Date());
            setStatus('Synced');
            setReport([
                `Latest Sync: ${new Date().toLocaleTimeString()}`,
                `Rows Parsed: ${data.length}`,
                `Processed Logs: ${res.processed}`,
                `Employee Links Updated: ${res.updated}`,
                `Skipped/Invalid: ${skipped}`,
                res.processed === 0 ? 'Warning: 0 Logs Processed. Check Name Mapping.' : ''
            ]);

        } catch (e) {
            console.error(e);
            setStatus('Error');
            setReport([`Error: ${e.message}`, 'Check your Sheet URL and Permissions.']);
        }
    };

    const loadLogs = async () => {
        try {
            const data = await api.getBiometricLogs(logDate);
            setLogs(data);
            if (view === 'absentees') calculateAbsentees(data);
        } catch (e) {
            console.error(e);
        }
    };

    const calculateAbsentees = async (currentLogs) => {
        setLoadingAbsentees(true);
        try {
            const employees = await api.getEmployees();
            const leaves = await api.getLeaves(); // Get all leaves to filter

            // Get unique biometric IDs from logs for the selected date
            const presentIds = new Set(currentLogs.map(l => l.biometric_id?.toString().toLowerCase().trim()));

            const missing = employees.filter(emp => {
                const bioId = emp.biometric_id?.toString().toLowerCase().trim();

                // If they punched in, they are not absent
                if (bioId && presentIds.has(bioId)) return false;

                // Check if they are on approved leave today
                const isOnLeave = (leaves || []).some(leave => {
                    if (leave.employee_id !== emp.id || leave.status !== 'Approved') return false;
                    const start = new Date(leave.start_date);
                    const end = new Date(leave.end_date);
                    const current = new Date(logDate);
                    return current >= start && current <= end;
                });

                return !isOnLeave;
            });

            setAbsentees(missing);
        } catch (e) {
            console.error('Failed to calculate absentees:', e);
        } finally {
            setLoadingAbsentees(false);
        }
    };

    const filteredLogs = (logs || []).filter(log => {
        const query = searchQuery.toLowerCase();
        const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();

        const matchesSearch = (log.name || '').toLowerCase().includes(query) ||
            (log.biometric_id || '').toLowerCase().includes(query) ||
            (log.empCode || '').toLowerCase().includes(query) ||
            timeStr.includes(query);

        const matchesDirection = directionFilter === 'ALL' || log.direction === directionFilter;

        return matchesSearch && matchesDirection;
    });

    return (
        <div className="view-container">
            <div className="toolbar">
                <div>
                    <h1>Attendance Management</h1>
                    <p className="text-light">Synchronize biometric logs and monitor daily attendance patterns.</p>
                </div>
                <div className="toolbar-group">
                    <button className={`btn ${view === 'sync' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('sync')}>Sync Dashboard</button>
                    <button className={`btn ${view === 'logs' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('logs')}>View Logs</button>
                    <button className={`btn ${view === 'absentees' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setView('absentees'); loadLogs(); }}>Daily Absentees</button>
                </div>
            </div>

            {view === 'sync' && (
                <div className="flex-column">
                    <div className="flex-row flex-between" style={{ alignItems: 'center' }}>
                        <div className="flex-row" style={{ alignItems: 'center' }}>
                            <h3>Synchronization Engine</h3>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowConfig(!showConfig)}>⚙️ Config</button>
                        </div>
                        <button className="btn btn-primary" onClick={runAutoSync} disabled={status === 'Syncing...' || !csvUrl}>
                            {status === 'Syncing...' ? 'Syncing...' : 'Start Manual Sync'}
                        </button>
                    </div>

                    {showConfig && (
                        <div className="card">
                            <div className="form-group">
                                <label>Published CSV Endpoint (Google Sheets)</label>
                                <input value={csvUrl} onChange={handleUrlChange} placeholder="Enter URL..." />
                            </div>
                        </div>
                    )}

                    <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
                            {status === 'Syncing...' ? '🔄' : status === 'Error' ? '❌' : status === 'Config Needed' ? '⚙️' : '✅'}
                        </div>
                        <h2 style={{ marginBottom: '10px' }}>{status === 'Syncing...' ? 'Processing Logs...' : status === 'Error' ? 'Sync Failed' : status === 'Config Needed' ? 'Configuration Required' : 'Engine Standardized'}</h2>
                        {lastSyncTime && <p className="text-light">Last successful heartbeat: {lastSyncTime.toLocaleString()}</p>}
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: '15px' }}>Terminal Output</h3>
                        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', color: '#00F5D4', borderRadius: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                            {report.map((line, i) => <div key={i} style={{ marginBottom: '5px' }}>{i === 0 ? '> ' : ''}{line}</div>)}
                            {report.length === 0 && <div className="text-light">Ready for synchronization...</div>}
                        </div>
                    </div>
                </div>
            )}

            {view === 'logs' && (
                <div className="flex-column">
                    <div className="filter-bar">
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Date Filter</label>
                            <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} style={{ width: '180px' }} />
                        </div>

                        <div className="form-group" style={{ margin: 0, flex: 1 }}>
                            <label>Quick Search</label>
                            <input
                                type="text"
                                placeholder="Employee name, ID, or time..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Log Direction</label>
                            <select value={directionFilter} onChange={e => setDirectionFilter(e.target.value)} style={{ width: '160px' }}>
                                <option value="ALL">All Entries</option>
                                <option value="IN">In Only</option>
                                <option value="OUT">Out Only</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                            <button className="btn btn-secondary" onClick={loadLogs}>Refresh</button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Employee</th>
                                    <th>Shift Info</th>
                                    <th>Biometric ID</th>
                                    <th>System Code</th>
                                    <th className="text-center">Direction</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td><strong>{log.name || 'Unknown'}</strong></td>
                                        <td><span className="badge warning" style={{ fontSize: '10px' }}>{log.shift || '-'}</span></td>
                                        <td><code className="text-light">{log.biometric_id}</code></td>
                                        <td>{log.empCode || '-'}</td>
                                        <td className="text-center">
                                            <span className={`badge ${log.direction === 'IN' ? 'success' : 'danger'}`}>
                                                {log.direction}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr><td colSpan="6" className="text-center">No biometric logs found for the selected criteria.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'absentees' && (
                <div className="flex-column">
                    <div className="filter-bar">
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Reference Date</label>
                            <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} style={{ width: '180px' }} />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Shift Filter</label>
                            <select value={shiftFilter} onChange={e => setShiftFilter(e.target.value)} style={{ width: '220px' }}>
                                <option value="ALL">All Departments</option>
                                <option value="Morning">Morning Operations</option>
                                <option value="Evening">Evening Operations</option>
                                <option value="Night">Night Operations</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={loadLogs}>Recalculate Absentees</button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>Employee ID</th>
                                    <th>Shift Type</th>
                                    <th>Department</th>
                                    <th className="text-center">Incident Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingAbsentees ? (
                                    <tr><td colSpan="5" className="text-center">Scanning database for biometric mismatches...</td></tr>
                                ) : (
                                    <>
                                        {(absentees || []).filter(emp => shiftFilter === 'ALL' || (emp.shift_type || '').includes(shiftFilter)).map(emp => (
                                            <tr key={emp.id}>
                                                <td><strong>{emp.name}</strong></td>
                                                <td>{emp.employee_id}</td>
                                                <td><span className="badge warning">{emp.shift_type || 'Morning'}</span></td>
                                                <td>{emp.department}</td>
                                                <td className="text-center">
                                                    <span className="badge danger">UNREPORTED ABSENCE</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(absentees || []).filter(emp => shiftFilter === 'ALL' || (emp.shift_type || '').includes(shiftFilter)).length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center" style={{ color: 'var(--success)', fontWeight: '700' }}>
                                                    🎯 100% Attendance: No discrepancies detected for today.
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
