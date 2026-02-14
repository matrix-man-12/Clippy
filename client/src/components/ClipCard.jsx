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

// SVG icons
const CopyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const StarOutlineIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const StarFilledIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const QRIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="8" height="8" rx="1" />
        <rect x="14" y="2" width="8" height="8" rx="1" />
        <rect x="2" y="14" width="8" height="8" rx="1" />
        <path d="M14 14h3v3h-3z" />
        <path d="M19 14h3v3h-3z" />
        <path d="M14 19h3v3h-3z" />
        <path d="M19 19h3v3h-3z" />
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

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
                        <span className="badge badge-shared">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                        </span>
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
                    <CopyIcon />
                </button>
                <button
                    className={`btn-icon ${fav ? 'btn-icon--active' : ''}`}
                    onClick={handleFavorite}
                    title={fav ? 'Unfavorite' : 'Favorite'}
                >
                    {fav ? <StarFilledIcon /> : <StarOutlineIcon />}
                </button>
                {!isImage && (
                    <button className="btn-icon" onClick={handleQR} title="QR Code">
                        <QRIcon />
                    </button>
                )}
                <button className="btn-icon btn-icon--danger" onClick={handleDelete} title="Delete">
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
}
