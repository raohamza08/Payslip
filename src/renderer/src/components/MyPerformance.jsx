import React, { useState, useEffect } from 'react';
import api from '../api';

export default function MyPerformance({ user }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch reviews for this employee
            const portalData = await api.getPortalDashboard();
            // The portal dashboard returns 'recentPerformance' (single). 
            // We need a route for ALL history. Let's assume we can add it or filter locally.
            // For now, let's use a new route if we can, or just mock it from portal data.

            // Wait, we need a list.
            const response = await api.fetchJson(`/api/performance?employee_id=${portalData.profile.id}`);
            setReviews(Array.isArray(response) ? response : []);
        } catch (e) {
            console.error(e);
            setReviews([]);
        }
        setLoading(false);
    };

    if (loading) return <div>Loading Performance Data...</div>;

    // Calculate averages
    const avgRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + Number(r.final_rating), 0) / reviews.length).toFixed(1)
        : 'N/A';

    return (
        <div className="p-20">
            <h1>My Performance</h1>

            <div className="grid-3" style={{ marginBottom: '30px' }}>
                <div className="card shadow">
                    <h3>Average Rating</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)' }}>{avgRating} / 5</p>
                </div>
                <div className="card shadow">
                    <h3>Reviews Received</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{reviews.length}</p>
                </div>
                <div className="card shadow">
                    <h3>Next Review</h3>
                    <p style={{ fontSize: '18px', marginTop: '10px' }}>To be scheduled</p>
                </div>
            </div>

            <div className="card shadow">
                <h3>Performance History</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>Review Date</th>
                            <th>Quality</th>
                            <th>Speed</th>
                            <th>Initiative</th>
                            <th>Teamwork</th>
                            <th>Overall</th>
                            <th>Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map(review => (
                            <tr key={review.id || review._id}>
                                <td><strong>{review.period}</strong></td>
                                <td>{new Date(review.review_date).toLocaleDateString()}</td>
                                <td>{review.quality_rating}</td>
                                <td>{review.speed_rating}</td>
                                <td>{review.initiative_rating}</td>
                                <td>{review.teamwork_rating}</td>
                                <td>
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: review.final_rating >= 4 ? 'green' : review.final_rating >= 3 ? 'orange' : 'red'
                                    }}>
                                        {review.final_rating}
                                    </span>
                                </td>
                                <td style={{ fontStyle: 'italic', color: '#666' }}>{review.comments}</td>
                            </tr>
                        ))}
                        {reviews.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center p-20">No performance reviews found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
