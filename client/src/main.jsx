import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={clerkPubKey}>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#3D2C1E',
              color: '#FDF6EC',
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>,
);
