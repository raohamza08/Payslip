import React, { useState, useEffect } from 'react';

export default function ToastManager() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleToast = (event) => {
            const { message, type = 'info', duration = 3000 } = event.detail;
            const id = Date.now();
            setToasts(prev => [...prev, { id, message, type, duration }]);

            if (duration > 0) {
                setTimeout(() => {
                    removeToast(id);
                }, duration);
            }
        };

        window.addEventListener('show-toast', handleToast);
        return () => window.removeEventListener('show-toast', handleToast);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none' // Allow clicking through container
        }}>
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    style={{
                        pointerEvents: 'auto',
                        minWidth: '250px',
                        maxWidth: '350px',
                        background: getBackgroundColor(toast.type),
                        color: 'white',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        animation: 'slideIn 0.3s ease-out',
                        fontSize: '14px',
                        borderLeft: `5px solid ${getBorderColor(toast.type)}`
                    }}
                >
                    <span style={{ marginRight: '10px' }}>{getIcon(toast.type)}</span>
                    <span style={{ flex: 1 }}>{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            fontSize: '16px',
                            marginLeft: '10px'
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

const getBackgroundColor = (type) => {
    switch (type) {
        case 'success': return '#10b981'; // Green
        case 'error': return '#ef4444';   // Red
        case 'warning': return '#f59e0b'; // Amber
        default: return '#3b82f6';        // Blue
    }
};

const getBorderColor = (type) => {
    switch (type) {
        case 'success': return '#047857';
        case 'error': return '#b91c1c';
        case 'warning': return '#b45309';
        default: return '#1d4ed8';
    }
};

const getIcon = (type) => {
    switch (type) {
        case 'success': return '✓';
        case 'error': return '⚠';
        case 'warning': return '!';
        default: return 'ℹ';
    }
};

// Helper for usage in non-React files or simplified calls
export const showToast = (message, type = 'info') => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
};
