
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

import {
  decodeJwtPayload,
  isTokenExpired,
  getRoleFromAuthResponse,
  setAuthToken,
  clearAuthStorage,
  setAuthMessage,
  consumeAuthMessage,
  peekAuthMessage,
  apiRequest,
} from "../services/api";

function createToken(payload) {
  const encode = (value) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(value))))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  return `header.${encode(payload)}.signature`;
}

describe("API service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    setAuthToken(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    setAuthToken(null);
    window.history.replaceState({}, "", "/");
  });

  describe("decodeJwtPayload", () => {
    it("decodes a valid JWT payload", () => {
      const token = createToken({
        sub: "123",
        role: "Student",
      });

      expect(decodeJwtPayload(token)).toEqual({
        sub: "123",
        role: "Student",
      });
    });

    it("returns null for an empty or non-string token", () => {
      expect(decodeJwtPayload(null)).toBeNull();
      expect(decodeJwtPayload("")).toBeNull();
      expect(decodeJwtPayload(123)).toBeNull();
    });

    it("returns null for a token without a payload", () => {
      expect(decodeJwtPayload("header")).toBeNull();
    });

    it("returns null for an invalid JWT payload", () => {
      expect(
        decodeJwtPayload("header.invalid!.signature")
      ).toBeNull();
    });
  });

  describe("isTokenExpired", () => {
    it("returns true when the token has expired", () => {
      const token = createToken({
        exp: Math.floor(Date.now() / 1000) - 60,
      });

      expect(isTokenExpired(token)).toBe(true);
    });

    it("returns false when the token has not expired", () => {
      const token = createToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      expect(isTokenExpired(token)).toBe(false);
    });

    it("returns false when the token has no numeric expiration", () => {
      expect(isTokenExpired(createToken({}))).toBe(false);
      expect(
        isTokenExpired(createToken({ exp: "later" }))
      ).toBe(false);
    });
  });

  describe("getRoleFromAuthResponse", () => {
    it("gets the role from the response", () => {
      expect(
        getRoleFromAuthResponse({ role: "student" }, {})
      ).toBe("Student");
    });

    it("gets the role from the user object", () => {
      expect(
        getRoleFromAuthResponse(
          { user: { role: "teacher" } },
          {}
        )
      ).toBe("Teacher");
    });

    it("gets the role from the roles array", () => {
      expect(
        getRoleFromAuthResponse({ roles: ["Admin"] }, {})
      ).toBe("Admin");
    });

    it("gets the role from JWT role claims", () => {
      expect(
        getRoleFromAuthResponse({}, { role: "Teacher" })
      ).toBe("Teacher");
    });

    it("gets the role from the roles claim", () => {
      expect(
        getRoleFromAuthResponse({}, { roles: ["Admin"] })
      ).toBe("Admin");
    });

    it("gets the role from the Microsoft role claim", () => {
      expect(
        getRoleFromAuthResponse(
          {},
          {
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role":
              "Teacher",
          }
        )
      ).toBe("Teacher");
    });

    it("gets the role from the XML SOAP role claim", () => {
      expect(
        getRoleFromAuthResponse(
          {},
          {
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role":
              "Student",
          }
        )
      ).toBe("Student");
    });

    it("continues checking candidates when a role is invalid", () => {
      expect(
        getRoleFromAuthResponse(
          { role: 123, user: { role: "teacher" } },
          {}
        )
      ).toBe("Teacher");
    });

    it("returns null for an unsupported role", () => {
      expect(
        getRoleFromAuthResponse({ role: "Unknown" }, {})
      ).toBeNull();
    });

    it("returns null when no role is provided", () => {
      expect(getRoleFromAuthResponse({}, {})).toBeNull();
    });
  });

  describe("authentication storage and messages", () => {
    it("sets and clears the authentication token", () => {
      const token = createToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      setAuthToken(token);

      sessionStorage.setItem(
        "student-auth",
        JSON.stringify({ token })
      );

      clearAuthStorage();

      expect(
        sessionStorage.getItem("student-auth")
      ).toBeNull();
    });

    it("sets and peeks at an authentication message", () => {
      setAuthMessage("Please login again.");

      expect(peekAuthMessage()).toBe("Please login again.");
    });

    it("consumes and removes an authentication message", () => {
      setAuthMessage("Session expired.");

      expect(consumeAuthMessage()).toBe("Session expired.");
      expect(consumeAuthMessage()).toBeNull();
    });

    it("returns null when no authentication message exists", () => {
      expect(peekAuthMessage()).toBeNull();
      expect(consumeAuthMessage()).toBeNull();
    });

    it("replaces an existing authentication message", () => {
      setAuthMessage("First message");
      setAuthMessage("Second message");

      expect(peekAuthMessage()).toBe("Second message");
    });
  });

  describe("apiRequest", () => {
    it("throws an error when the API URL is not configured", async () => {
      if (import.meta.env.VITE_API_BASE_URL?.trim()) {
        return;
      }

      await expect(apiRequest("/Students")).rejects.toThrow(
        "API URL is not configured."
      );
    });

    it("sends a request with the configured API URL", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
        return;
      }

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({
          status: 200,
          ok: true,
        });

      await apiRequest("/Students", { auth: false });

      const baseUrl = import.meta.env.VITE_API_BASE_URL
        .trim()
        .replace(/\/+$/, "");

      expect(fetchSpy).toHaveBeenCalledWith(
        `${baseUrl}/api/Students`,
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
    });

    it("normalizes a path without a leading slash", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
        return;
      }

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({ status: 200, ok: true });

      await apiRequest("Students", { auth: false });

      const baseUrl = import.meta.env.VITE_API_BASE_URL
        .trim()
        .replace(/\/+$/, "");

      expect(fetchSpy).toHaveBeenCalledWith(
        `${baseUrl}/api/Students`,
        expect.any(Object)
      );
    });

    it("does not duplicate the api prefix", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
        return;
      }

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({ status: 200, ok: true });

      await apiRequest("/api/Students", { auth: false });

      const baseUrl = import.meta.env.VITE_API_BASE_URL
        .trim()
        .replace(/\/+$/, "");

      expect(fetchSpy).toHaveBeenCalledWith(
        `${baseUrl}/api/Students`,
        expect.any(Object)
      );
    });

    it("adds JSON content type when a request has a body", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
        return;
      }

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({
          status: 200,
          ok: true,
        });

      await apiRequest("/Users/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email: "test@example.com",
        }),
      });

      const headers = fetchSpy.mock.calls[0][1].headers;

      expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("preserves a supplied content type", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
        return;
      }

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({
          status: 200,
          ok: true,
        });

      await apiRequest("/Students", {
        auth: false,
        headers: { "Content-Type": "text/plain" },
        body: "test",
      });

      const headers = fetchSpy.mock.calls[0][1].headers;

      expect(headers.get("Content-Type")).toBe("text/plain");
    });

    it("preserves supplied headers", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
        return;
      }

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({ status: 200, ok: true });

      await apiRequest("/Students", {
        auth: false,
        headers: { "X-Test": "test-value" },
      });

      const headers = fetchSpy.mock.calls[0][1].headers;

      expect(headers.get("X-Test")).toBe("test-value");
    });

    it("adds a bearer token when authentication is enabled", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
        return;
      }

      const token = createToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      setAuthToken(token);

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({
          status: 200,
          ok: true,
        });

      await apiRequest("/Students");

      const headers = fetchSpy.mock.calls[0][1].headers;

      expect(headers.get("Authorization")).toBe(`Bearer ${token}`);
    });

    it("does not add authorization when authentication is disabled", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
        return;
      }

      setAuthToken(
        createToken({
          exp: Math.floor(Date.now() / 1000) + 3600,
        })
      );

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({ status: 200, ok: true });

      await apiRequest("/Students", { auth: false });

      const headers = fetchSpy.mock.calls[0][1].headers;

      expect(headers.has("Authorization")).toBe(false);
    });

    it("returns the response from fetch", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
        return;
      }

      const response = {
        status: 200,
        ok: true,
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

      await expect(
        apiRequest("/Students", { auth: false })
      ).resolves.toBe(response);
    });

    it("returns a 403 response", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
        return;
      }

      const response = {
        status: 403,
        ok: false,
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

      await expect(
        apiRequest("/Students", { auth: false })
      ).resolves.toBe(response);
    });

    // Additional authentication tests

    it("uses a valid token stored in sessionStorage", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) return;

      const token = createToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      sessionStorage.setItem(
        "student-auth",
        JSON.stringify({ token })
      );
      setAuthToken(null);

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({ status: 200, ok: true });

      await apiRequest("/Students");

      const headers = fetchSpy.mock.calls[0][1].headers;

      expect(headers.get("Authorization")).toBe(`Bearer ${token}`);
    });

    it("clears malformed authentication data", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) return;

      sessionStorage.setItem("student-auth", "{invalid-json");
      setAuthToken(null);

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({ status: 200, ok: true });

      await apiRequest("/Students");

      expect(sessionStorage.getItem("student-auth")).toBeNull();

      expect(
        fetchSpy.mock.calls[0][1].headers.get("Authorization")
      ).toBeNull();
    });

    it("clears an expired token stored in sessionStorage", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) return;

      const token = createToken({
        exp: Math.floor(Date.now() / 1000) - 3600,
      });

      sessionStorage.setItem(
        "student-auth",
        JSON.stringify({ token })
      );
      setAuthToken(null);

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        status: 200,
        ok: true,
      });

      await apiRequest("/Students");

      expect(sessionStorage.getItem("student-auth")).toBeNull();

      expect(peekAuthMessage()).toBe(
        "Your session has expired. Please login again."
      );
    });

    it("clears authentication after a 401 response", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) return;

      const token = createToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      sessionStorage.setItem(
        "student-auth",
        JSON.stringify({ token })
      );
      setAuthToken(token);

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        status: 401,
        ok: false,
      });

      await apiRequest("/Students");

      expect(sessionStorage.getItem("student-auth")).toBeNull();

      expect(peekAuthMessage()).toBe(
        "Your session has expired. Please login again."
      );
    });

    it("does not clear authentication for a 401 response when auth is disabled", async () => {
      if (!import.meta.env.VITE_API_BASE_URL?.trim()) return;

      const token = createToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      sessionStorage.setItem(
        "student-auth",
        JSON.stringify({ token })
      );
      setAuthToken(token);

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        status: 401,
        ok: false,
      });

      await apiRequest("/Students", { auth: false });

      expect(sessionStorage.getItem("student-auth")).toBe(
        JSON.stringify({ token })
      );

      expect(peekAuthMessage()).toBeNull();
    });
  });
});
