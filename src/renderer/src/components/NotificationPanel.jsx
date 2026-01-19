import React, { useState, useEffect } from 'react';
import api from '../api';
import { CloseIcon } from './Icons';

export default function NotificationPanel({ onNavigate }) {
    const [notifications, setNotifications] = useState([]);
    const [showList, setShowList] = useState(false);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await api.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('[NOTIF] Load error:', e);
        }
    };

    const handleNotificationClick = (n) => {
        handleMarkRead(n.id);

        if (onNavigate) {
            const text = ((n.title || '') + ' ' + (n.message || '')).toLowerCase();

            if (text.includes('leave')) onNavigate('admin-leaves');
            else if (text.includes('attendance') || text.includes('punch') || text.includes('late')) onNavigate('attendance');
            else if (text.includes('payroll') || text.includes('salary') || text.includes('payslip')) onNavigate('payroll');
            else if (text.includes('asset')) onNavigate('assets');
            else if (text.includes('performance') || text.includes('review') || text.includes('kpi')) onNavigate('performance');
            else if (text.includes('expense')) onNavigate('expenses');
            else if (text.includes('warning') || text.includes('disciplinary')) onNavigate('warnings');
        }
        setShowList(false);
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setShowList(!showList)}
                className="btn-icon"
                style={{ position: 'relative', width: '40px', height: '40px' }}
                title="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white',
                        fontSize: '10px', fontWeight: 'bold', height: '18px', minWidth: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '9px', border: '2px solid white'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {showList && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowList(false)} />
                    <div style={{
                        position: 'absolute', top: '50px', right: '-10px', width: '360px', maxHeight: '500px',
                        background: 'white', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                        zIndex: 999, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: '#f9fafb'
                        }}>
                            <h4 style={{ margin: 0, fontSize: '16px', color: '#111827' }}>Notifications</h4>
                            <button
                                onClick={() => setShowList(false)}
                                className="btn-icon"
                                style={{ width: '28px', height: '28px', color: '#6b7280' }}
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div style={{ overflowY: 'auto', padding: '0' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>📭</div>
                                    <p style={{ margin: 0, fontSize: '14px' }}>No new notifications</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        style={{
                                            padding: '16px 20px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                                            background: n.is_read ? 'white' : '#eff6ff',
                                            transition: 'background 0.2s',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'white' : '#eff6ff'}
                                    >
                                        {!n.is_read && (
                                            <div style={{
                                                position: 'absolute', left: '0', top: '0', bottom: '0', width: '4px', background: '#3b82f6'
                                            }} />
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <strong style={{ fontSize: '14px', color: '#1f2937', fontWeight: n.is_read ? '500' : '600' }}>
                                                {n.title}
                                            </strong>
                                            <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.5' }}>{n.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
