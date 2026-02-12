import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../api.js';
import toast from 'react-hot-toast';
import './Collections.css';

export default function Collections() {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const api = useApi();

    const fetchCollections = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getCollections();
            setCollections(data.collections);
        } catch (err) {
            console.error('Failed to fetch collections:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            const col = await api.createCollection(newName.trim());
            setCollections(prev => [col, ...prev]);
            setNewName('');
            setShowCreate(false);
            toast.success('Collection created!');
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="page-container">
            <div className="collections-header">
                <h2 className="page-title">👥 Shared Vaults</h2>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    + New
                </button>
            </div>

            {showCreate && (
                <div className="collections-create card">
                    <input
                        className="input"
                        placeholder="Collection name..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        autoFocus
                    />
                    <div className="collections-create-actions">
                        <button className="btn btn-primary" onClick={handleCreate} disabled={!newName.trim()}>
                            Create
                        </button>
                        <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-spinner" />
            ) : collections.length === 0 ? (
                <div className="empty-state">
                    <p>No shared vaults yet</p>
                    <span>Create one to start sharing clipboard items</span>
                </div>
            ) : (
                <div className="collections-grid">
                    {collections.map(col => (
                        <Link key={col.id} to={`/collections/${col.id}`} className="collection-card card">
                            <h3 className="collection-card-name">{col.name}</h3>
                            <div className="collection-card-meta">
                                <span className="badge badge-text">{col.role}</span>
                                <span className="collection-card-date">
                                    {new Date(col.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
