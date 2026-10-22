import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    apiRequest,
    clearAuthStorage,
    decodeJwtPayload,
    getRoleFromAuthResponse,
    isTokenExpired,
    setAuthMessage,
    setAuthToken
} from "../services/api";
import { AuthContext } from "./auth-context";

const AUTH_STORAGE_KEY = "student-auth";

function readStoredAuth() {
    try {
        const storedAuth = JSON.parse(
            window.sessionStorage.getItem(AUTH_STORAGE_KEY) ?? "null"
        );

        if (!storedAuth?.token || !storedAuth?.role || isTokenExpired(storedAuth.token)) {
            if (storedAuth?.token && isTokenExpired(storedAuth.token)) {
                setAuthMessage("Your session has expired. Please login again.");
            }
            clearAuthStorage();
            return null;
        }

        return storedAuth;
    } catch {
        clearAuthStorage();
        return null;
    }
}

function createUser(data, claims, role) {
    const responseUser = data.user && typeof data.user === "object"
        ? data.user
        : {};

    return {
        id: responseUser.id ?? responseUser.userId ?? data.userId ?? claims?.sub ?? null,
        userId: responseUser.userId ?? data.userId ?? claims?.sub ?? null,
        email: responseUser.email ?? data.email ?? claims?.email ?? "",
        name: responseUser.name ?? responseUser.userName ?? data.name ?? claims?.name ?? "",
        role
    };
}

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [auth, setAuth] = useState(readStoredAuth);

    useEffect(() => {
        setAuthToken(auth?.token);
    }, [auth?.token]);

    useEffect(() => {
        if (!auth?.token) {
            return undefined;
        }

        const claims = decodeJwtPayload(auth.token);
        if (typeof claims?.exp !== "number") {
            return undefined;
        }

        const expireSession = () => {
            clearAuthStorage();
            setAuth(null);
            setAuthMessage("Your session has expired. Please login again.");
            navigate("/login", { replace: true });
        };

        let expirationTimer;
        const checkExpiration = () => {
            const expiresIn = claims.exp * 1000 - Date.now();
            if (expiresIn <= 0) {
                expireSession();
                return;
            }
            expirationTimer = window.setTimeout(
                checkExpiration,
                Math.min(expiresIn, 2147483647)
            );
        };

        expirationTimer = window.setTimeout(
            checkExpiration,
            Math.max(0, Math.min(claims.exp * 1000 - Date.now(), 2147483647))
        );

        return () => window.clearTimeout(expirationTimer);
    }, [auth?.token, navigate]);

    const login = useCallback(async (email, password) => {
        const response = await apiRequest("/Users/login", {
            method: "POST",
            auth: false,
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Invalid email or password.");
        }

        const data = await response.json();
        const token = data.token ?? data.accessToken ?? data.jwtToken;
        if (!token) {
            throw new Error("The login response did not include an access token.");
        }

        const claims = decodeJwtPayload(token);
        const role = getRoleFromAuthResponse(data, claims);
        if (!role) {
            throw new Error("The login response did not include a supported role.");
        }

        const nextAuth = {
            token,
            role,
            user: createUser(data, claims, role)
        };

        window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
        setAuthToken(token);
        setAuth(nextAuth);
return nextAuth;
}, []);

    function logout() {
        clearAuthStorage();
        setAuth(null);
        navigate("/login", { replace: true });
    }

   const value = useMemo(() => ({
    token: auth?.token ?? null,
    role: auth?.role ?? null,
    user: auth?.user ?? null,
    isAuthenticated: Boolean(auth?.token && auth?.role),
    login,
    logout
}), [auth, login, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
