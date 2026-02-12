import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../api.js';
import ClipCard from '../components/ClipCard.jsx';
import QRModal from '../components/QRModal.jsx';
import toast from 'react-hot-toast';
import './CollectionDetail.css';

export default function CollectionDetail() {
    const { id } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qrItem, setQrItem] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const api = useApi();

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getCollectionItems(id);
            setItems(data.items);
        } catch (err) {
            console.error('Failed to fetch collection items:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        try {
            await api.inviteMember(id, inviteEmail.trim());
            toast.success('Member invited!');
            setInviteEmail('');
            setShowInvite(false);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = (itemId) => {
        setItems(prev => prev.filter(i => i.id !== itemId));
    };

    return (
        <div className="page-container">
            <div className="collection-detail-header">
                <Link to="/collections" className="btn btn-ghost">← Back</Link>
                <button className="btn btn-secondary" onClick={() => setShowInvite(!showInvite)}>
                    + Invite
                </button>
            </div>

            {showInvite && (
                <div className="card invite-panel">
                    <h4>Invite Member</h4>
                    <div className="invite-form">
                        <input
                            className="input"
                            placeholder="Enter email address..."
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                        />
                        <button className="btn btn-primary" onClick={handleInvite} disabled={!inviteEmail.trim()}>
                            Send
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-spinner" />
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <p>No items in this collection</p>
                    <span>Add items from your vault to share them</span>
                </div>
            ) : (
                items.map(item => (
                    <ClipCard
                        key={item.id}
                        item={item}
                        onDelete={handleDelete}
                        onQR={setQrItem}
                    />
                ))
            )}

            {qrItem && <QRModal item={qrItem} onClose={() => setQrItem(null)} />}
        </div>
    );
}
