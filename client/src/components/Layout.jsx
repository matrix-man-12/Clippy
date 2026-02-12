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
                        ☰
                    </button>
                    <span className="layout-header-title mobile-only">📎 Clippy</span>
                </header>
                <div className="layout-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
