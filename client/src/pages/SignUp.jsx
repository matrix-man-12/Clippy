import { SignUp as ClerkSignUp } from '@clerk/clerk-react';
import './Auth.css';

export default function SignUp() {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>📎 Clippy</h1>
                    <p>Create your clipboard vault</p>
                </div>
                <ClerkSignUp
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
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
