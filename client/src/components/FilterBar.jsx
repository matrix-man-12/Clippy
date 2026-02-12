import './FilterBar.css';

const CONTENT_TYPES = [
    { value: '', label: 'All types' },
    { value: 'text', label: 'Text' },
    { value: 'rich_text', label: 'Rich Text' },
    { value: 'json', label: 'JSON' },
    { value: 'image', label: 'Image' },
];

export default function FilterBar({ filters, onChange }) {
    const handleChange = (key, value) => {
        onChange({ ...filters, [key]: value });
    };

    return (
        <div className="filter-bar">
            <div className="filter-bar-pills">
                {CONTENT_TYPES.map(({ value, label }) => (
                    <button
                        key={value}
                        className={`filter-pill ${filters.type === value ? 'filter-pill--active' : ''}`}
                        onClick={() => handleChange('type', value)}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
