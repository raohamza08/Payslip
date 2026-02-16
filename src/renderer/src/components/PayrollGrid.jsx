import React, { useState, useEffect } from 'react';
import api from '../api';
import { SaveIcon, ProcessIcon, EditIcon, CancelIcon, DownloadIcon, ViewIcon, DeleteIcon, AddIcon, RefreshIcon } from './Icons';
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
            if (!Array.isArray(emps)) throw new Error('Could not load employees list');

            const activeEmps = emps.filter(e => e.status === 'Active');
            const defs = await api.getPayrollDefaults() || {};

            // 2. Fetch increments for all employees in parallel
            const incrementsMap = {};
            await Promise.all(activeEmps.map(async (emp) => {
                try {
                    const incs = await api.getIncrements(emp.id);
                    // Filter for current year increments only? Or all? User likely wants recent ones.
                    // Let's filter for current year to keep it relevant to the payslip
                    const currentYear = new Date().getFullYear();
                    incrementsMap[emp.id] = incs.filter(i => new Date(i.date).getFullYear() === currentYear);
                } catch (e) {
                    console.warn(`Failed to fetch increments for ${emp.name}`, e);
                    incrementsMap[emp.id] = [];
                }
            }));

            const data = {};
            activeEmps.forEach(emp => {
                const def = defs[emp.id] || {};
                let earnings = Array.isArray(def.earnings) ? [...def.earnings] : [];

                // Ensure Basic Salary matches employee record (source of truth)
                const basicIndex = earnings.findIndex(e => e.name === 'Basic Salary');
                if (basicIndex >= 0) {
                    earnings[basicIndex] = { ...earnings[basicIndex], amount: Number(emp.monthly_salary) || 0 };
                } else {
                    earnings.unshift({ name: 'Basic Salary', amount: Number(emp.monthly_salary) || 0 });
                }
                let deductions = Array.isArray(def.deductions) ? [...def.deductions] : [];

                data[emp.id] = {
                    earnings,
                    deductions,
                    notes: def.notes || "",
                    increments: incrementsMap[emp.id] || []
                };
            });

            setEmployees(activeEmps);
            setGridData(data);
        } catch (e) {
            console.error(e);
            alert("Error loading payroll data: " + e.message);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            // Don't save increments back to defaults as they are transactional
            const defaultsToSave = {};
            Object.keys(gridData).forEach(id => {
                const { increments, ...rest } = gridData[id];
                defaultsToSave[id] = rest;
            });
            await api.savePayrollDefaults(defaultsToSave);
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
        if (!financials) return { gross: 0, totalDed: 0, net: 0 };
        const earnings = Array.isArray(financials.earnings) ? financials.earnings : [];
        const deductions = Array.isArray(financials.deductions) ? financials.deductions : [];
        const gross = earnings.reduce((s, x) => s + (Number(x.amount) || 0), 0);
        const totalDed = deductions.reduce((s, x) => s + (Number(x.amount) || 0), 0);
        return { gross, totalDed, net: gross - totalDed };
    };


    const getPayload = (emp, financials) => {
        const { gross, totalDed, net } = calculateNet(financials);
        const [year, mth] = month.split('-');
        const startDate = `${month}-01`;
        const endDate = new Date(year, mth, 0).toISOString().split('T')[0];

        return {
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
            notes: financials.notes || `Salary for ${new Date(year, Number(mth) - 1).toLocaleString('default', { month: 'long' })} ${year}`,
            increments: financials.increments || []
        };
    };

    const handlePreview = async (emp) => {
        try {
            const financials = gridData[emp.id];
            const payload = getPayload(emp, financials);
            const url = await api.previewPayslip(payload, emp);
            window.open(url, '_blank');
        } catch (e) {
            alert('Preview failed: ' + e.message);
        }
    };

    const startGeneration = async () => {
        setView('progress');
        setLogs([]);
        setProgress({ current: 0, total: employees.length, success: 0, failed: 0 });
        const generatedIds = [];

        // Save defaults first to ensure persistence
        const defaultsToSave = {};
        Object.keys(gridData).forEach(id => {
            const { increments, ...rest } = gridData[id];
            defaultsToSave[id] = rest;
        });
        await api.savePayrollDefaults(defaultsToSave);

        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            const financials = gridData[emp.id];

            try {
                const payload = getPayload(emp, financials);

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
        <div className="view-container">
            <div className="toolbar">
                <div>
                    <h1>Payroll Grid</h1>
                    <p className="text-light">Configure earnings and deductions for all active employees.</p>
                </div>
                <div className="toolbar-group">
                    <div className="form-group" style={{ margin: 0 }}>
                        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ width: '160px' }} />
                    </div>
                    <button className="btn btn-secondary" onClick={loadData} title="Reload employees and increments">
                        <RefreshIcon /> Refresh
                    </button>
                    <button className="btn btn-secondary" onClick={handleSave}>
                        <SaveIcon /> Save Defaults
                    </button>
                    <button className="btn btn-primary" onClick={() => setView('review')}>
                        <ProcessIcon /> Generate Payslips
                    </button>
                </div>
            </div>

            {view === 'grid' && (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Basic Salary</th>
                                <th className="text-center">Earnings</th>
                                <th className="text-center">Deductions</th>
                                <th>Notes</th>
                                <th className="text-center">Increments</th>
                                <th className="text-right">Net Pay (Est)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => {
                                const data = gridData[emp.id];
                                if (!data) return null;
                                const { gross, totalDed, net } = calculateNet(data);

                                const changeBasic = (val) => {
                                    setGridData(prev => {
                                        const newEarnings = [...(prev[emp.id].earnings || [])];
                                        const idx = newEarnings.findIndex(e => e.name === 'Basic Salary');
                                        if (idx >= 0) {
                                            newEarnings[idx] = { ...newEarnings[idx], amount: Number(val) };
                                        } else {
                                            newEarnings.unshift({ name: 'Basic Salary', amount: Number(val) });
                                        }
                                        return {
                                            ...prev,
                                            [emp.id]: {
                                                ...prev[emp.id],
                                                earnings: newEarnings
                                            }
                                        };
                                    });
                                };

                                const changeNotes = (val) => {
                                    setGridData(prev => ({
                                        ...prev,
                                        [emp.id]: {
                                            ...prev[emp.id],
                                            notes: val
                                        }
                                    }));
                                };

                                return (
                                    <tr key={emp.id}>
                                        <td>
                                            <strong>{emp.name}</strong><br />
                                            <span className="text-sm text-light">{emp.job_title}</span>
                                        </td>
                                        <td style={{ width: '140px' }}>
                                            <input
                                                type="number"
                                                className="table-input"
                                                value={data.earnings.find(e => e.name === 'Basic Salary')?.amount || 0}
                                                onChange={e => changeBasic(e.target.value)}
                                                style={{ padding: '8px' }}
                                            />
                                        </td>
                                        <td className="text-center">
                                            <div className="flex-row flex-center" style={{ gap: '10px' }}>
                                                <span style={{ fontWeight: '700' }}>{gross.toLocaleString()}</span>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp.id, 'earnings')}>
                                                    <EditIcon /> Edit
                                                </button>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="flex-row flex-center" style={{ gap: '10px' }}>
                                                <span style={{ fontWeight: '700', color: 'var(--danger)' }}>{totalDed.toLocaleString()}</span>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp.id, 'deductions')}>
                                                    <EditIcon /> Edit
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <textarea
                                                value={data.notes || ''}
                                                onChange={e => changeNotes(e.target.value)}
                                                placeholder="..."
                                                style={{ minHeight: '60px', padding: '8px', fontSize: '12px' }}
                                            />
                                        </td>
                                        <td className="text-center">
                                            {data.increments && data.increments.length > 0 ? (
                                                <span className="badge success">{data.increments.length} Active</span>
                                            ) : (
                                                <span className="text-light">-</span>
                                            )}
                                        </td>
                                        <td className="text-right" style={{ fontWeight: '800', color: 'var(--success)', fontSize: '1.1rem' }}>
                                            {net.toLocaleString()}
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ marginLeft: '10px', padding: '4px 8px' }}
                                                onClick={() => handlePreview(emp)}
                                                title="Preview Payslip"
                                            >
                                                <ViewIcon />
                                            </button>
                                        </td>
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
                        <thead><tr><th>Name</th><th>Gross</th><th>Deductions</th><th>Notes</th><th>Net Pay</th></tr></thead>
                        <tbody>
                            {employees.map(emp => {
                                const data = gridData[emp.id];
                                const { gross, totalDed, net } = calculateNet(data);
                                return (
                                    <tr key={emp.id}>
                                        <td>{emp.name}</td>
                                        <td>{gross.toLocaleString()}</td>
                                        <td>{totalDed.toLocaleString()}</td>
                                        <td style={{ fontSize: 10, color: '#666' }}>{data.notes}</td>
                                        <td><strong>{net.toLocaleString()}</strong></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn btn-secondary" onClick={() => setView('grid')}>
                            <CancelIcon /> Back to Edit
                        </button>
                        <button className="btn btn-primary" onClick={startGeneration}>
                            <ProcessIcon /> Confirm & Generate All
                        </button>
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
                                    {L.status === 'Success' ? `Success: ${L.emp}: ${L.msg}` :
                                        L.status === 'Partial' ? `Partial: ${L.emp}: ${L.msg}` :
                                            `Failed: ${L.emp}: ${L.msg}`}
                                </div>
                            );
                        })}
                    </div>

                    {progress.current === progress.total && (
                        <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button className="btn btn-success" onClick={() => api.downloadBulkPayslips(progress.ids, `Payslips_${month}.zip`)}>
                                <DownloadIcon /> Download All (ZIP)
                            </button>
                            <button className="btn btn-primary" onClick={() => onNavigate('history')}>
                                <ViewIcon /> View All Payslips
                            </button>
                            <button className="btn btn-secondary" onClick={() => setView('grid')}>
                                <CancelIcon /> Back to Grid
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
                                <button className="btn btn-danger btn-sm" onClick={() => removeModalItem(i)}><DeleteIcon /></button>
                            </div>
                        ))}
                        <button className="btn btn-secondary" onClick={addModalItem}>
                            <AddIcon /> Add Item
                        </button>
                        <div className="flex-row flex-end" style={{ marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setEditingCell(null)}>
                                <CancelIcon /> Cancel
                            </button>
                            <button className="btn btn-primary" onClick={saveModal}>
                                <SaveIcon /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
