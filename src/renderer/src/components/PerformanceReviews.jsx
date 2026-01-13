import React, { useState, useEffect } from 'react';
import api from '../api';

export default function PerformanceReviews({ user }) {
    const [employees, setEmployees] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formData, setFormData] = useState({
        quality_rating: 3,
        speed_rating: 3,
        initiative_rating: 3,
        teamwork_rating: 3,
        attendance_rating: 3,
        comments: '',
        period: new Date().toISOString().slice(0, 7) // YYYY-MM
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const emps = await api.getEmployees();
            setEmployees(emps);
            // In a real app, we'd fetch existing reviews here
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        const total =
            Number(formData.quality_rating) +
            Number(formData.speed_rating) +
            Number(formData.initiative_rating) +
            Number(formData.teamwork_rating) +
            Number(formData.attendance_rating);

        const final_rating = (total / 5).toFixed(1);

        const reviewData = {
            employee_id: selectedEmployee,
            reviewer_email: user?.email || 'admin@euroshub.com',
            ...formData,
            final_rating,
            review_date: new Date().toISOString()
        };

        try {
            await api.saveReview(reviewData);
            alert(`Performance Review Submitted! Final Rating: ${final_rating}/5`);
            setShowModal(false);
            loadData(); // Reload list if we were showing it
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div className="p-20">
            <div className="flex-row flex-between" style={{ alignItems: 'center' }}>
                <h1>Performance Management (KPIs)</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + New Review
                </button>
            </div>

            <div className="card" style={{ marginTop: '20px', textAlign: 'center', color: '#666', padding: '40px' }}>
                <p>Select "New Review" to evaluate an employee.</p>
                <p>Past reviews will appear here.</p>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <h2>New Performance Review</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Employee</label>
                                <select
                                    className="form-control"
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                    required
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Review Period</label>
                                <input
                                    type="month"
                                    className="form-control"
                                    value={formData.period}
                                    onChange={e => setFormData({ ...formData, period: e.target.value })}
                                />
                            </div>

                            <div className="grid-2" style={{ gap: '15px' }}>
                                {['Quality', 'Speed', 'Initiative', 'Teamwork', 'Attendance'].map(metric => (
                                    <div key={metric} className="form-group">
                                        <label>{metric} (1-5)</label>
                                        <input
                                            type="number"
                                            min="1" max="5"
                                            className="form-control"
                                            value={formData[`${metric.toLowerCase()}_rating`]}
                                            onChange={e => setFormData({
                                                ...formData,
                                                [`${metric.toLowerCase()}_rating`]: e.target.value
                                            })}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="form-group">
                                <label>Comments</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={formData.comments}
                                    onChange={e => setFormData({ ...formData, comments: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Review</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
