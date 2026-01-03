import React, { useState, useEffect } from 'react';
import api from '../api';
import PDFViewer from './PDFViewer';
import PasswordConfirm from './PasswordConfirm';

export default function PayslipHistory() {
    const [payslips, setPayslips] = useState([]);
    const [filteredPayslips, setFilteredPayslips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, show: false });

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        // Filter payslips based on search term
        if (searchTerm) {
            const filtered = payslips.filter(p =>
                p.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.issue_date.includes(searchTerm) ||
                p.pay_period_start.includes(searchTerm)
            );
            setFilteredPayslips(filtered);
        } else {
            setFilteredPayslips(payslips);
        }
    }, [searchTerm, payslips]);

    const load = async () => {
        const res = await api.getPayslips();
        setPayslips(res);
        setFilteredPayslips(res);
    };

    const handleOpen = async (id) => {
        const payslip = payslips.find(p => p.id === id);
        if (payslip && payslip.pdf_path) {
            const url = `/api/payslips/${payslip.pdf_path}/download`;
            setPdfUrl(url);
        }
    };

    const requestAction = (action) => {
        setPendingAction(() => action);
        setShowPasswordConfirm(true);
    };

    const handleSend = async (id) => {
        requestAction(async () => {
            try {
                setLoading(true);
                await api.sendPayslipEmail(id);
                alert('Email Sent Successfully!');
                load();
            } catch (e) {
                alert('Failed to send email: ' + e.message);
            } finally {
                setLoading(false);
            }
        });
    };

    const handleBulkSend = async () => {
        if (selectedIds.length === 0) return alert('Select at least one payslip');

        requestAction(async () => {
            try {
                setLoading(true);
                setBulkProgress({ current: 0, total: selectedIds.length, show: true });
                let successCount = 0;
                for (let i = 0; i < selectedIds.length; i++) {
                    const id = selectedIds[i];
                    try {
                        await api.sendPayslipEmail(id);
                        successCount++;
                    } catch (e) {
                        console.error(`Failed to send ${id}`, e);
                    }
                    setBulkProgress(prev => ({ ...prev, current: i + 1 }));
                }
                alert(`Successfully sent ${successCount} of ${selectedIds.length} emails`);
                setSelectedIds([]);
                load();
            } catch (e) {
                alert('Bulk send error: ' + e.message);
            } finally {
                setLoading(false);
                setBulkProgress({ current: 0, total: 0, show: false });
            }
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredPayslips.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredPayslips.map(p => p.id));
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    return (
        <div>
            <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1>Payslip History</h1>
                <div className="flex-row">
                    {selectedIds.length > 0 && !bulkProgress.show && (
                        <button className="btn btn-primary" onClick={handleBulkSend} disabled={loading}>
                            Send Selected ({selectedIds.length})
                        </button>
                    )}
                    <input
                        type="text"
                        placeholder="Search by employee name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 300, padding: '8px 12px' }}
                    />
                </div>
            </div>

            {bulkProgress.show && (
                <div className="card" style={{ marginBottom: 20, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <strong style={{ color: 'var(--accent)' }}>Sending Emails...</strong>
                        <span>{bulkProgress.current} / {bulkProgress.total}</span>
                    </div>
                    <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: 'var(--accent)',
                            transition: 'width 0.3s ease',
                            width: `${(bulkProgress.current / bulkProgress.total) * 100}%`
                        }}></div>
                    </div>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length > 0 && selectedIds.length === filteredPayslips.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th>Date</th>
                            <th>Employee</th>
                            <th>Period</th>
                            <th>Net Pay</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayslips.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(p.id)}
                                        onChange={() => toggleSelect(p.id)}
                                    />
                                </td>
                                <td>{p.issue_date}</td>
                                <td>{p.employee_name}</td>
                                <td>{p.pay_period_start}</td>
                                <td>{p.net_pay.toFixed(2)}</td>
                                <td>{p.email_sent_at ? '✅ Sent' : 'Draft'}</td>
                                <td className="flex-row">
                                    <button className="btn btn-secondary" onClick={() => handleOpen(p.id)}>View PDF</button>
                                    <button className="btn btn-primary" onClick={() => handleSend(p.id)} disabled={loading}>
                                        {p.email_sent_at ? 'Resend' : 'Email'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredPayslips.length === 0 && (
                            <tr><td colSpan="7" style={{ textAlign: 'center' }}>
                                {searchTerm ? 'No payslips match your search' : 'No payslips found'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pdfUrl && <PDFViewer pdfUrl={pdfUrl} onClose={() => setPdfUrl(null)} />}

            {showPasswordConfirm && (
                <PasswordConfirm
                    onConfirm={() => {
                        setShowPasswordConfirm(false);
                        if (pendingAction) pendingAction();
                    }}
                    onCancel={() => setShowPasswordConfirm(false)}
                    title="Confirm Email Action"
                    message="Please enter password to authorize sending email(s)."
                />
            )}
        </div>
    );
}
