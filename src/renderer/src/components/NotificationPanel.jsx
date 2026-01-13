import React, { useState, useEffect } from 'react';
import api from '../api';

export default function NotificationPanel() {
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
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setShowList(!showList)}
                style={{
                    background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', position: 'relative',
                    padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '0', right: '0', background: '#e11d48', color: 'white',
                        fontSize: '10px', padding: '2px 5px', borderRadius: '10px', minWidth: '15px'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {showList && (
                <div style={{
                    position: 'absolute', top: '40px', right: '0', width: '320px', maxHeight: '450px',
                    background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    zIndex: 1000, overflowY: 'auto', border: '1px solid #eee'
                }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0 }}>Notifications</h4>
                        <button onClick={() => setShowList(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>✕</button>
                    </div>

                    <div style={{ padding: '5px' }}>
                        {notifications.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#888', padding: '30px 0', fontSize: '13px' }}>No new notifications</p>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleMarkRead(n.id)}
                                    style={{
                                        padding: '12px 15px', borderBottom: '1px solid #f9f9f9', cursor: 'pointer',
                                        background: n.is_read ? 'white' : '#f0f9ff', borderRadius: '8px', margin: '2px 0',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <strong style={{ fontSize: '13px', color: '#1f2937' }}>{n.title}</strong>
                                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', lineHeight: '1.4' }}>{n.message}</p>
                                    {!n.is_read && (
                                        <div style={{ textAlign: 'right', marginTop: '5px' }}>
                                            <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 'bold' }}>Mark as read</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
