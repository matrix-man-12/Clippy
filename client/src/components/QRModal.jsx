import { QRCodeSVG } from 'qrcode.react';
import './QRModal.css';

export default function QRModal({ item, onClose }) {
    const content = item.content_text || '';
    const tooLong = content.length > 2000;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content qr-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>QR Code</h3>
                    <button className="btn-icon" onClick={onClose}>✕</button>
                </div>

                <div className="qr-modal-body">
                    {tooLong ? (
                        <div className="qr-modal-warning">
                            <p>⚠️ Content is too long for QR ({content.length} chars).</p>
                            <p>QR codes work best under ~2000 characters.</p>
                            <p>Use the <strong>Share</strong> button instead to get a link.</p>
                        </div>
                    ) : (
                        <>
                            <div className="qr-modal-code">
                                <QRCodeSVG
                                    value={content}
                                    size={220}
                                    level="M"
                                    bgColor="#FDF6EC"
                                    fgColor="#3D2C1E"
                                />
                            </div>
                            <p className="qr-modal-hint">
                                Scan to read this note's content directly.
                            </p>
                            <div className="qr-modal-preview">
                                <pre>{content.slice(0, 100)}{content.length > 100 ? '...' : ''}</pre>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
