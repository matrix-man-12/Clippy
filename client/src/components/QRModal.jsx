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
                    <button className="btn-icon" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
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
                                    bgColor="#161A23"
                                    fgColor="#E8A849"
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
