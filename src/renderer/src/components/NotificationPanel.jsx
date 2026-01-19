import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import { CloseIcon, BellIcon } from './Icons';

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

    const handleMarkRead = async (id) => {
        try {
            await api.markNotificationRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (e) { console.error(e); }
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
                style={{
                    background: 'white', border: '1px solid #e5e7eb', borderRadius: '50%',
                    width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#d1d5db'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                title="Notifications"
            >
                <div style={{ transform: 'scale(1.2)' }}>
                    <BellIcon />
                </div>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: 0, right: 0,
                        background: '#ef4444', color: 'white',
                        fontSize: '10px', fontWeight: 'bold',
                        height: '18px', minWidth: '18px', padding: '0 4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '10px', border: '2px solid white',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {showList && createPortal(
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setShowList(false)} />
                    <div style={{
                        position: 'fixed', top: '70px', right: '20px', width: '360px', maxHeight: '80vh',
                        background: 'white', borderRadius: '16px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
                        zIndex: 99999, overflow: 'hidden', display: 'flex', flexDirection: 'column',
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
                                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
                                    <div style={{ opacity: 0.5, marginBottom: '15px' }}>
                                        <BellIcon className="w-8 h-8" />
                                    </div>
                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '500', color: '#374151' }}>No notifications</p>
                                    <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#9ca3af' }}>We'll let you know when something arrives.</p>
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
                            )
                            }
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
