import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

    const isImage = item.content_type === 'image';

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            if (isImage) {
                const url = `${window.location.origin}${api.getImageUrl(item.id)}`;
                await navigator.clipboard.writeText(url);
                toast.success('Image URL copied!');
            } else {
                await navigator.clipboard.writeText(item.content_text || '');
                toast.success('Copied!');
            }
        } catch {
            toast.error('Failed to copy');
        }
    };

    const handleFavorite = async (e) => {
        e.stopPropagation();
        const newVal = !fav;
        setFav(newVal);
        try {
            await api.updateItem(item.id, { is_favorite: newVal });
            if (onUpdate) onUpdate({ ...item, is_favorite: newVal });
        } catch {
            setFav(!newVal);
            toast.error('Failed to update');
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        try {
            await api.deleteItem(item.id);
            toast.success('Deleted');
            if (onDelete) onDelete(item.id);
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleQR = (e) => {
        e.stopPropagation();
        if (onQR) onQR(item);
    };

    const handleClick = () => {
        navigate(`/note/${item.id}`);
    };

    return (
        <div className="clip-card card" onClick={handleClick} style={{ cursor: 'pointer' }}>
            <div className="clip-card-header">
                <div className="clip-card-meta">
                    <span className={`badge badge-${item.content_type}`}>{item.content_type}</span>
                    <span className="clip-card-time">{timeAgo(item.created_at)}</span>
                    {item.expiry_at && (
                        <span className="badge badge-expiry">⏳ Expires {timeAgo(item.expiry_at)}</span>
                    )}
                    {item.share_token && (
                        <span className="badge badge-shared">🔗</span>
                    )}
                </div>
            </div>

            <div className="clip-card-body">
                {isImage ? (
                    <div className="clip-card-image">
                        <img
                            src={api.getImageUrl(item.id)}
                            alt={item.content_image_name || 'Clipboard image'}
                            loading="lazy"
                        />
                        {item.content_image_name && (
                            <span className="clip-card-image-name">{item.content_image_name}</span>
                        )}
                    </div>
                ) : (
                    <pre className="clip-card-content">{truncate(item.content_text)}</pre>
                )}
            </div>

            <div className="clip-card-actions">
                <button className="btn-icon" onClick={handleCopy} title={isImage ? 'Copy URL' : 'Copy'}>
                    📋
                </button>
                <button
                    className={`btn-icon ${fav ? 'btn-icon--active' : ''}`}
                    onClick={handleFavorite}
                    title={fav ? 'Unfavorite' : 'Favorite'}
                >
                    {fav ? '⭐' : '☆'}
                </button>
                {!isImage && (
                    <button className="btn-icon" onClick={handleQR} title="QR Code">
                        📱
                    </button>
                )}
                <button className="btn-icon btn-danger" onClick={handleDelete} title="Delete">
                    🗑️
                </button>
            </div>
        </div>
    );
}
