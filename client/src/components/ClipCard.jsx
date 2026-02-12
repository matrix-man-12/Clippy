import { useState } from 'react';
import { useApi } from '../api.js';
import toast from 'react-hot-toast';
import './ClipCard.css';

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function truncate(str, max = 200) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '...' : str;
}

export default function ClipCard({ item, onUpdate, onDelete, onQR }) {
    const [fav, setFav] = useState(item.is_favorite);
    const api = useApi();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(item.content_text || '');
            toast.success('Copied!');
        } catch {
            toast.error('Failed to copy');
        }
    };

    const handleFavorite = async () => {
        const newVal = !fav;
        setFav(newVal); // optimistic
        try {
            await api.updateItem(item.id, { is_favorite: newVal });
            if (onUpdate) onUpdate({ ...item, is_favorite: newVal });
        } catch {
            setFav(!newVal); // revert
            toast.error('Failed to update');
        }
    };

    const handleDelete = async () => {
        try {
            await api.deleteItem(item.id);
            toast.success('Deleted');
            if (onDelete) onDelete(item.id);
        } catch {
            toast.error('Failed to delete');
        }
    };

    return (
        <div className="clip-card card">
            <div className="clip-card-header">
                <div className="clip-card-meta">
                    <span className={`badge badge-${item.content_type}`}>{item.content_type}</span>
                    <span className="clip-card-time">{timeAgo(item.created_at)}</span>
                    {item.expiry_at && (
                        <span className="badge badge-expiry">⏳ Expires {timeAgo(item.expiry_at)}</span>
                    )}
                </div>
            </div>

            <div className="clip-card-body">
                <pre className="clip-card-content">{truncate(item.content_text)}</pre>
            </div>

            <div className="clip-card-actions">
                <button className="btn-icon" onClick={handleCopy} title="Copy">
                    📋
                </button>
                <button
                    className={`btn-icon ${fav ? 'btn-icon--active' : ''}`}
                    onClick={handleFavorite}
                    title={fav ? 'Unfavorite' : 'Favorite'}
                >
                    {fav ? '⭐' : '☆'}
                </button>
                <button className="btn-icon" onClick={() => onQR && onQR(item)} title="QR Code">
                    📱
                </button>
                <button className="btn-icon btn-danger" onClick={handleDelete} title="Delete">
                    🗑️
                </button>
            </div>
        </div>
    );
}
