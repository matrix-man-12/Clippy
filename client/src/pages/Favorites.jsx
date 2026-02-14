import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../api.js';
import ClipCard from '../components/ClipCard.jsx';
import QRModal from '../components/QRModal.jsx';

export default function Favorites() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qrItem, setQrItem] = useState(null);
    const api = useApi();

    const fetchFavorites = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getItems({ favorites: true, limit: 50 });
            setItems(data.items);
        } catch (err) {
            console.error('Failed to fetch favorites:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const handleDelete = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleUpdate = (updated) => {
        if (!updated.is_favorite) {
            setItems(prev => prev.filter(i => i.id !== updated.id));
        } else {
            setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
        }
    };

    return (
        <div className="page-container">
            <h2 className="page-title">Favorites</h2>

            {loading ? (
                <div className="loading-spinner" />
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <p>No favorites yet</p>
                    <span>Star items in your vault to see them here</span>
                </div>
            ) : (
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
            )}

            {qrItem && <QRModal item={qrItem} onClose={() => setQrItem(null)} />}
        </div>
    );
}
