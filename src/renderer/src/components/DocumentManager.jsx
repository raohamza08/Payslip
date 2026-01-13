import React, { useState, useEffect } from 'react';
import api from '../api';

export default function DocumentManager({ employee, onClose }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [docName, setDocName] = useState('');
    const [file, setFile] = useState(null);

    useEffect(() => {
        loadDocs();
    }, [employee.id]);

    const loadDocs = async () => {
        setLoading(true);
        try {
            const data = await api.getDocuments(employee.id);
            setDocs(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !docName) return alert('Please provide name and file');

        setUploading(true);
        try {
            await api.uploadDocument(employee.id, docName, file);
            alert('Document uploaded successfully');
            setDocName('');
            setFile(null);
            loadDocs();
        } catch (e) {
            alert('Upload failed: ' + e.message);
        }
        setUploading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await api.fetchJson(`/api/documents/${id}`, { method: 'DELETE' }); // We'll add this route
            loadDocs();
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '800px', width: '90%' }}>
                <div className="flex-row flex-between" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h3>Documents for {employee.name}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                </div>

                <div className="grid-2" style={{ marginTop: '20px', gap: '30px' }}>
                    {/* Left side: Upload Form */}
                    <div style={{ borderRight: '1px solid #eee', paddingRight: '20px' }}>
                        <h4>Upload New Document</h4>
                        <form onSubmit={handleUpload} style={{ marginTop: '15px' }}>
                            <div className="form-group">
                                <label>Document Name (e.g. ID Card, Contract)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    required
                                    value={docName}
                                    onChange={e => setDocName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>File</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    required
                                    onChange={e => setFile(e.target.files[0])}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={uploading} style={{ width: '100%', marginTop: '10px' }}>
                                {uploading ? 'Uploading...' : 'Upload Document'}
                            </button>
                        </form>
                    </div>

                    {/* Right side: List */}
                    <div>
                        <h4>Existing Documents</h4>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '15px' }}>
                            {loading ? <p>Loading...</p> : docs.map(doc => (
                                <div key={doc.id} className="card border" style={{ padding: '10px', marginBottom: '10px' }}>
                                    <div className="flex-row flex-between" style={{ alignItems: 'center' }}>
                                        <div>
                                            <strong style={{ display: 'block' }}>{doc.name}</strong>
                                            <span style={{ fontSize: '11px', color: '#888' }}>
                                                {new Date(doc.created_at).toLocaleDateString()} • {doc.file_type}
                                            </span>
                                        </div>
                                        <div className="flex-row" style={{ gap: '5px' }}>
                                            <a
                                                href={`http://localhost:3000/uploads/documents/${doc.file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-sm btn-secondary"
                                            >
                                                👁️
                                            </a>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(doc.id)}>🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!loading && docs.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>No documents found.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
