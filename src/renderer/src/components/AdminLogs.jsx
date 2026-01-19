import React, { useState, useEffect } from 'react';
import api from '../api';
import { RefreshIcon } from './Icons';

export default function AdminLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await api.getAdminLogs();
            setLogs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = filter === 'ALL'
        ? logs
        : logs.filter(l => l.status === filter);

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS': return '#045617ff';
            case 'FAIL': return '#710610ff';
            case 'ERROR': return '#a07801ff';
            default: return '#506374ff';
        }
    };

    return (
        <div>
            <div className="toolbar">
                <h1>Activity Logs</h1>
                <div className="toolbar-group">
                    <select
                        className="form-control"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: '150px' }}
                    >
                        <option value="ALL">All Status</option>
                        <option value="SUCCESS">Success</option>
                        <option value="FAIL">Fail</option>
                        <option value="ERROR">Error</option>
                    </select>
                    <button className="btn btn-secondary" onClick={loadLogs} disabled={loading}>
                        <RefreshIcon />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Status</th>
                            <th>IP Address</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(filteredLogs) && filteredLogs.map(log => (
                            <tr key={log.id}>
                                <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td><strong>{log.user_email || 'System'}</strong></td>
                                <td><code style={{ background: '#f0f0f0', padding: '2px 5px', borderRadius: 4 }}>{log.action}</code></td>
                                <td>
                                    <span style={{
                                        color: 'white',
                                        background: getStatusColor(log.status),
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontSize: '11px',
                                        fontWeight: 'bold'
                                    }}>
                                        {log.status}
                                    </span>
                                </td>
                                <td style={{ fontSize: '12px' }}>{log.ip_address}</td>
                                <td style={{ fontSize: '13px', color: '#555' }}>{log.details}</td>
                            </tr>
                        ))}
                        {!loading && filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                                    No logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
