import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useApi } from '../api.js';
import toast from 'react-hot-toast';
import './NoteDetail.css';

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function NoteDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const api = useApi();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQR, setShowQR] = useState(false);
    const [shareUrl, setShareUrl] = useState(null);
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
        loadItem();
    }, [id]);

    const loadItem = async () => {
        try {
            const data = await api.getItem(id);
            setItem(data);
            if (data.share_token) {
                setShareUrl(`${window.location.origin}/s/${data.share_token}`);
            }
        } catch (err) {
            toast.error('Note not found');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            if (item.content_type === 'image') {
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

    const handleFavorite = async () => {
        try {
            const newVal = !item.is_favorite;
            await api.updateItem(item.id, { is_favorite: newVal });
            setItem({ ...item, is_favorite: newVal });
            toast.success(newVal ? 'Added to favorites' : 'Removed from favorites');
        } catch {
            toast.error('Failed to update');
        }
    };

    const handleShare = async () => {
        setSharing(true);
        try {
            const result = await api.shareItem(item.id);
            const fullUrl = `${window.location.origin}${result.share_url}`;
            setShareUrl(fullUrl);
            await navigator.clipboard.writeText(fullUrl);
            toast.success('Share link copied!');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSharing(false);
        }
    };

    const handleUnshare = async () => {
        try {
            await api.unshareItem(item.id);
            setShareUrl(null);
            setItem({ ...item, share_token: null });
            toast.success('Share link removed');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this note?')) return;
        try {
            await api.deleteItem(item.id);
            toast.success('Deleted');
            navigate('/');
        } catch {
            toast.error('Failed to delete');
        }
    };

    if (loading) {
        return <div className="note-detail-loading"><div className="loading-spinner" /></div>;
    }

    if (!item) return null;

    const isImage = item.content_type === 'image';
    const qrContent = item.content_text || '';
    const qrTooLong = qrContent.length > 2000;

    return (
        <div className="note-detail">
            <div className="note-detail-topbar">
                <button className="btn btn-ghost" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <div className="note-detail-actions">
                    <button className="btn btn-ghost" onClick={handleCopy} title="Copy">
                        📋 Copy
                    </button>
                    <button className="btn btn-ghost" onClick={handleFavorite}>
                        {item.is_favorite ? '⭐ Favorited' : '☆ Favorite'}
                    </button>
                    {!isImage && (
                        <button className="btn btn-ghost" onClick={() => setShowQR(!showQR)}>
                            {showQR ? '✕ Close QR' : '📱 QR Code'}
                        </button>
                    )}
                    <button className="btn btn-ghost" onClick={handleShare} disabled={sharing}>
                        {shareUrl ? '🔗 Shared' : sharing ? '...' : '🔗 Share'}
                    </button>
                    <button className="btn btn-ghost btn-danger-text" onClick={handleDelete}>
                        🗑️ Delete
                    </button>
                </div>
            </div>

            <div className="note-detail-meta">
                <span className={`badge badge-${item.content_type}`}>{item.content_type}</span>
                <span className="note-detail-date">Created {formatDate(item.created_at)}</span>
                {item.updated_at !== item.created_at && (
                    <span className="note-detail-date">Updated {formatDate(item.updated_at)}</span>
                )}
                {item.expiry_at && (
                    <span className="badge badge-expiry">⏳ Expires {formatDate(item.expiry_at)}</span>
                )}
            </div>

            {/* Share URL banner */}
            {shareUrl && (
                <div className="note-detail-share-banner">
                    <span className="note-detail-share-label">🔗 Shared link:</span>
                    <code className="note-detail-share-url">{shareUrl}</code>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); }}
                    >
                        Copy
                    </button>
                    <button className="btn btn-ghost btn-sm btn-danger-text" onClick={handleUnshare}>
                        Unshare
                    </button>
                </div>
            )}

            {/* QR Code panel */}
            {showQR && !isImage && (
                <div className="note-detail-qr">
                    {qrTooLong ? (
                        <div className="note-detail-qr-warning">
                            <p>⚠️ Content is too long for a QR code ({qrContent.length} chars, max ~2000).</p>
                            <p>Use the Share link instead.</p>
                        </div>
                    ) : (
                        <>
                            <QRCodeSVG
                                value={qrContent}
                                size={260}
                                level="M"
                                bgColor="#161A23"
                                fgColor="#E8A849"
                            />
                            <p className="note-detail-qr-hint">Scan to read this note's content directly</p>
                        </>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="note-detail-content">
                {isImage ? (
                    <div className="note-detail-image">
                        <img
                            src={api.getImageUrl(item.id)}
                            alt={item.content_image_name || 'Clipboard image'}
                        />
                        {item.content_image_name && (
                            <span className="note-detail-image-name">{item.content_image_name}</span>
                        )}
                    </div>
                ) : (
                    <pre className="note-detail-text">{item.content_text}</pre>
                )}
            </div>
        </div>
    );
}
