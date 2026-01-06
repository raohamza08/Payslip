import React, { useState, useEffect } from 'react';
import api from '../api';
import { numberToWords } from '../utils/numToWords';

export default function PayrollGrid({ onNavigate }) {
    const [employees, setEmployees] = useState([]);
    const [gridData, setGridData] = useState({}); // { empId: { earnings: [], deductions: [] } }
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const [view, setView] = useState('grid'); // grid, review, progress
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0, ids: [] });
    const [logs, setLogs] = useState([]);

    const [editingCell, setEditingCell] = useState(null); // { empId, type: 'earnings'|'deductions' }

    // Modal State for Cell Editing
    const [modalData, setModalData] = useState([]); // Array of items

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const emps = await api.getEmployees();
            const activeEmps = emps.filter(e => e.status === 'Active');
            const defs = await api.getPayrollDefaults();

            const data = {};
            activeEmps.forEach(emp => {
                const def = defs[emp.id] || {};
                let earnings = def.earnings ? [...def.earnings] : [];
                if (!earnings.some(e => e.name === 'Basic Salary')) {
                    earnings.unshift({ name: 'Basic Salary', amount: Number(emp.monthly_salary) || 0 });
                }
                let deductions = def.deductions ? [...def.deductions] : [];
                data[emp.id] = { earnings, deductions };
            });

            setEmployees(activeEmps);
            setGridData(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            await api.savePayrollDefaults(gridData);
            alert('Saved successfully!');
        } catch (e) { alert(e.message); }
    };

    const openEdit = (empId, type) => {
        setEditingCell({ empId, type });
        setModalData([...gridData[empId][type]]);
    };

    const saveModal = () => {
        const { empId, type } = editingCell;
        setGridData({
            ...gridData,
            [empId]: {
                ...gridData[empId],
                [type]: modalData
            }
        });
        setEditingCell(null);
    };

    const updateModalItem = (idx, field, val) => {
        const newData = [...modalData];
        newData[idx][field] = field === 'amount' ? Number(val) : val;
        setModalData(newData);
    };

    const addModalItem = () => setModalData([...modalData, { name: '', amount: 0 }]);
    const removeModalItem = (idx) => setModalData(modalData.filter((_, i) => i !== idx));

    const calculateNet = (financials) => {
        const gross = financials.earnings.reduce((s, x) => s + Number(x.amount), 0);
        const totalDed = financials.deductions.reduce((s, x) => s + Number(x.amount), 0);
        return { gross, totalDed, net: gross - totalDed };
    };

    const startGeneration = async () => {
        setView('progress');
        setLogs([]);
        setProgress({ current: 0, total: employees.length, success: 0, failed: 0 });
        const generatedIds = [];

        const [year, mth] = month.split('-');
        const startDate = `${month}-01`;
        const endDate = new Date(year, mth, 0).toISOString().split('T')[0];

        // Save defaults first to ensure persistence
        await api.savePayrollDefaults(gridData);

        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            const financials = gridData[emp.id];
            const { gross, totalDed, net } = calculateNet(financials);

            const payload = {
                pay_period_start: startDate,
                pay_period_end: endDate,
                issue_date: new Date().toISOString().split('T')[0],
                pay_frequency: 'Monthly',
                payment_method: 'Bank Transfer',
                earnings: financials.earnings,
                deductions: financials.deductions,
                gross_pay: gross,
                total_deductions: totalDed,
                net_pay: net,
                net_pay_words: numberToWords(net),
                currency: emp.currency || 'PKR',
                notes: `Salary for ${new Date(year, mth - 1).toLocaleString('default', { month: 'long' })} ${year}`
            };

            try {
                // 1. Generate Payslip
                const result = await api.generatePayslip(payload, emp, true); // Silent = true
                if (result.id) generatedIds.push(result.id);

                // 2. Send Email
                try {
                    await api.sendPayslipEmail(result.id);
                    setLogs(prev => [...prev, { emp: emp.name, status: 'Success', msg: 'Generated & Sent' }]);
                } catch (emailError) {
                    setLogs(prev => [...prev, { emp: emp.name, status: 'Partial', msg: `Generated but Email failed: ${emailError.message}` }]);
                }

                setProgress(p => ({ ...p, current: i + 1, success: p.success + 1, ids: generatedIds }));
            } catch (e) {
                setLogs(prev => [...prev, { emp: emp.name, status: 'Fail', msg: e.message }]);
                setProgress(p => ({ ...p, current: i + 1, failed: p.failed + 1, ids: generatedIds }));
            }
        }
    };

    if (loading) return <div>Loading Payroll Data...</div>;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h1>Payroll Grid</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ padding: 8 }} />
                    <button className="btn btn-secondary" onClick={handleSave}>Save Changes</button>
                    <button className="btn btn-primary" onClick={() => setView('review')}>Create Payslips</button>
                </div>
            </div>

            {view === 'grid' && (
                <div className="table-container" style={{ flex: 1, overflow: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Basic Salary</th>
                                <th>Earnings (Allowances)</th>
                                <th>Deductions</th>
                                <th>Net Pay (Est)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => {
                                const data = gridData[emp.id];
                                const { gross, totalDed, net } = calculateNet(data);
                                // Basic Salary is usually first item
                                const changeBasic = (val) => {
                                    const newData = { ...gridData };
                                    const newEarnings = [...newData[emp.id].earnings];
                                    const idx = newEarnings.findIndex(e => e.name === 'Basic Salary');
                                    if (idx >= 0) newEarnings[idx].amount = Number(val);
                                    else newEarnings.unshift({ name: 'Basic Salary', amount: Number(val) });
                                    newData[emp.id].earnings = newEarnings;
                                    setGridData(newData);
                                };

                                return (
                                    <tr key={emp.id}>
                                        <td>
                                            <strong>{emp.name}</strong><br />
                                            <span style={{ fontSize: 10, color: '#666' }}>{emp.job_title}</span>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={data.earnings.find(e => e.name === 'Basic Salary')?.amount || 0}
                                                onChange={e => changeBasic(e.target.value)}
                                                style={{ width: 100, padding: 5 }}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span>{gross.toLocaleString()}</span>
                                                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(emp.id, 'earnings')}>Edit ({data.earnings.length})</button>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span>{totalDed.toLocaleString()}</span>
                                                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(emp.id, 'deductions')}>Edit ({data.deductions.length})</button>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 'bold', color: '#166534' }}>{net.toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'review' && (
                <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                    <h2>Review Before Generation</h2>
                    <p>Month: {month}</p>
                    <table className="table">
                        <thead><tr><th>Name</th><th>Gross</th><th>Deductions</th><th>Net Pay</th></tr></thead>
                        <tbody>
                            {employees.map(emp => {
                                const { gross, totalDed, net } = calculateNet(gridData[emp.id]);
                                return (
                                    <tr key={emp.id}>
                                        <td>{emp.name}</td>
                                        <td>{gross.toLocaleString()}</td>
                                        <td>{totalDed.toLocaleString()}</td>
                                        <td><strong>{net.toLocaleString()}</strong></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn btn-secondary" onClick={() => setView('grid')}>Back to Edit</button>
                        <button className="btn btn-primary" onClick={startGeneration}>Confirm & Generate All</button>
                    </div>
                </div>
            )}

            {view === 'progress' && (
                <div style={{ padding: 20, textAlign: 'center' }}>
                    <h2>Generating Payslips...</h2>
                    <div style={{ margin: '20px 0', fontSize: 24 }}>
                        {progress.current} / {progress.total}
                    </div>
                    <div style={{ width: '100%', background: '#eee', height: 20, borderRadius: 10 }}>
                        <div style={{ width: `${(progress.current / progress.total) * 100}%`, background: '#17a2b8', height: '100%', borderRadius: 10, transition: 'width 0.3s' }}></div>
                    </div>

                    <div style={{ textAlign: 'left', marginTop: 30, maxHeight: 300, overflow: 'auto', border: '1px solid #ddd', padding: 10 }}>
                        {logs.map((L, i) => {
                            let color = 'red';
                            if (L.status === 'Success') color = 'green';
                            if (L.status === 'Partial') color = 'orange';

                            return (
                                <div key={i} style={{ color }}>
                                    {L.status === 'Success' ? `✓ ${L.emp}: ${L.msg}` :
                                        L.status === 'Partial' ? `⚠ ${L.emp}: ${L.msg}` :
                                            `✗ ${L.emp}: ${L.msg}`}
                                </div>
                            );
                        })}
                    </div>

                    {progress.current === progress.total && (
                        <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button className="btn btn-success" onClick={() => api.downloadBulkPayslips(progress.ids, `Payslips_${month}.zip`)}>
                                📥 Download All (ZIP)
                            </button>
                            <button className="btn btn-primary" onClick={() => onNavigate('history')}>
                                View All Payslips
                            </button>
                            <button className="btn btn-secondary" onClick={() => setView('grid')}>
                                Back to Grid
                            </button>
                        </div>
                    )}
                </div>
            )}

            {editingCell && (
                <div className="modal-overlay">
                    <div className="modal" style={{ minWidth: 500 }}>
                        <h3>Edit {editingCell.type === 'earnings' ? 'Earnings' : 'Deductions'}</h3>
                        {modalData.map((item, i) => (
                            <div key={i} className="flex-row" style={{ marginBottom: 10 }}>
                                <input value={item.name} onChange={e => updateModalItem(i, 'name', e.target.value)} placeholder="Name" style={{ flex: 2, marginRight: 5 }} />
                                <input type="number" value={item.amount} onChange={e => updateModalItem(i, 'amount', e.target.value)} placeholder="Amount" style={{ flex: 1, marginRight: 5 }} />
                                <button className="btn btn-danger" onClick={() => removeModalItem(i)}>X</button>
                            </div>
                        ))}
                        <button className="btn btn-secondary" onClick={addModalItem}>+ Add Item</button>
                        <div className="flex-row flex-end" style={{ marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setEditingCell(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveModal}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
