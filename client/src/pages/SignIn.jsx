import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import './Auth.css';

export default function SignIn() {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>📎 Clippy</h1>
                    <p>Your cross-device clipboard vault</p>
                </div>
                <ClerkSignIn
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    appearance={{
                        variables: {
                            colorPrimary: '#C4956A',
                            colorBackground: '#FDF6EC',
                            colorInputBackground: '#FFFFFF',
                            colorText: '#3D2C1E',
                            borderRadius: '8px',
                            fontFamily: 'Inter, sans-serif',
                        },
                    }}
                />
            </div>
        </div>
    );
}
