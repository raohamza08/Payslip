import React, { useState, useEffect } from 'react';
import api from '../api';

export default function CompanyProfile() {
    const [config, setConfig] = useState({
        company_name: '',
        company_address: '',
        company_email: '',
        company_phone: '',
        company_website: '',
        tax_id: '',
        registration_number: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const data = await api.getConfig();
            if (data) setConfig(prev => ({ ...prev, ...data }));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.saveConfig(config);
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig({ ...config, [name]: value });
    };

    return (
        <div>
            <h1>Company Profile</h1>
            <div className="card" style={{ maxWidth: '800px' }}>
                <p style={{ color: '#64748b', marginBottom: 20 }}>This information will be used in the header of all generated payslips.</p>

                {message && (
                    <div style={{ padding: 12, background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 20 }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSave}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label>Company Name</label>
                            <input name="company_name" value={config.company_name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Company Email</label>
                            <input type="email" name="company_email" value={config.company_email} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input name="company_phone" value={config.company_phone} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Website</label>
                            <input name="company_website" value={config.company_website} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        <textarea
                            name="company_address"
                            value={config.company_address}
                            onChange={handleChange}
                            style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: 6, border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label>Tax ID / NTN</label>
                            <input name="tax_id" value={config.tax_id} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Reg. Number</label>
                            <input name="registration_number" value={config.registration_number} onChange={handleChange} />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}
