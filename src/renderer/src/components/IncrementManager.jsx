import React, { useState, useEffect } from 'react';
import api from '../api';
import { AddIcon } from './Icons';

export default function IncrementManager({ employee, onClose, onUpdate }) {
    const [increments, setIncrements] = useState([]);
    const currentSalary = Number(employee.monthly_salary) || 0;
    const [newIncrement, setNewIncrement] = useState({
        percentage: 10,
        new_salary: Math.round(currentSalary * 1.1),
        reason: '',
        effective_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => { if (employee?.id) loadIncrements(); }, [employee]);

    const loadIncrements = async () => {
        try {
            const data = await api.getIncrements(employee.id);
            setIncrements(data || []);
        } catch (e) { console.error(e); }
    };

    const handlePercentageChange = (val) => {
        const perc = Number(val);
        const newSal = Math.round(currentSalary * (1 + perc / 100));
        setNewIncrement({ ...newIncrement, percentage: val, new_salary: newSal });
    };

    const handleNewSalaryChange = (val) => {
        const newSal = Number(val);
        const perc = currentSalary > 0 ? ((newSal - currentSalary) / currentSalary) * 100 : 0;
        setNewIncrement({ ...newIncrement, new_salary: val, percentage: perc.toFixed(2) });
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const perc = Number(newIncrement.percentage);
        const finalSalary = Number(newIncrement.new_salary);
        const incAmount = finalSalary - currentSalary;

        if (!confirm(`Are you sure you want to update salary to ${finalSalary.toLocaleString()} (${perc}% increase)? This will update the employee's base salary.`)) return;

        try {
            // Backend will automatically update the employee's monthly_salary
            await api.addIncrement(employee.id, {
                increment_percentage: perc,
                effective_date: newIncrement.effective_date,
                reason: newIncrement.reason,
                old_salary: currentSalary,
                increment_amount: incAmount,
                new_salary: finalSalary
            });

            alert(`Increment Applied! New Base Salary: ${finalSalary.toLocaleString()}`);
            setNewIncrement({
                percentage: 10,
                new_salary: Math.round(currentSalary * 1.1),
                reason: '',
                effective_date: new Date().toISOString().split('T')[0]
            });
            loadIncrements();

            // Notify parent component to update local state
            if (onUpdate) {
                onUpdate({ monthly_salary: finalSalary });
            }

            if (onClose) onClose();
        } catch (e) { alert(e.message); }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--text-heading)', marginBottom: '20px' }}>Salary Management: {employee.name}</h3>

            <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ color: 'var(--text-heading)', marginBottom: '20px' }}>Add Increment</h4>
                <form onSubmit={handleAdd}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label style={{ color: 'var(--text-light)' }}>Percentage (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={newIncrement.percentage}
                                onChange={e => handlePercentageChange(e.target.value)}
                                className="form-control"
                                style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ color: 'var(--text-light)' }}>New Monthly Salary</label>
                            <input
                                type="number"
                                value={newIncrement.new_salary}
                                onChange={e => handleNewSalaryChange(e.target.value)}
                                className="form-control"
                                style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ color: 'var(--text-light)' }}>Effective Date</label>
                            <input
                                type="date"
                                value={newIncrement.effective_date}
                                onChange={e => setNewIncrement({ ...newIncrement, effective_date: e.target.value })}
                                className="form-control"
                                style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ color: 'var(--text-light)' }}>Reason</label>
                        <input
                            value={newIncrement.reason}
                            onChange={e => setNewIncrement({ ...newIncrement, reason: e.target.value })}
                            className="form-control"
                            placeholder="e.g. Annual Appraisal"
                            style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div style={{
                        margin: '20px 0',
                        padding: '15px',
                        background: 'var(--item-hover)',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <div style={{ fontSize: '1.2rem', opacity: 0.8 }}>💰</div>
                        <div>
                            <strong style={{ color: 'var(--text-heading)' }}>Preview: </strong>
                            <span style={{ color: 'var(--text-light)' }}>{currentSalary.toLocaleString()}</span>
                            <span style={{ margin: '0 10px', color: 'var(--accent)' }}>→</span>
                            <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.1rem' }}> {Number(newIncrement.new_salary).toLocaleString()} </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginLeft: '10px' }}>
                                ({newIncrement.percentage}% increase)
                            </span>
                        </div>
                    </div>

                    <button className="btn btn-primary" type="submit" style={{ width: 'auto', padding: '12px 30px' }}>
                        <AddIcon className="icon-contrast" /> Apply Increment
                    </button>
                </form>
            </div>

            <h4 style={{ color: 'var(--text-heading)', margin: '30px 0 15px' }}>Increment History</h4>
            <div className="table-container" style={{ background: 'transparent', padding: 0 }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ color: 'var(--text-light)', borderBottom: '2px solid var(--border)' }}>Date</th>
                            <th style={{ color: 'var(--text-light)', borderBottom: '2px solid var(--border)' }}>Old Salary</th>
                            <th style={{ color: 'var(--text-light)', borderBottom: '2px solid var(--border)' }}>%</th>
                            <th style={{ color: 'var(--text-light)', borderBottom: '2px solid var(--border)' }}>New Salary</th>
                            <th style={{ color: 'var(--text-light)', borderBottom: '2px solid var(--border)' }}>Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {increments.map(inc => (
                            <tr key={inc.id || inc._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ color: 'var(--text)' }}>{inc.effective_date}</td>
                                <td style={{ color: 'var(--text)' }}>{Number(inc.old_salary || 0).toLocaleString()}</td>
                                <td>
                                    {inc.increment_percentage ? (
                                        <span className="badge badge-success" style={{ background: 'rgba(110, 231, 183, 0.1)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                                            +{inc.increment_percentage}%
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--success)' }}>+{Number(inc.amount || 0).toLocaleString()}</span>
                                    )}
                                </td>
                                <td style={{ fontWeight: 'bold', color: 'var(--text-heading)' }}>{Number(inc.new_salary || (inc.old_salary + inc.amount) || 0).toLocaleString()}</td>
                                <td style={{ color: 'var(--text-light)' }}>{inc.description || inc.reason || '-'}</td>
                            </tr>
                        ))}
                        {increments.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)', opacity: 0.6 }}>
                                    No increment history found for this employee.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
