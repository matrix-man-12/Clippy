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

function truncate(str, max = 120) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
}

// SVG icons
const CopyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
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

const DownloadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
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
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const api = useApi();
    const navigate = useNavigate();

    const isImage = item.content_type === 'image';

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            if (isImage) {
                const url = `${window.location.origin}${api.getImageUrl(item.id)}`;
                await navigator.clipboard.writeText(url);
            } else {
                await navigator.clipboard.writeText(item.content_text || '');
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
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

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(false);
        try {
            await api.deleteItem(item.id);
            toast.success('Deleted');
            if (onDelete) onDelete(item.id);
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleDeleteCancel = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(false);
    };

    const handleDownload = async (e) => {
        e.stopPropagation();
        try {
            const url = api.getImageUrl(item.id);
            const res = await fetch(url);
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = item.content_image_name || `clippy-image-${item.id}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } catch {
            toast.error('Download failed');
        }
    };

    const handleClick = () => {
        if (showDeleteConfirm) return;
        navigate(`/note/${item.id}`);
    };

    return (
        <div className="clip-card" onClick={handleClick}>
            {/* Preview area — fixed height */}
            <div className="clip-card-preview">
                {isImage ? (
                    <img
                        className="clip-card-thumb"
                        src={api.getImageUrl(item.id)}
                        alt={item.content_image_name || 'Image'}
                        loading="lazy"
                    />
                ) : (
                    <pre className="clip-card-text">{truncate(item.content_text, 120)}</pre>
                )}
            </div>

            {/* Footer */}
            <div className="clip-card-footer">
                <div className="clip-card-meta">
                    <span className="clip-card-time">{timeAgo(item.created_at)}</span>
                </div>
                <div className="clip-card-actions">
                    <button
                        className={`btn-icon btn-icon-sm ${copied ? 'btn-icon--copied' : ''}`}
                        onClick={handleCopy}
                        title={copied ? 'Copied!' : 'Copy'}
                    >
                        {copied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    <button
                        className={`btn-icon btn-icon-sm ${fav ? 'btn-icon--active' : ''}`}
                        onClick={handleFavorite}
                        title={fav ? 'Unfavorite' : 'Favorite'}
                    >
                        {fav ? <StarFilledIcon /> : <StarOutlineIcon />}
                    </button>
                    {isImage && (
                        <button className="btn-icon btn-icon-sm" onClick={handleDownload} title="Download">
                            <DownloadIcon />
                        </button>
                    )}
                    <button className="btn-icon btn-icon-sm btn-icon--danger" onClick={handleDeleteClick} title="Delete">
                        <TrashIcon />
                    </button>
                </div>
            </div>

            {/* Delete confirmation overlay */}
            {showDeleteConfirm && (
                <div className="clip-card-delete-confirm" onClick={(e) => e.stopPropagation()}>
                    <p>Delete this note?</p>
                    <div className="clip-card-delete-actions">
                        <button className="btn btn-ghost btn-sm" onClick={handleDeleteCancel}>Cancel</button>
                        <button className="btn btn-sm clip-card-delete-btn" onClick={handleDeleteConfirm}>Delete</button>
                    </div>
                </div>
            )}
        </div>
    );
}
