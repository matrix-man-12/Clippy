const API_BASE = '/api';

const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

async function getClerkToken() {
    if (!hasClerk) return null;
    try {
        const { useAuth } = await import('@clerk/clerk-react');
        // Note: this won't work outside React — we'll use a different approach
        return null;
    } catch {
        return null;
    }
}

async function request(path, options = {}, getToken) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (getToken) {
        try {
            const token = await getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        } catch {
            // Token fetch failed — continue without auth
        }
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
    }

    return res.json();
}

// Custom hook that returns API methods with auth
export function useApi() {
    let getToken = () => Promise.resolve(null);

    if (hasClerk) {
        // We need to use useAuth inside a component context
        // This hook is only called from React components, so we can
        // try to access the Clerk context
        try {
            // Access the already-loaded clerk module
            const clerkReact = window.__clerk_react_module;
            if (clerkReact) {
                const { getToken: gt } = clerkReact.useAuth();
                getToken = gt;
            }
        } catch {
            // Clerk not ready yet
        }
    }

    const authed = (path, options) => request(path, options, getToken);
    const pub = (path, options) => request(path, options, null);

    return {
        // Clipboard items
        getItems: (params = {}) => {
            const query = new URLSearchParams();
            if (params.page) query.set('page', params.page);
            if (params.limit) query.set('limit', params.limit);
            if (params.type) query.set('type', params.type);
            if (params.favorites) query.set('favorites', 'true');
            if (params.from) query.set('from', params.from);
            if (params.to) query.set('to', params.to);
            const qs = query.toString();
            return authed(`/items${qs ? `?${qs}` : ''}`);
        },

        getItem: (id) => authed(`/items/${id}`),

        createItem: (data) => authed('/items', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

        updateItem: (id, data) => authed(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

        deleteItem: (id) => authed(`/items/${id}`, {
            method: 'DELETE',
        }),

        // Collections
        getCollections: () => authed('/collections'),

        createCollection: (name) => authed('/collections', {
            method: 'POST',
            body: JSON.stringify({ name }),
        }),

        inviteMember: (collectionId, email, permissionLevel = 'view') =>
            authed(`/collections/${collectionId}/members`, {
                method: 'POST',
                body: JSON.stringify({ email, permission_level: permissionLevel }),
            }),

        removeMember: (collectionId, userId) =>
            authed(`/collections/${collectionId}/members/${userId}`, {
                method: 'DELETE',
            }),

        addItemToCollection: (collectionId, itemId) =>
            authed(`/collections/${collectionId}/items`, {
                method: 'POST',
                body: JSON.stringify({ item_id: itemId }),
            }),

        getCollectionItems: (collectionId) =>
            authed(`/collections/${collectionId}/items`),

        // QR
        generateQR: (contentText) => authed('/qr/generate', {
            method: 'POST',
            body: JSON.stringify({ content_text: contentText }),
        }),

        getQRContent: (token) => pub(`/qr/${token}`),

        // Image upload — uses FormData (not JSON)
        uploadImage: async (file, expiryAt) => {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('content_type', 'image');
            if (expiryAt) formData.append('expiry_at', expiryAt);

            const headers = {};
            if (getToken) {
                try {
                    const token = await getToken();
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                } catch { /* no auth */ }
            }

            const res = await fetch(`${API_BASE}/items`, {
                method: 'POST',
                headers, // No Content-Type — browser sets multipart boundary
                body: formData,
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Upload failed: ${res.status}`);
            }

            return res.json();
        },

        // Image URL helper
        getImageUrl: (itemId) => `${API_BASE}/items/${itemId}/image`,

        // Sharing
        shareItem: (id) => authed(`/items/${id}/share`, { method: 'POST' }),

        unshareItem: (id) => authed(`/items/${id}/share`, { method: 'DELETE' }),

        getSharedNote: async (token) => {
            const res = await fetch(`${API_BASE}/share/${token}`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Not found');
            }
            return res.json();
        },
    };
}
