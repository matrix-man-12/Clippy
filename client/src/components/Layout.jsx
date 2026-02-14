import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import './Layout.css';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="layout-main">
                <header className="layout-header">
                    <button
                        className="btn-icon mobile-menu-btn"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <span className="layout-header-title mobile-only">Clippy</span>
                </header>
                <div className="layout-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
