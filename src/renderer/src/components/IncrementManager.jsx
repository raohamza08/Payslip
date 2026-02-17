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
            <h3>Salary Management: {employee.name}</h3>

            <div className="card" style={{ background: '#f8f9fa', marginBottom: '20px' }}>
                <h4>Add Increment</h4>
                <form onSubmit={handleAdd}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Percentage (%)</label>
                            <input type="number" step="0.1" value={newIncrement.percentage} onChange={e => handlePercentageChange(e.target.value)} className="form-control" />
                        </div>
                        <div className="form-group">
                            <label>New Monthly Salary</label>
                            <input type="number" value={newIncrement.new_salary} onChange={e => handleNewSalaryChange(e.target.value)} className="form-control" />
                        </div>
                        <div className="form-group">
                            <label>Effective Date</label>
                            <input type="date" value={newIncrement.effective_date} onChange={e => setNewIncrement({ ...newIncrement, effective_date: e.target.value })} className="form-control" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Reason</label>
                        <input value={newIncrement.reason} onChange={e => setNewIncrement({ ...newIncrement, reason: e.target.value })} className="form-control" placeholder="e.g. Annual Appraisal" />
                    </div>

                    <div style={{ margin: '10px 0', padding: '10px', background: '#e0f2f1', borderRadius: '4px' }}>
                        <strong>Preview:</strong>
                        Current: {currentSalary.toLocaleString()} →
                        <span style={{ color: 'green', fontWeight: 'bold' }}> New: {Number(newIncrement.new_salary).toLocaleString()} </span>
                        ({newIncrement.percentage}% increase)
                    </div>

                    <button className="btn btn-primary" type="submit">
                        <AddIcon /> Apply Increment
                    </button>
                </form>
            </div>

            <h4>Increment History</h4>
            <table className="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Old Salary</th>
                        <th>%</th>
                        <th>New Salary</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {increments.map(inc => (
                        <tr key={inc.id || inc._id}>
                            <td>{inc.effective_date}</td>
                            <td>{Number(inc.old_salary || 0).toLocaleString()}</td>
                            <td>
                                {inc.increment_percentage ? (
                                    <span className="badge badge-success">+{inc.increment_percentage}%</span>
                                ) : (
                                    <span style={{ color: 'green' }}>+{Number(inc.amount || 0).toLocaleString()}</span>
                                )}
                            </td>
                            <td style={{ fontWeight: 'bold' }}>{Number(inc.new_salary || (inc.old_salary + inc.amount) || 0).toLocaleString()}</td>
                            <td>{inc.description || inc.reason || '-'}</td>
                        </tr>
                    ))}
                    {increments.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No history found.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}
