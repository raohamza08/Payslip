import React from 'react';
import ReactDOM from 'react-dom';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", danger = false }) => {
    if (!isOpen) return null;

    const modalContent = (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999, /* High Z-index to stand above everything */
            animation: 'fadeIn 0.3s ease'
        }}>
            <div className="card" style={{
                width: '100%',
                maxHeight: '90vh',
                maxWidth: '450px',
                background: 'var(--bg-top)',
                border: '1px solid var(--glass-border)',
                borderRadius: '28px',
                padding: '40px',
                textAlign: 'center',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                transform: 'translateY(0)',
                animation: 'modalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{
                    fontSize: '3.5rem',
                    marginBottom: '25px',
                    background: danger ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent-glow)',
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 25px',
                    color: danger ? '#EF4444' : 'var(--accent)',
                    border: `1px solid ${danger ? '#EF4444' : 'var(--accent)'}`
                }}>

                </div>
                <h2 style={{ marginBottom: '15px', color: 'var(--text-heading)', fontWeight: '700' }}>{title}</h2>
                <p style={{ color: 'var(--text-light)', lineHeight: '1.7', marginBottom: '35px', fontSize: '1.05rem' }}>{message}</p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1, padding: '14px', borderRadius: '15px', fontWeight: '600' }}>
                        {cancelText}
                    </button>
                    <button className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={onConfirm} style={{ flex: 1, padding: '14px', borderRadius: '15px', fontWeight: '600' }}>
                        {confirmText}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalSlideUp { 
                    from { transform: translateY(60px) scale(0.92); opacity: 0; } 
                    to { transform: translateY(0) scale(1); opacity: 1; } 
                }
            `}</style>
        </div>
    );

    // Using Portal to make the modal render at the end of body, 
    // ensuring it covers the whole screen regardless of parent styles.
    return ReactDOM.createPortal(modalContent, document.body);
};

export default ConfirmModal;
