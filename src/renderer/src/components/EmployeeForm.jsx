import React, { useState } from 'react';
import api from '../api';

export default function EmployeeForm({ employee, onSave, onCancel }) {
    const [form, setForm] = useState(employee || {
        name: '', email: '', employee_id: '', job_title: '', department: '',
        employment_type: 'Full Time', bank_name: '', account_number: '',
        currency: 'USD', status: 'Active'
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.saveEmployee(form);
            onSave();
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div>
            <h1>{form.id ? 'Edit Employee' : 'New Employee'}</h1>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input name="name" value={form.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Employee ID</label>
                            <input name="employee_id" value={form.employee_id || ''} onChange={handleChange} placeholder="e.g., EH0001" required />
                        </div>
                        <div className="form-group">
                            <label>Job Title</label>
                            <input name="job_title" value={form.job_title} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Department</label>
                            <input name="department" value={form.department} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Employment Type</label>
                            <select name="employment_type" value={form.employment_type} onChange={handleChange}>
                                <option>Full Time</option>
                                <option>Part Time</option>
                                <option>Contract</option>
                                <option>Intern</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select name="status" value={form.status} onChange={handleChange}>
                                <option>Active</option>
                                <option>Inactive</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Bank Name</label>
                            <input name="bank_name" value={form.bank_name} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Account Number</label>
                            <input name="account_number" value={form.account_number} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Currency</label>
                            <select name="currency" value={form.currency} onChange={handleChange}>
                                <option>PKR</option>
                                <option>EUR</option>
                                <option>GBP</option>
                                <option>USD</option>
                                <option>INR</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-row flex-end" style={{ marginTop: 20 }}>
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Employee</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
