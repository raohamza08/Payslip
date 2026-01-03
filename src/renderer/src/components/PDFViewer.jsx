import React, { useState } from 'react';

export default function PDFViewer({ pdfUrl, onClose }) {
    if (!pdfUrl) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                padding: '20px',
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h2 style={{ margin: 0 }}>Payslip Preview</h2>
                <div>
                    <a
                        href={pdfUrl}
                        download
                        className="btn btn-primary"
                        style={{ marginRight: 10 }}
                    >
                        Download PDF
                    </a>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
            <iframe
                src={`${pdfUrl}?inline=true`}
                style={{
                    flex: 1,
                    border: 'none',
                    width: '100%',
                    height: '100%'
                }}
                title="PDF Preview"
            />
        </div>
    );
}
