import { useState, useEffect } from 'react';
import './Account.css';

const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function Account() {
    const [UserProfile, setUserProfile] = useState(null);

    useEffect(() => {
        if (hasClerk) {
            import('@clerk/clerk-react').then((mod) => {
                setUserProfile(() => mod.UserProfile);
            });
        }
    }, []);

    if (!hasClerk) {
        return (
            <div className="page-container">
                <h2 className="page-title">Account</h2>
                <div className="account-dev-mode">
                    <div className="account-dev-icon">⚡</div>
                    <h3>Development Mode</h3>
                    <p>Authentication is disabled. Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in your <code>.env</code> to enable Clerk.</p>
                </div>
            </div>
        );
    }

    if (!UserProfile) {
        return (
            <div className="page-container">
                <h2 className="page-title">Account</h2>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="page-container account-page">
            <h2 className="page-title">Account</h2>
            <div className="account-profile-wrapper">
                <UserProfile
                    appearance={{
                        variables: {
                            colorPrimary: '#E8A849',
                            colorBackground: '#161A23',
                            colorText: '#E4E2DE',
                            colorTextSecondary: '#9B978F',
                            colorInputBackground: '#1A1F2B',
                            colorInputText: '#E4E2DE',
                            borderRadius: '14px',
                            fontFamily: '"Outfit", sans-serif',
                        },
                        elements: {
                            rootBox: {
                                width: '100%',
                            },
                            card: {
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                border: '1px solid #252A36',
                                width: '100%',
                            },
                            navbar: {
                                background: '#121620',
                                borderRight: '1px solid #252A36',
                            },
                            navbarButton: {
                                color: '#9B978F',
                            },
                            navbarButton__active: {
                                color: '#E8A849',
                                background: 'rgba(232, 168, 73, 0.1)',
                            },
                            scrollBox: {
                                background: '#161A23',
                                borderTopLeftRadius: '0',
                                borderBottomLeftRadius: '0',
                            },
                            pageScrollBox: {
                                background: '#161A23',
                            },
                            headerTitle: { color: '#E4E2DE' },
                            headerSubtitle: { color: '#9B978F' },
                            socialButtonsIconButton: {
                                background: '#1A1F2B',
                                border: '1px solid #252A36',
                            },
                            userButtonPopoverCard: {
                                background: '#161A23',
                                border: '1px solid #252A36',
                            },
                            formButtonPrimary: {
                                background: '#E8A849',
                                color: '#0D0F14',
                                textTransform: 'none',
                                fontWeight: '600',
                            },
                            footer: {
                                display: 'none',
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
}
