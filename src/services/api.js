const AUTH_STORAGE_KEY = "student-auth";
const AUTH_MESSAGE_KEY = "student-auth-message";
const ROLE_CLAIMS = [
    "role",
    "roles",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"
];

let authToken = null;

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
        const bytes = Uint8Array.from(atob(paddedBase64), (character) =>
            character.charCodeAt(0)
        );

        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return null;
    }
}

export function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    return typeof payload?.exp === "number" && payload.exp * 1000 <= Date.now();
}

function normalizeRole(value) {
    const role = Array.isArray(value) ? value[0] : value;
    if (typeof role !== "string") {
        return null;
    }

    return ["Student", "Teacher", "Admin"].find(
        (knownRole) => knownRole.toLowerCase() === role.toLowerCase()
    ) ?? null;
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

export function setAuthToken(token) {
    authToken = token || null;
}

function getCurrentAuthToken() {
    if (authToken) {
        return authToken;
    }

    if (typeof window === "undefined") {
        return null;
    }

    try {
        const storedAuth = JSON.parse(
            window.sessionStorage.getItem(AUTH_STORAGE_KEY) ?? "null"
        );

        if (storedAuth?.token && !isTokenExpired(storedAuth.token)) {
            authToken = storedAuth.token;
            return authToken;
        }

        if (storedAuth?.token) {
            clearAuthStorage();
            setAuthMessage("Your session has expired. Please login again.");
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

export function setAuthMessage(message) {
    if (typeof window !== "undefined") {
        window.sessionStorage.setItem(AUTH_MESSAGE_KEY, message);
    }
}

export function consumeAuthMessage() {
    if (typeof window === "undefined") {
        return null;
    }

    const message = window.sessionStorage.getItem(AUTH_MESSAGE_KEY);
    window.sessionStorage.removeItem(AUTH_MESSAGE_KEY);
    return message;
}

export function peekAuthMessage() {
    if (typeof window === "undefined") {
        return null;
    }

    return window.sessionStorage.getItem(AUTH_MESSAGE_KEY);
}

export async function apiRequest(path, options = {}) {
    const { auth = true, headers: suppliedHeaders, ...requestOptions } = options;
    const headers = new Headers(suppliedHeaders);
    const requestToken = auth ? getCurrentAuthToken() : null;

    if (requestOptions.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (requestToken) {
        headers.set("Authorization", `Bearer ${requestToken}`);
    }

   
const API_BASE_URL =
    "https://student-registration-api-yasaswi-e8ebencgfscjcecz.indiasouthcentral-01.azurewebsites.net";

const response = await fetch(
    `${API_BASE_URL}/api${path.startsWith("/") ? path : `/${path}`}`,
    {
        ...requestOptions,
        headers
    }
);

    if (response.status === 401 && requestToken) {
        clearAuthStorage();
        setAuthMessage("Your session has expired. Please login again.");
        window.location.assign("/login");
    } else if (response.status === 403 && window.location.pathname !== "/unauthorized") {
        window.location.assign("/unauthorized");
    }

    return response;
}