import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Sidebar.css';

const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// SVG Icons
const VaultIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M12 14h.01" />
    </svg>
);

const StarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const UsersIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const ClippyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.59 3.41A2 2 0 0 0 14.17 3H9.83a2 2 0 0 0-1.42.59L3.59 8.41A2 2 0 0 0 3 9.83v4.34a2 2 0 0 0 .59 1.42l4.82 4.82a2 2 0 0 0 1.42.59h4.34a2 2 0 0 0 1.42-.59l4.82-4.82A2 2 0 0 0 21 14.17V9.83a2 2 0 0 0-.59-1.42l-4.82-4.82z" />
    </svg>
);

// Dynamically loaded UserButton wrapper
function AccountButton() {
    const [ClerkButton, setClerkButton] = useState(null);

    useEffect(() => {
        if (hasClerk) {
            import('@clerk/clerk-react').then(({ UserButton }) => {
                setClerkButton(() => UserButton);
            });
        }
    }, []);

    if (!hasClerk) {
        return <span className="sidebar-user-label">⚡ Dev Mode</span>;
    }

    if (!ClerkButton) {
        return <span className="sidebar-user-label">Loading...</span>;
    }

    return (
        <>
            <ClerkButton
                appearance={{
                    elements: {
                        avatarBox: { width: 32, height: 32 },
                    },
                }}
            />
            <span className="sidebar-user-label">Account</span>
        </>
    );
}

export default function Sidebar({ isOpen, onClose }) {
    const links = [
        { to: '/', label: 'Personal Vault', icon: VaultIcon },
        { to: '/favorites', label: 'Favorites', icon: StarIcon },
        { to: '/collections', label: 'Shared Vaults', icon: UsersIcon },
    ];

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
                <div className="sidebar-header">
                    <h1 className="sidebar-logo">
                        <span className="sidebar-logo-icon"><ClippyIcon /></span>
                        Clippy
                    </h1>
                </div>

                <nav className="sidebar-nav">
                    {links.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                            }
                            onClick={onClose}
                        >
                            <span className="sidebar-link-icon"><Icon /></span>
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <AccountButton />
                </div>
            </aside>
        </>
    );
}
