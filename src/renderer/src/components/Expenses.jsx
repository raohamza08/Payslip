import React, { useState, useEffect } from 'react';
import api from '../api';
import { exportToCSV } from '../utils/exportToCSV';

const categories = ['Rent', 'Utilities', 'Software', 'Marketing', 'Travel', 'Salaries', 'Office Supplies', 'Miscellaneous'];

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({ start: '', end: '', category: '' });

    // Form State
    const [formData, setFormData] = useState({
        title: '', category: 'Miscellaneous', amount: '',
        currency: 'PKR', description: '', expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash', reference_number: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => { loadExpenses(); }, [filters]);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const data = await api.getExpenses(filters);
            setExpenses(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setExpenses([]);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.updateExpense(editingId, formData);
            } else {
                await api.saveExpense(formData);
            }
            setShowModal(false);
            loadExpenses();
        } catch (e) { alert(e.message); }
    };

    // Calculations
    const totalAmount = Array.isArray(expenses) ? expenses.reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0) : 0;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Company Expenses</h1>
                <div>
                    <button className="btn btn-secondary" style={{ marginRight: '10px' }} onClick={() => exportToCSV(expenses, 'expenses_list')}>Export to CSV</button>
                    <button className="btn btn-primary" onClick={() => {
                        setEditingId(null); setFormData({
                            title: '', category: 'Miscellaneous', amount: '',
                            currency: 'PKR', description: '', expense_date: new Date().toISOString().split('T')[0],
                            payment_method: 'Cash', reference_number: ''
                        }); setShowModal(true);
                    }}>
                        + Add Expense
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid-3" style={{ marginBottom: '20px' }}>
                <div className="card">
                    <h3>Total Expenses (Filtered)</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                        {totalAmount.toLocaleString()} <span style={{ fontSize: '14px' }}>PKR</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar" style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '15px', background: '#fff', borderRadius: '8px' }}>
                <input type="date" value={filters.start} onChange={e => setFilters({ ...filters, start: e.target.value })} className="form-control" />
                <input type="date" value={filters.end} onChange={e => setFilters({ ...filters, end: e.target.value })} className="form-control" />
                <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="form-control">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="btn btn-secondary" onClick={() => setFilters({ start: '', end: '', category: '' })}>Clear</button>
            </div>

            {/* Table */}
            <div className="card" style={{ overflowX: 'auto' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(expenses) && expenses.map(ex => (
                            <tr key={ex._id}>
                                <td>{ex.expense_date}</td>
                                <td>
                                    <div style={{ fontWeight: 'bold' }}>{ex.title}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>{ex.description}</div>
                                </td>
                                <td><span className="badge" style={{ background: '#e2e8f0', color: '#333' }}>{ex.category}</span></td>
                                <td style={{ fontWeight: 'bold' }}>{Number(ex.amount).toLocaleString()} {ex.currency}</td>
                                <td>{ex.payment_method}</td>
                                <td>
                                    <button className="btn-icon" onClick={() => { setFormData(ex); setEditingId(ex._id); setShowModal(true); }}>✏️</button>
                                    <button className="btn-icon delete" onClick={async () => { if (confirm('Delete?')) { await api.deleteExpense(ex._id); loadExpenses(); } }}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                        {(!expenses || expenses.length === 0) && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No expenses found</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>{editingId ? 'Edit' : 'Add'} Expense</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Title</label>
                                    <input className="form-control" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount</label>
                                    <input className="form-control" required type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input className="form-control" required type="date" value={formData.expense_date} onChange={e => setFormData({ ...formData, expense_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select className="form-control" value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                                        <option>Cash</option>
                                        <option>Bank Transfer</option>
                                        <option>Card</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ref #</label>
                                    <input className="form-control" value={formData.reference_number} onChange={e => setFormData({ ...formData, reference_number: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
