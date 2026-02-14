import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../api.js';
import PasteBox from '../components/PasteBox.jsx';
import ClipCard from '../components/ClipCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import QRModal from '../components/QRModal.jsx';

export default function Vault() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: '' });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [qrItem, setQrItem] = useState(null);
    const api = useApi();

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (filters.type) params.type = filters.type;
            const data = await api.getItems(params);
            setItems(data.items);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            console.error('Failed to fetch items:', err);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleItemCreated = (newItem) => {
        setItems(prev => [newItem, ...prev]);
    };

    const handleDelete = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleUpdate = (updated) => {
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPage(1);
    };

    return (
        <div className="page-container">
            <h2 className="page-title">Personal Vault</h2>
            <PasteBox onItemCreated={handleItemCreated} />
            <FilterBar filters={filters} onChange={handleFilterChange} />

            {loading ? (
                <div className="loading-spinner" />
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <p>No items yet</p>
                    <span>Paste something above to get started</span>
                </div>
            ) : (
                <>
                    <div className="clips-grid">
                        {items.map(item => (
                            <ClipCard
                                key={item.id}
                                item={item}
                                onDelete={handleDelete}
                                onUpdate={handleUpdate}
                                onQR={setQrItem}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                                className="btn btn-secondary"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                ← Prev
                            </button>
                            <span style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                className="btn btn-secondary"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}

            {qrItem && <QRModal item={qrItem} onClose={() => setQrItem(null)} />}
        </div>
    );
}
