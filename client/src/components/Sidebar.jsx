import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Sidebar.css';

const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
        return <span className="sidebar-user-label">👤 Dev Mode</span>;
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
        { to: '/', label: 'Personal Vault', icon: '📋' },
        { to: '/favorites', label: 'Favorites', icon: '⭐' },
        { to: '/collections', label: 'Shared Vaults', icon: '👥' },
    ];

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
                <div className="sidebar-header">
                    <h1 className="sidebar-logo">📎 Clippy</h1>
                </div>

                <nav className="sidebar-nav">
                    {links.map(({ to, label, icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                            }
                            onClick={onClose}
                        >
                            <span className="sidebar-link-icon">{icon}</span>
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
