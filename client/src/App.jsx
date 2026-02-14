import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout.jsx';
import Vault from './pages/Vault.jsx';
import Favorites from './pages/Favorites.jsx';
import Collections from './pages/Collections.jsx';
import CollectionDetail from './pages/CollectionDetail.jsx';
import NoteDetail from './pages/NoteDetail.jsx';
import SharedNote from './pages/SharedNote.jsx';

const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Lazy-load auth pages so Clerk imports only happen when needed
const SignIn = lazy(() => import('./pages/SignIn.jsx'));
const SignUp = lazy(() => import('./pages/SignUp.jsx'));

function ProtectedRoute({ children }) {
  if (!hasClerk) return children;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public: shared notes — no auth, no sidebar */}
      <Route path="/s/:shareToken" element={<SharedNote />} />

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
        <Route path="/note/:id" element={<NoteDetail />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
