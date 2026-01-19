import React, { useState, useEffect } from 'react';
import api from '../api';

import { exportToCSV } from '../utils/exportToCSV';
import DocumentManager from './DocumentManager';
import { EditIcon, DocumentIcon, DeleteIcon, AddIcon, ExportIcon } from './Icons';

export default function EmployeeList({ onEdit }) {
    const [employees, setEmployees] = useState([]);
    const [selectedForDocs, setSelectedForDocs] = useState(null);
    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const data = await api.getEmployees();
        setEmployees(data);
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this employee?')) {
            await api.deleteEmployee(id);
            load();
        }
    };

    const activeEmployees = employees.filter(emp => emp.status === 'Active');
    const inactiveEmployees = employees.filter(emp => emp.status !== 'Active');

    const renderEmployeeRow = (emp) => (
        <tr key={emp.id}>
            <td>{emp.name}</td>
            <td>{emp.email}</td>
            <td>{emp.department}</td>
            <td><span style={{
                padding: '4px 12px',
                borderRadius: 20,
                background: emp.status === 'Active' ? '#dcfce7' : '#fee2e2',
                color: emp.status === 'Active' ? '#166534' : '#991b1b',
                fontSize: '12px',
                fontWeight: '600'
            }}>{emp.status}</span></td>
            <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => onEdit(emp)}>
                        <EditIcon />
                        Edit
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setSelectedForDocs(emp)}>
                        <DocumentIcon />
                        Docs
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)}>
                        <DeleteIcon />
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );

    return (
        <div>
            <div className="toolbar">
                <h1>Employees</h1>
                <div className="toolbar-group">
                    <button className="btn btn-secondary" onClick={() => exportToCSV(employees, 'employees_list')}>
                        <ExportIcon />
                        Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => onEdit({})}>
                        <AddIcon />
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Active Employees Section */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Active Employees ({activeEmployees.length})</h2>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Dept</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeEmployees.map(renderEmployeeRow)}
                            {activeEmployees.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No active employees found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Inactive Employees Section */}
            {inactiveEmployees.length > 0 && (
                <div className="card">
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: showInactive ? '15px' : '0',
                            cursor: 'pointer',
                            padding: '10px',
                            borderRadius: '10px',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setShowInactive(!showInactive)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-light)' }}>
                            Inactive Employees ({inactiveEmployees.length})
                        </h2>
                        <span style={{ fontSize: '1.5rem', transition: 'transform 0.3s ease', transform: showInactive ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            ▼
                        </span>
                    </div>

                    {showInactive && (
                        <div className="table-container" style={{ animation: 'fadeIn 0.3s ease' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Dept</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inactiveEmployees.map(renderEmployeeRow)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {selectedForDocs && (
                <DocumentManager
                    employee={selectedForDocs}
                    onClose={() => setSelectedForDocs(null)}
                />
            )}
        </div>
    );
}
