import React, { useState, useEffect } from 'react';
import api from '../api';
import PDFViewer from './PDFViewer';
import PasswordConfirm from './PasswordConfirm';
import ConfirmModal from './ConfirmModal';
import { DeleteIcon } from './Icons';

export default function PayslipHistory({ user }) {
    const [payslips, setPayslips] = useState([]);
    const [filteredPayslips, setFilteredPayslips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, show: false });
    const [confirmState, setConfirmState] = useState({ isOpen: false });

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const filtered = payslips.filter(p =>
                p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.issue_date?.includes(searchTerm) ||
                p.pay_period_start?.includes(searchTerm)
            );
            setFilteredPayslips(filtered);
        } else {
            setFilteredPayslips(payslips);
        }
    }, [searchTerm, payslips]);

    const load = async () => {
        try {
            const res = await api.getPayslips();
            setPayslips(res || []);
            setFilteredPayslips(res || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleOpen = async (id) => {
        const payslip = payslips.find(p => p.id === id);
        if (payslip && payslip.pdf_path) {
            const url = `/api/payslips/${payslip.pdf_path}/download?inline=true`;
            setPdfUrl(url);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;

        setConfirmState({
            isOpen: true,
            title: "Delete Payslips",
            danger: true,
            message: `Are you sure you want to permanently delete ${selectedIds.length} selected payslip(s)? This action cannot be undone and will remove files from storage.`,
            onConfirm: async () => {
                setConfirmState({ isOpen: false });
                try {
                    setLoading(true);
                    for (const id of selectedIds) {
                        await api.deletePayslip(id);
                    }
                    alert('Selected payslips deleted successfully');
                    setSelectedIds([]);
                    load();
                } catch (e) {
                    alert('Failed to delete some payslips: ' + e.message);
                } finally {
                    setLoading(false);
                }
            },
            onCancel: () => setConfirmState({ isOpen: false })
        });
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
        if (selectedIds.length === filteredPayslips.length && filteredPayslips.length > 0) {
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
        <div className="view-container">
            <ConfirmModal {...confirmState} />

            <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                <h1 style={{ color: 'var(--text-heading)', margin: 0 }}>Payslip History</h1>
                <div className="flex-row" style={{ gap: '12px' }}>
                    {selectedIds.length > 0 && !bulkProgress.show && (
                        <>
                            <button className="btn btn-danger" onClick={handleDeleteSelected} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <DeleteIcon className="icon-contrast" style={{ width: 18, height: 18 }} />
                                Delete ({selectedIds.length})
                            </button>
                            <button className="btn btn-primary" onClick={handleBulkSend} disabled={loading}>
                                Send Selected ({selectedIds.length})
                            </button>
                        </>
                    )}
                    <input
                        type="text"
                        placeholder="Search by employee name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control"
                        style={{ width: 320, background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--glass-border)' }}
                    />
                </div>
            </div>

            {bulkProgress.show && (
                <div className="card" style={{ marginBottom: 25, padding: '20px 25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <strong style={{ color: 'var(--accent)' }}>Sending Emails...</strong>
                        <span style={{ color: 'var(--text-light)' }}>{bulkProgress.current} / {bulkProgress.total}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: 'var(--accent)',
                            transition: 'width 0.3s ease',
                            width: `${(bulkProgress.current / bulkProgress.total) * 100}%`
                        }}></div>
                    </div>
                </div>
            )}

            <div className="table-container card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: 50, textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={filteredPayslips.length > 0 && selectedIds.length === filteredPayslips.length}
                                    onChange={toggleSelectAll}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                            </th>
                            <th>Date</th>
                            <th>Employee</th>
                            <th>Period</th>
                            <th>Net Pay</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayslips.map(p => (
                            <tr key={p.id}>
                                <td style={{ textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(p.id)}
                                        onChange={() => toggleSelect(p.id)}
                                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                                    />
                                </td>
                                <td style={{ color: 'var(--text-heading)' }}>{p.issue_date}</td>
                                <td style={{ fontWeight: '600', color: 'var(--text-heading)' }}>{p.employee_name}</td>
                                <td style={{ color: 'var(--text-light)' }}>{p.pay_period_start}</td>
                                <td style={{ fontWeight: 'bold', color: 'var(--text-heading)' }}>
                                    {p.currency || 'PKR'} {Number(p.net_pay).toLocaleString()}
                                </td>
                                <td>
                                    <span className="badge" style={{
                                        background: p.email_sent_at ? 'rgba(5, 150, 105, 0.1)' : 'rgba(113, 128, 150, 0.1)',
                                        color: p.email_sent_at ? 'var(--success)' : 'var(--text-light)',
                                        border: `1px solid ${p.email_sent_at ? 'var(--success)' : 'var(--border)'}`,
                                        fontWeight: 'bold'
                                    }}>
                                        {p.email_sent_at ? 'Sent' : 'Draft'}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex-row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                                        <button className="btn btn-secondary" onClick={() => handleOpen(p.id)} style={{ padding: '6px 12px', fontSize: '13px' }}>View PDF</button>
                                        {(user?.role === 'super_admin' || user?.role === 'admin') && (
                                            <button className="btn btn-primary" onClick={() => handleSend(p.id)} disabled={loading} style={{ padding: '6px 12px', fontSize: '13px' }}>
                                                {p.email_sent_at ? 'Resend' : 'Send'}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredPayslips.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-light)', opacity: 0.6 }}>
                                    {searchTerm ? 'No payslips match your search' : 'No payslips found in history'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pdfUrl && <PDFViewer pdfUrl={pdfUrl} onClose={() => setPdfUrl(null)} />}

            {showPasswordConfirm && (
                <PasswordConfirm
                    email={user?.email}
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
