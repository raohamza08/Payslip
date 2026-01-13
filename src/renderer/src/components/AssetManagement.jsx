import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AssetManagement() {
    const [assets, setAssets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Laptop',
        serial_number: '',
        asset_tag: '',
        assigned_to: '',
        status: 'Available',
        purchase_date: '',
        condition: 'New',
        assigned_date: '',
        return_date: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assetData, empData] = await Promise.all([
                api.fetchJson('/api/assets'),
                api.getEmployees()
            ]);
            setAssets(Array.isArray(assetData) ? assetData : []);
            setEmployees(Array.isArray(empData) ? empData : []);
        } catch (e) {
            console.error(e);
            setAssets([]);
        }
        setLoading(false);
    };

    const handleEdit = (asset) => {
        setEditingAsset(asset);
        setFormData({
            name: asset.name || '',
            type: asset.type || 'Laptop',
            serial_number: asset.serial_number || '',
            asset_tag: asset.asset_tag || '',
            assigned_to: asset.assigned_to || '',
            status: asset.status || 'Available',
            purchase_date: asset.purchase_date || '',
            condition: asset.condition || 'New',
            assigned_date: asset.assigned_date || '',
            return_date: asset.return_date || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this asset?')) return;
        try {
            await api.fetchJson(`/api/assets/${id}`, { method: 'DELETE' });
            alert('Asset deleted successfully');
            loadData();
        } catch (e) {
            alert(e.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editingAsset ? 'PUT' : 'POST';
            const url = editingAsset ? `/api/assets/${editingAsset.id}` : '/api/assets';

            await api.fetchJson(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            alert(`Asset ${editingAsset ? 'updated' : 'saved'} successfully!`);
            setShowModal(false);
            setEditingAsset(null);
            setFormData({
                name: '', type: 'Laptop', serial_number: '',
                asset_tag: '', assigned_to: '', status: 'Available',
                purchase_date: '', condition: 'New',
                assigned_date: '', return_date: ''
            });
            loadData();
        } catch (e) {
            alert(e.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return { bg: '#dcfce7', color: '#166534' };
            case 'Assigned': return { bg: '#e0f2fe', color: '#0369a1' };
            case 'Maintenance': return { bg: '#fef9c3', color: '#854d0e' };
            case 'Broken': return { bg: '#fee2e2', color: '#991b1b' };
            default: return { bg: '#f3f4f6', color: '#4b5563' };
        }
    };

    return (
        <div className="p-20">
            <div className="flex-row flex-between" style={{ alignItems: 'center', marginBottom: '20px' }}>
                <h1>Asset Management</h1>
                <button className="btn btn-primary" onClick={() => { setEditingAsset(null); setShowModal(true); }}>
                    + Add New Asset
                </button>
            </div>

            <div className="grid-3" style={{ marginBottom: '20px' }}>
                <div className="card shadow">
                    <h3>Total Assets</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{assets.length}</p>
                </div>
                <div className="card shadow">
                    <h3>Assigned</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>
                        {assets.filter(a => a.status === 'Assigned').length}
                    </p>
                </div>
                <div className="card shadow">
                    <h3>Available</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>
                        {assets.filter(a => a.status === 'Available').length}
                    </p>
                </div>
            </div>

            <div className="card shadow" style={{ overflowX: 'auto' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Asset Name</th>
                            <th>Type</th>
                            <th>Serial #</th>
                            <th>Asset Tag</th>
                            <th>Assigned To</th>
                            <th>Status</th>
                            <th>Condition</th>
                            <th>Purchase Date</th>
                            <th>Issue Date</th>
                            <th>Return Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(asset => {
                            const emp = employees.find(e => e.id === asset.assigned_to);
                            const style = getStatusColor(asset.status);
                            return (
                                <tr key={asset.id}>
                                    <td><strong>{asset.name}</strong></td>
                                    <td>{asset.type}</td>
                                    <td>{asset.serial_number}</td>
                                    <td>{asset.asset_tag}</td>
                                    <td>{emp ? emp.name : '-'}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '12px',
                                            fontSize: '12px', fontWeight: 'bold',
                                            background: style.bg, color: style.color
                                        }}>
                                            {asset.status}
                                        </span>
                                    </td>
                                    <td>{asset.condition}</td>
                                    <td>{asset.purchase_date}</td>
                                    <td>{asset.assigned_date}</td>
                                    <td>{asset.return_date}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(asset)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(asset.id)} title="Delete">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {assets.length === 0 && !loading && (
                            <tr>
                                <td colSpan="11" className="text-center p-20">No assets found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Asset Name *</label>
                                    <input type="text" className="form-control" required
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select className="form-control"
                                        value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option>Laptop</option>
                                        <option>Monitor</option>
                                        <option>Phone</option>
                                        <option>Furniture</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Serial Number</label>
                                    <input type="text" className="form-control"
                                        value={formData.serial_number} onChange={e => setFormData({ ...formData, serial_number: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Asset Tag *</label>
                                    <input type="text" className="form-control" required
                                        value={formData.asset_tag} onChange={e => setFormData({ ...formData, asset_tag: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Condition</label>
                                    <select className="form-control"
                                        value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}>
                                        <option>New</option>
                                        <option>Good</option>
                                        <option>Fair</option>
                                        <option>Poor</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select className="form-control"
                                        value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Available">Available</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Broken">Broken</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Assign To</label>
                                    <select className="form-control"
                                        value={formData.assigned_to} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                                        disabled={formData.status !== 'Assigned'}
                                    >
                                        <option value="">(Unassigned)</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Purchase Date</label>
                                    <input type="date" className="form-control"
                                        value={formData.purchase_date} onChange={e => setFormData({ ...formData, purchase_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Issue Date</label>
                                    <input type="date" className="form-control"
                                        value={formData.assigned_date} onChange={e => setFormData({ ...formData, assigned_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Return Date (Optional)</label>
                                <input type="date" className="form-control"
                                    value={formData.return_date} onChange={e => setFormData({ ...formData, return_date: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingAsset(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingAsset ? 'Update Asset' : 'Save Asset'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
