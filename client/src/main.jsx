import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

async function mount() {
  const app = (
    <BrowserRouter>
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
    </BrowserRouter>
  );

  let content;

  if (clerkPubKey) {
    // Dynamically import Clerk only when key exists
    const { ClerkProvider } = await import('@clerk/clerk-react');
    content = (
      <ClerkProvider publishableKey={clerkPubKey}>
        {app}
      </ClerkProvider>
    );
  } else {
    console.warn('VITE_CLERK_PUBLISHABLE_KEY not set. Running without auth.');
    content = app;
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      {content}
    </StrictMode>,
  );
}

mount();
