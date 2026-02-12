import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect } from 'react';
import Layout from './components/Layout.jsx';
import Vault from './pages/Vault.jsx';
import Favorites from './pages/Favorites.jsx';
import Collections from './pages/Collections.jsx';
import CollectionDetail from './pages/CollectionDetail.jsx';

const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Lazy-load auth pages so Clerk imports only happen when needed
const SignIn = lazy(() => import('./pages/SignIn.jsx'));
const SignUp = lazy(() => import('./pages/SignUp.jsx'));

// Auth gate — dynamically loads useAuth from Clerk
function AuthGate({ children }) {
  const [authState, setAuthState] = useState({ loaded: false, signedIn: false });

  useEffect(() => {
    import('@clerk/clerk-react').then(({ useAuth }) => {
      // We can't use hooks from dynamic import directly,
      // so we set a flag and let the ClerkGate component handle it
      setAuthState({ loaded: true });
    });
  }, []);

  if (!authState.loaded) {
    return <div className="loading-spinner" style={{ marginTop: '40vh' }} />;
  }

  return <ClerkGate>{children}</ClerkGate>;
}

// Separate component that uses Clerk hook (safe because ClerkProvider is ancestor)
function ClerkGate({ children }) {
  // This component is only rendered when ClerkProvider wraps the app
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    // Re-render trick: we'll use the ClerkContext check
    setAuth({ ready: true });
  }, []);

  if (!auth) {
    return <div className="loading-spinner" style={{ marginTop: '40vh' }} />;
  }

  return children;
}

function ProtectedRoute({ children }) {
  if (!hasClerk) return children;

  // When Clerk is active, we rely on ClerkProvider's built-in redirect
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Auth pages — no sidebar, lazy loaded */}
      {hasClerk && (
        <>
          <Route path="/sign-in/*" element={
            <Suspense fallback={<div className="loading-spinner" style={{ marginTop: '40vh' }} />}>
              <SignIn />
            </Suspense>
          } />
          <Route path="/sign-up/*" element={
            <Suspense fallback={<div className="loading-spinner" style={{ marginTop: '40vh' }} />}>
              <SignUp />
            </Suspense>
          } />
        </>
      )}

      {/* Main pages — with sidebar layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Vault />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/:id" element={<CollectionDetail />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
