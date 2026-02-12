import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApi } from '../api.js';
import toast from 'react-hot-toast';
import './QRModal.css';

export default function QRModal({ item, onClose }) {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);
    const api = useApi();

    const generateQR = async () => {
        if (qrData) return;
        setLoading(true);
        try {
            const result = await api.generateQR(item.content_text);
            const fullUrl = `${window.location.origin}/api/qr/${result.token}`;
            setQrData({ ...result, fullUrl });
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate on mount
    if (!qrData && !loading) {
        generateQR();
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content qr-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>QR Code</h3>
                    <button className="btn-icon" onClick={onClose}>✕</button>
                </div>

                <div className="qr-modal-body">
                    {loading && <div className="loading-spinner" />}
                    {qrData && (
                        <>
                            <div className="qr-modal-code">
                                <QRCodeSVG
                                    value={qrData.fullUrl}
                                    size={220}
                                    level="M"
                                    bgColor="#FDF6EC"
                                    fgColor="#3D2C1E"
                                />
                            </div>
                            <p className="qr-modal-hint">
                                Scan to transfer this text. Expires in 10 minutes.
                            </p>
                            <div className="qr-modal-preview">
                                <pre>{item.content_text?.slice(0, 100)}{item.content_text?.length > 100 ? '...' : ''}</pre>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
