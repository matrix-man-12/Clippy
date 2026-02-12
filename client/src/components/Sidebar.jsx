import { NavLink, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();

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
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: { width: 32, height: 32 },
                            },
                        }}
                    />
                    <span className="sidebar-user-label">Account</span>
                </div>
            </aside>
        </>
    );
}
