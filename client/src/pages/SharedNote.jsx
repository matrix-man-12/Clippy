import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './SharedNote.css';

const API_BASE = '/api';

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

export default function SharedNote() {
    const { shareToken } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNote();
    }, [shareToken]);

    const fetchNote = async () => {
        try {
            const res = await fetch(`${API_BASE}/share/${shareToken}`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Note not found');
            }
            const data = await res.json();
            setItem(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!item) return;
        try {
            await navigator.clipboard.writeText(item.content_text || '');
            const btn = document.getElementById('shared-copy-btn');
            if (btn) {
                btn.textContent = '✓ Copied!';
                setTimeout(() => { btn.textContent = '📋 Copy'; }, 1500);
            }
        } catch {
            // fallback
        }
    };

    if (loading) {
        return (
            <div className="shared-note-page">
                <div className="shared-note-container">
                    <div className="loading-spinner" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="shared-note-page">
                <div className="shared-note-container">
                    <div className="shared-note-error">
                        <h2>😕 {error}</h2>
                        <p>This note may have been deleted or expired.</p>
                    </div>
                </div>
                <footer className="shared-note-footer">
                    <a href="/">📎 Clippy</a>
                </footer>
            </div>
        );
    }

    const isImage = item.content_type === 'image';

    return (
        <div className="shared-note-page">
            <div className="shared-note-container">
                <div className="shared-note-header">
                    <h1 className="shared-note-title">Shared Note</h1>
                    <div className="shared-note-meta">
                        <span className={`badge badge-${item.content_type}`}>{item.content_type}</span>
                        <span className="shared-note-date">{formatDate(item.created_at)}</span>
                    </div>
                </div>

                <div className="shared-note-content">
                    {isImage ? (
                        <div className="shared-note-image">
                            <img
                                src={`${API_BASE}/share/${shareToken}/image`}
                                alt={item.content_image_name || 'Shared image'}
                            />
                            {item.content_image_name && (
                                <span className="shared-note-image-name">{item.content_image_name}</span>
                            )}
                        </div>
                    ) : (
                        <>
                            <pre className="shared-note-text">{item.content_text}</pre>
                            <button
                                id="shared-copy-btn"
                                className="btn btn-primary shared-note-copy"
                                onClick={handleCopy}
                            >
                                📋 Copy
                            </button>
                        </>
                    )}
                </div>
            </div>

            <footer className="shared-note-footer">
                <span>Shared via </span>
                <a href="/">📎 Clippy</a>
            </footer>
        </div>
    );
}
