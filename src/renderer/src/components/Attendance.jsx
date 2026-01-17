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
        } catch (e) {
            console.error(e);
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
        <div className="p-20">
            <div className="toolbar" style={{ marginBottom: 20 }}>
                <h1>Attendance Management</h1>
                <div className="toolbar-group">
                    <button className={`btn ${view === 'sync' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('sync')}>Sync Dashboard</button>
                    <button className={`btn ${view === 'logs' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('logs')}>View Logs</button>
                </div>
            </div>

            {view === 'sync' && (
                <div>
                    <div className="flex-row flex-between" style={{ alignItems: 'center', marginBottom: 20 }}>
                        <div className="flex-row" style={{ alignItems: 'center', gap: 10 }}>
                            <h3>Auto-Sync Status</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowConfig(!showConfig)}>⚙️ Config</button>
                        </div>
                        <button className="btn btn-primary" onClick={runAutoSync} disabled={status === 'Syncing...' || !csvUrl}>
                            {status === 'Syncing...' ? 'Syncing...' : 'Force Sync Now'}
                        </button>
                    </div>

                    {showConfig && (
                        <div className="card shadow" style={{ marginBottom: 20, borderLeft: '4px solid #6366f1' }}>
                            <div className="form-group">
                                <label>Published CSV Link</label>
                                <input className="form-control" value={csvUrl} onChange={handleUrlChange} />
                            </div>
                        </div>
                    )}

                    <div className="card shadow" style={{ padding: 30, textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>
                            {status === 'Syncing...' ? '🔄' : status === 'Error' ? '❌' : status === 'Config Needed' ? '⚙️' : '✅'}
                        </div>
                        <h3>{status === 'Syncing...' ? 'Syncing...' : status === 'Error' ? 'Sync Failed' : status === 'Config Needed' ? 'Setup Required' : 'Up to Date'}</h3>
                        {lastSyncTime && <p style={{ fontSize: 12, color: '#888' }}>Last successful sync: {lastSyncTime.toLocaleString()}</p>}
                    </div>

                    <div className="card shadow" style={{ marginTop: 20 }}>
                        <h3>Sync Log</h3>
                        <div style={{ padding: 15, background: '#1e1e1e', color: '#fff', borderRadius: 8, marginTop: 10, fontFamily: 'monospace' }}>
                            {report.map((line, i) => <div key={i} style={{ marginBottom: 5 }}>{line}</div>)}
                        </div>
                    </div>
                </div>
            )}

            {view === 'logs' && (
                <div>
                    <div className="card shadow" style={{ marginBottom: 15, padding: '15px' }}>
                        <div className="toolbar" style={{ border: 'none', padding: 0, gap: '15px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Date</label>
                                <input type="date" className="form-control" value={logDate} onChange={e => setLogDate(e.target.value)} style={{ width: 'auto' }} />
                            </div>

                            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Search Name / ID</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search employee or ID..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Direction</label>
                                <select className="form-control" value={directionFilter} onChange={e => setDirectionFilter(e.target.value)}>
                                    <option value="ALL">All Directions</option>
                                    <option value="IN">IN Only</option>
                                    <option value="OUT">OUT Only</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button className="btn btn-primary" onClick={loadLogs}>Refresh</button>
                            </div>
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Employee</th>
                                    <th>Biometric ID</th>
                                    <th>Emp Code</th>
                                    <th>Direction</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                            No logs found for the current filters.
                                        </td>
                                    </tr>
                                )}
                                {filteredLogs.map(log => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td><strong>{log.name || 'Unknown'}</strong></td>
                                        <td><code>{log.biometric_id}</code></td>
                                        <td>{log.empCode || '-'}</td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 'bold',
                                                background: log.direction === 'IN' ? '#dcfce7' : '#fee2e2',
                                                color: log.direction === 'IN' ? '#166534' : '#991b1b'
                                            }}>{log.direction}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
