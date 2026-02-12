import { useAuth } from '@clerk/clerk-react';

const API_BASE = '/api';

async function request(path, options = {}, getToken) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (getToken) {
        const token = await getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
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
    const { getToken } = useAuth();

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
    };
}
