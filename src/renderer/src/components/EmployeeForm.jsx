import React, { useState } from 'react';
import api from '../api';
import IncrementManager from './IncrementManager';
import DocumentManager from './DocumentManager';
import { SaveIcon, CancelIcon } from './Icons';

export default function EmployeeForm({ employee, onSave, onCancel }) {
    const [activeTab, setActiveTab] = useState('personal');
    const [form, setForm] = useState({
        // Defaults
        name: '', email: '', employee_id: '', job_title: '', department: '',
        employment_type: 'Full Time', bank_name: '', account_number: '',
        currency: 'PKR', status: 'Active', monthly_salary: 0,
        joining_date: '', leaving_date: '', probation_end_date: '',
        father_name: '', religion: '', cnic: '', dob: '', blood_group: '',
        contact_number: '', home_contact: '', personal_email: '',
        present_address: '', permanent_address: '',
        office_number: '', shift_start: '', shift_end: '', gender: '',
        shift_type: 'Morning',
        // Merge existing
        ...employee
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const savedId = await api.saveEmployee(form);
            if (!form.id && savedId) {
                setForm(prev => ({ ...prev, id: savedId }));
            }
            window.alert('Employee data updated successfully!');
        } catch (e) { alert(e.message); }
    };

    const TabButton = ({ id, label }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            style={{
                background: 'none', border: 'none', padding: '12px 24px', cursor: 'pointer',
                borderBottom: activeTab === id ? '3px solid var(--accent)' : '3px solid transparent',
                fontWeight: activeTab === id ? '700' : '500',
                color: activeTab === id ? 'var(--text-heading)' : 'var(--text-light)',
                whiteSpace: 'nowrap',
                transition: 'var(--transition)',
                opacity: activeTab === id ? 1 : 0.7
            }}>
            {label}
        </button>
    );

    return (
        <div className="view-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onCancel}
                    style={{ padding: '8px 12px', minWidth: 'auto', borderRadius: '10px' }}
                >
                    ← Back
                </button>
                <h1 style={{ color: 'var(--text-heading)', margin: 0 }}>{form.id ? 'Edit Employee' : 'New Employee'}</h1>
            </div>

            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border)',
                overflowX: 'auto',
                paddingBottom: '2px'
            }}>
                <TabButton id="personal" label="Personal Info" />
                <TabButton id="contact" label="Contact Details" />
                <TabButton id="official" label="Employment & Official" />
                <TabButton id="financial" label="Bank & Salary" />
                {form.id && <TabButton id="documents" label="Documents" />}
                {form.id && <TabButton id="increments" label="Increments History" />}
            </div>

            <div className="card" style={{ border: '1px solid var(--glass-border)' }}>
                {activeTab === 'increments' ? (
                    <IncrementManager
                        employee={form}
                        onClose={() => { }}
                        onUpdate={(updates) => setForm(prev => ({ ...prev, ...updates }))}
                    />
                ) : activeTab === 'documents' ? (
                    <DocumentManager
                        employee={form}
                        onClose={() => setActiveTab('personal')}
                        isEmbedded={true}
                    />
                ) : (
                    <form onSubmit={handleSubmit} style={{ padding: '10px' }}>
                        {/* PERSONAL TAB */}
                        {activeTab === 'personal' && (
                            <div className="grid-2">
                                <div className="form-group"><label>Full Name *</label><input className="form-control" name="name" value={form.name} onChange={handleChange} required style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Father Name</label><input className="form-control" name="father_name" value={form.father_name || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>CNIC</label><input className="form-control" name="cnic" value={form.cnic || ''} onChange={handleChange} placeholder="00000-0000000-0" style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Date of Birth</label><input className="form-control" type="date" name="dob" value={form.dob || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Religion</label><input className="form-control" name="religion" value={form.religion || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Blood Group</label><select className="form-control" name="blood_group" value={form.blood_group || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }}><option value="">Select</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option></select></div>
                                <div className="form-group"><label>Gender</label><select className="form-control" name="gender" value={form.gender || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                            </div>
                        )}

                        {/* CONTACT TAB */}
                        {activeTab === 'contact' && (
                            <div className="grid-2">
                                <div className="form-group"><label>Work Email * (Login ID)</label><input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Personal Email</label><input className="form-control" type="email" name="personal_email" value={form.personal_email || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Mobile Number</label><input className="form-control" name="contact_number" value={form.contact_number || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Home / Emergency Contact</label><input className="form-control" name="home_contact" value={form.home_contact || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Present Address</label><input className="form-control" name="present_address" value={form.present_address || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Permanent Address</label><input className="form-control" name="permanent_address" value={form.permanent_address || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                            </div>
                        )}

                        {/* OFFICIAL TAB */}
                        {activeTab === 'official' && (
                            <div className="grid-2">
                                <div className="form-group"><label>Employee ID *</label><input className="form-control" name="employee_id" value={form.employee_id} onChange={handleChange} required style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Designation (Job Title)</label><input className="form-control" name="job_title" value={form.job_title || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Department</label><input className="form-control" name="department" value={form.department || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Office Number / Ext</label><input className="form-control" name="office_number" value={form.office_number || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>

                                <div className="form-group"><label>Employment Type</label><select className="form-control" name="employment_type" value={form.employment_type} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }}><option>Full Time</option><option>Part Time</option><option>Contract</option><option>Intern</option></select></div>
                                <div className="form-group"><label>Status</label><select className="form-control" name="status" value={form.status} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }}><option>Active</option><option>Inactive</option><option>Resigned</option><option>Terminated</option></select></div>

                                <div className="form-group"><label>Joining Date</label><input className="form-control" type="date" name="joining_date" value={form.joining_date || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Probation End</label><input className="form-control" type="date" name="probation_end_date" value={form.probation_end_date || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Leaving / End Date</label><input className="form-control" type="date" name="leaving_date" value={form.leaving_date || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>

                                <div className="form-group"><label>Shift Start Time</label><input className="form-control" type="time" name="shift_start" value={form.shift_start || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Shift End Time</label><input className="form-control" type="time" name="shift_end" value={form.shift_end || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>

                                <div className="form-group">
                                    <label>Work Shift</label>
                                    <select className="form-control" name="shift_type" value={form.shift_type || 'Morning'} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }}>
                                        <option>Morning (8AM - 4PM)</option>
                                        <option>Evening (4PM - 12AM)</option>
                                        <option>Night (12AM - 8AM)</option>
                                        <option>Custom</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* FINANCIAL TAB */}
                        {activeTab === 'financial' && (
                            <div className="grid-2">
                                <div className="form-group"><label>Base Monthly Salary</label><input className="form-control" type="number" name="monthly_salary" value={form.monthly_salary} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Currency</label><select className="form-control" name="currency" value={form.currency} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }}><option>PKR</option><option>USD</option><option>EUR</option><option>GBP</option><option>INR</option></select></div>
                                <div className="form-group"><label>Bank Name</label><input className="form-control" name="bank_name" value={form.bank_name || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                                <div className="form-group"><label>Account Number</label><input className="form-control" name="account_number" value={form.account_number || ''} onChange={handleChange} style={{ background: 'var(--glass-bg)', color: 'var(--text-heading)', border: '1px solid var(--border)' }} /></div>
                            </div>
                        )}

                        <div className="flex-row flex-end" style={{ marginTop: 20, gap: '15px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '25px' }}>
                            <button type="button" className="btn btn-secondary" onClick={onCancel}>
                                <CancelIcon className="icon-contrast" /> Discard / Back
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ minWidth: '160px' }}>
                                <SaveIcon className="icon-contrast" /> Save Employee
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
