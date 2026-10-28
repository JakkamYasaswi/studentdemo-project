
const AUTH_STORAGE_KEY = "student-auth";
const AUTH_MESSAGE_KEY = "student-auth-message";

const ROLE_CLAIMS = [
    "role",
    "roles",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"
];

// =========================================================
// API CONFIGURATION
// =========================================================

// Set VITE_API_BASE_URL in your root .env file.
// The URL should NOT end with /api.
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || ""
).trim().replace(/\/+$/, "");

let authToken = null;

// =========================================================
// JWT HELPERS
// =========================================================

export function decodeJwtPayload(token) {
    if (!token || typeof token !== "string") {
        return null;
    }

    try {
        const encodedPayload = token.split(".")[1];

        if (!encodedPayload) {
            return null;
        }

        const base64 = encodedPayload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const paddedBase64 = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "="
        );

        const bytes = Uint8Array.from(
            atob(paddedBase64),
            (character) => character.charCodeAt(0)
        );

        return JSON.parse(
            new TextDecoder().decode(bytes)
        );
    } catch {
        return null;
    }
}

export function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);

    return (
        typeof payload?.exp === "number" &&
        payload.exp * 1000 <= Date.now()
    );
}

// =========================================================
// ROLE HELPERS
// =========================================================

function normalizeRole(value) {
    const role = Array.isArray(value) ? value[0] : value;

    if (typeof role !== "string") {
        return null;
    }

    return (
        ["Student", "Teacher", "Admin"].find(
            (knownRole) =>
                knownRole.toLowerCase() === role.toLowerCase()
        ) ?? null
    );
}

export function getRoleFromAuthResponse(data, claims) {
    const candidates = [
        data?.role,
        data?.user?.role,
        data?.roles,
        ...ROLE_CLAIMS.map((claim) => claims?.[claim])
    ];

    for (const candidate of candidates) {
        const role = normalizeRole(candidate);

        if (role) {
            return role;
        }
    }

    return null;
}

// =========================================================
// AUTH TOKEN MANAGEMENT
// =========================================================

export function setAuthToken(token) {
    authToken = token || null;
}

function getCurrentAuthToken() {
    if (authToken) {
        if (!isTokenExpired(authToken)) {
            return authToken;
        }

        clearAuthStorage();
        setAuthMessage(
            "Your session has expired. Please login again."
        );

        if (typeof window !== "undefined") {
            window.location.assign("/login");
        }

        return null;
    }

    if (typeof window === "undefined") {
        return null;
    }

    try {
        const storedAuth = JSON.parse(
            window.sessionStorage.getItem(AUTH_STORAGE_KEY) ?? "null"
        );

        if (
            storedAuth?.token &&
            !isTokenExpired(storedAuth.token)
        ) {
            authToken = storedAuth.token;
            return authToken;
        }

        if (storedAuth?.token) {
            clearAuthStorage();

            setAuthMessage(
                "Your session has expired. Please login again."
            );

            window.location.assign("/login");
        }
    } catch {
        clearAuthStorage();
    }

    return null;
}

export function clearAuthStorage() {
    authToken = null;

    if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
}

// =========================================================
// AUTH MESSAGES
// =========================================================

export function setAuthMessage(message) {
    if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
            AUTH_MESSAGE_KEY,
            message
        );
    }
}

export function consumeAuthMessage() {
    if (typeof window === "undefined") {
        return null;
    }

    const message = window.sessionStorage.getItem(
        AUTH_MESSAGE_KEY
    );

    window.sessionStorage.removeItem(AUTH_MESSAGE_KEY);

    return message;
}

export function peekAuthMessage() {
    if (typeof window === "undefined") {
        return null;
    }

    return window.sessionStorage.getItem(AUTH_MESSAGE_KEY);
}

// =========================================================
// API REQUEST
// =========================================================

export async function apiRequest(path, options = {}) {
    const {
        auth = true,
        headers: suppliedHeaders,
        ...requestOptions
    } = options;

    if (!API_BASE_URL) {
        throw new Error(
            "API URL is not configured. Set VITE_API_BASE_URL in your .env file and in your GitHub Actions build environment."
        );
    }

    const headers = new Headers(suppliedHeaders);
    const requestToken = auth ? getCurrentAuthToken() : null;

    if (
        requestOptions.body &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    if (requestToken) {
        headers.set(
            "Authorization",
            `Bearer ${requestToken}`
        );
    }

    // Build the API URL without creating /api/api/.
    const normalizedPath = path.startsWith("/")
        ? path
        : `/${path}`;

    const apiPath = normalizedPath.startsWith("/api/")
        ? normalizedPath
        : `/api${normalizedPath}`;

    const requestUrl = `${API_BASE_URL}${apiPath}`;

    const response = await fetch(requestUrl, {
        ...requestOptions,
        headers
    });

    if (response.status === 401 && requestToken) {
        clearAuthStorage();

        setAuthMessage(
            "Your session has expired. Please login again."
        );

        if (typeof window !== "undefined") {
            window.location.assign("/login");
        }
    } else if (
        response.status === 403 &&
        typeof window !== "undefined" &&
        window.location.pathname !== "/unauthorized"
    ) {
        window.location.assign("/unauthorized");
    }

    return response;
}
