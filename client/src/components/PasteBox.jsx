import { useState, useRef } from 'react';
import { useApi } from '../api.js';
import toast from 'react-hot-toast';
import './PasteBox.css';

const EXPIRY_OPTIONS = [
    { value: '', label: 'No expiry' },
    { value: '1h', label: '1 hour' },
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
];

function getExpiryDate(option) {
    if (!option) return null;
    const now = new Date();
    const ms = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
    };
    return new Date(now.getTime() + ms[option]).toISOString();
}

export default function PasteBox({ onItemCreated }) {
    const [text, setText] = useState('');
    const [expiry, setExpiry] = useState('');
    const [contentType, setContentType] = useState('text');
    const [loading, setLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const api = useApi();

    const detectContentType = (value) => {
        try {
            JSON.parse(value);
            return 'json';
        } catch {
            if (value.includes('<') && value.includes('>')) return 'rich_text';
            return 'text';
        }
    };

    const handlePaste = (e) => {
        // Check for pasted images
        const items = e.clipboardData?.items;
        if (items) {
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    selectImage(file);
                    return;
                }
            }
        }

        const pasted = e.clipboardData.getData('text');
        if (pasted) {
            setContentType(detectContentType(pasted));
        }
    };

    const handleTextChange = (e) => {
        const value = e.target.value;
        setText(value);
        if (value.length > 0) {
            setContentType(detectContentType(value));
        }
    };

    const selectImage = (file) => {
        if (!file) return;
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error('Image must be under 5 MB');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setContentType('image');
    };

    const clearImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
        setContentType('text');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            selectImage(file);
        } else {
            toast.error('Only image files can be dropped here');
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) selectImage(file);
    };

    const handleSubmit = async () => {
        if (contentType === 'image') {
            if (!imageFile) return;
        } else {
            if (!text.trim()) return;
        }

        setLoading(true);

        try {
            let item;

            if (contentType === 'image' && imageFile) {
                // Upload image via FormData
                item = await api.uploadImage(imageFile, getExpiryDate(expiry));
            } else {
                item = await api.createItem({
                    content_type: contentType,
                    content_text: text,
                    expiry_at: getExpiryDate(expiry),
                });
            }

            setText('');
            setExpiry('');
            clearImage();
            setContentType('text');
            toast.success('Item saved!');
            if (onItemCreated) onItemCreated(item);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div
            className={`paste-box ${isDragOver ? 'paste-box--drag' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {imagePreview ? (
                <div className="paste-box-image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button className="paste-box-image-remove" onClick={clearImage} title="Remove image">✕</button>
                    <span className="paste-box-image-name">{imageFile?.name}</span>
                </div>
            ) : (
                <textarea
                    ref={textareaRef}
                    className="paste-box-input"
                    placeholder="Paste or type something... (Ctrl+V to paste, Ctrl+Enter to save) — or drop/paste an image"
                    value={text}
                    onChange={handleTextChange}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    rows={3}
                />
            )}
            <div className="paste-box-footer">
                <div className="paste-box-meta">
                    <span className={`badge badge-${contentType}`}>{contentType}</span>
                    <select
                        className="paste-box-expiry"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                    >
                        {EXPIRY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <button
                        className="btn btn-ghost"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload image"
                    >
                        🖼️ Image
                    </button>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={contentType === 'image' ? !imageFile : !text.trim() || loading}
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
}
