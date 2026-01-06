import React, { useState, useEffect } from 'react';
import api from '../api';

import { exportToCSV } from '../utils/exportToCSV';

export default function EmployeeList({ onEdit }) {
    const [employees, setEmployees] = useState([]);

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

    return (
        <div>
            <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1>Employees</h1>
                <div>
                    <button className="btn btn-secondary" style={{ marginRight: '10px' }} onClick={() => exportToCSV(employees, 'employees_list')}>Export to CSV</button>
                    <button className="btn btn-primary" onClick={() => onEdit({})}>+ Add Employee</button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Dept</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(employees) && employees.map(emp => (
                            <tr key={emp.id}>
                                <td>{emp.name}</td>
                                <td>{emp.email}</td>
                                <td>{emp.job_title}</td>
                                <td>{emp.department}</td>
                                <td><span style={{
                                    padding: '2px 8px',
                                    borderRadius: 10,
                                    background: emp.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                    color: emp.status === 'Active' ? '#166534' : '#991b1b',
                                    fontSize: '12px'
                                }}>{emp.status}</span></td>
                                <td>
                                    <button className="btn btn-secondary" style={{ padding: '5px 10px', marginRight: 5 }} onClick={() => onEdit(emp)}>Edit</button>
                                    <button className="btn btn-danger" style={{ padding: '5px 10px' }} onClick={() => handleDelete(emp.id)}>X</button>
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No employees found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
