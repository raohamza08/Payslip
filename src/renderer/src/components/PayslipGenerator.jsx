import React, { useState, useEffect } from 'react';
import { numberToWords as numToWords } from '../utils/numToWords';
import PasswordConfirm from './PasswordConfirm';
import api from '../api';

export default function PayslipGenerator({ onComplete, user }) {
    const [employees, setEmployees] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, leave: 0, total: 0 });

    const [data, setData] = useState({
        issue_date: new Date().toISOString().split('T')[0],
        pay_period_start: '',
        pay_period_end: '',
        pay_frequency: 'Monthly',
        payment_method: '',
        transaction_ref: '',
        notes: ''
    });

    const [earnings, setEarnings] = useState([{ name: 'Basic Salary', amount: 0 }]);
    const [deductions, setDeductions] = useState([{ name: 'Tax', amount: 0 }]);

    useEffect(() => {
        api.getEmployees().then(res => setEmployees(res.filter(e => e.status === 'Active')));
    }, []);

    useEffect(() => {
        if (selectedEmp && data.pay_period_start && data.pay_period_end) {
            calculateAttendance();
        }
    }, [selectedEmp, data.pay_period_start, data.pay_period_end]);

    // Pro-rating & Salary Auto-fill
    useEffect(() => {
        if (selectedEmp && data.pay_period_start) {
            const emp = employees.find(e => e.id === selectedEmp);
            if (emp) {
                // Default Base
                let salary = Number(emp.monthly_salary) || 0;
                let autoNote = '';

                // Pro-rating Logic
                if (emp.joining_date) {
                    const joinDate = new Date(emp.joining_date);
                    const pStart = new Date(data.pay_period_start);

                    // Check if Joined in this Month
                    if (joinDate.getMonth() === pStart.getMonth() && joinDate.getFullYear() === pStart.getFullYear()) {
                        const daysInMonth = new Date(pStart.getFullYear(), pStart.getMonth() + 1, 0).getDate();
                        const joinDay = joinDate.getDate();
                        // Only if joined after 1st
                        if (joinDay > 1) {
                            const workedDays = daysInMonth - (joinDay - 1);
                            salary = Math.round((salary / daysInMonth) * workedDays);
                            autoNote = `[Pro-rated: Joined ${emp.joining_date}, ${workedDays}/${daysInMonth} days]`;
                        }
                    }
                }

                // Update Basic Salary
                setEarnings(prev => {
                    const next = [...prev];
                    const idx = next.findIndex(item => item.name === 'Basic Salary');
                    if (idx > -1) next[idx].amount = salary;
                    else next.unshift({ name: 'Basic Salary', amount: salary });
                    return next;
                });

                if (autoNote) setData(d => ({ ...d, notes: autoNote }));
            }
        }
    }, [selectedEmp, data.pay_period_start, employees]);

    const calculateAttendance = async () => {
        try {
            // Get all attendance for this employee
            const allAtt = await api.getAttendance(); // We should probably have a filter by employee and range in API
            const filtered = allAtt.filter(a =>
                a.employee_id === selectedEmp &&
                a.date >= data.pay_period_start &&
                a.date <= data.pay_period_end
            );

            const stats = {
                present: filtered.filter(a => a.status === 'Present').length,
                absent: filtered.filter(a => a.status === 'Absent').length,
                leave: filtered.filter(a => a.status === 'Leave').length,
                total: filtered.length
            };
            setAttendanceStats(stats);
        } catch (e) {
            console.error(e);
        }
    };

    const addLine = (setter, list) => {
        setter([...list, { name: '', amount: 0 }]);
    };

    const updateLine = (setter, list, index, field, value) => {
        const newList = [...list];
        newList[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
        setter(newList);
    };

    const removeLine = (setter, list, index) => {
        setter(list.filter((_, i) => i !== index));
    };

    const gross = earnings.reduce((sum, item) => sum + item.amount, 0);
    const totalDeduct = deductions.reduce((sum, item) => sum + item.amount, 0);
    const net = gross - totalDeduct;

    const handleGenerate = async () => {
        if (!selectedEmp) return alert('Select an Employee');
        setShowConfirm(true);
    };

    const confirmGenerate = async () => {
        const emp = employees.find(e => e.id === selectedEmp);
        const payload = {
            employee: emp,
            ...data,
            earnings,
            deductions,
            gross_pay: gross,
            total_deductions: totalDeduct,
            net_pay: net,
            net_pay_words: numToWords(net),
            currency: emp.currency,
            attendance: attendanceStats // Include attendance in payload
        };

        try {
            await api.generatePayslip(payload, emp);
            alert('Payslip Generated Successfully!');
            if (onComplete) onComplete();
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            setShowConfirm(false);
        }
    };

    return (
        <div>
            <h1>Generate Payslip</h1>

            <div className="card">
                <div className="grid-2">
                    <div className="form-group">
                        <label>Select Employee</label>
                        <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}>
                            <option value="">-- Choose Employee --</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.job_title})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Issue Date</label>
                        <input type="date" value={data.issue_date} onChange={e => setData({ ...data, issue_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Period Start</label>
                        <input type="date" value={data.pay_period_start} onChange={e => setData({ ...data, pay_period_start: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Period End</label>
                        <input type="date" value={data.pay_period_end} onChange={e => setData({ ...data, pay_period_end: e.target.value })} />
                    </div>
                </div>

                {selectedEmp && (
                    <div style={{ padding: '15px', background: '#e0f2fe', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                        <strong> Attendance Summary for Period:</strong>
                        <div className="flex-row" style={{ marginTop: '5px', gap: '20px' }}>
                            <span>Total Days Marked: <strong>{attendanceStats.total}</strong></span>
                            <span>Present: <strong style={{ color: 'green' }}>{attendanceStats.present}</strong></span>
                            <span>Absent: <strong style={{ color: 'red' }}>{attendanceStats.absent}</strong></span>
                            <span>Leaves: <strong style={{ color: 'orange' }}>{attendanceStats.leave}</strong></span>
                        </div>
                    </div>
                )}

                <div className="grid-2" style={{ marginTop: 20 }}>
                    {/* Earnings */}
                    <div>
                        <h3>Earnings</h3>
                        {earnings.map((item, i) => (
                            <div key={i} className="flex-row" style={{ marginBottom: 10 }}>
                                <input placeholder="Item Name" value={item.name} onChange={e => updateLine(setEarnings, earnings, i, 'name', e.target.value)} />
                                <input type="number" placeholder="Amount" value={item.amount} onChange={e => updateLine(setEarnings, earnings, i, 'amount', e.target.value)} />
                                <button className="btn btn-danger" onClick={() => removeLine(setEarnings, earnings, i)}>X</button>
                            </div>
                        ))}
                        <button className="btn btn-secondary" onClick={() => addLine(setEarnings, earnings)}>+ Add Earning</button>
                    </div>

                    {/* Deductions */}
                    <div>
                        <h3>Deductions</h3>
                        {deductions.map((item, i) => (
                            <div key={i} className="flex-row" style={{ marginBottom: 10 }}>
                                <input placeholder="Item Name" value={item.name} onChange={e => updateLine(setDeductions, deductions, i, 'name', e.target.value)} />
                                <input type="number" placeholder="Amount" value={item.amount} onChange={e => updateLine(setDeductions, deductions, i, 'amount', e.target.value)} />
                                <button className="btn btn-danger" onClick={() => removeLine(setDeductions, deductions, i)}>X</button>
                            </div>
                        ))}
                        <button className="btn btn-secondary" onClick={() => addLine(setDeductions, deductions)}>+ Add Deduction</button>
                    </div>
                </div>

                <div style={{ marginTop: 30, padding: 20, background: '#f8fafc', borderRadius: 8 }}>
                    <div className="flex-row" style={{ justifyContent: 'space-between' }}>
                        <span>Total Earnings: <strong>{gross.toFixed(2)}</strong></span>
                        <span>Total Deductions: <strong>{totalDeduct.toFixed(2)}</strong></span>
                        <span style={{ fontSize: '1.2rem' }}>Net Pay: <strong>{net.toFixed(2)}</strong></span>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: 20 }}>
                    <label>Notes / Remarks</label>
                    <input value={data.notes} onChange={e => setData({ ...data, notes: e.target.value })} />
                </div>

                <button className="btn btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={handleGenerate}>
                    Generate & Save PDF
                </button>
            </div>

            {showConfirm && (
                <PasswordConfirm
                    email={user?.email}
                    onConfirm={confirmGenerate}
                    onCancel={() => setShowConfirm(false)}
                    title="Confirm Generation"
                    message="Please enter password to generate this payslip."
                />
            )}
        </div>
    );
}
