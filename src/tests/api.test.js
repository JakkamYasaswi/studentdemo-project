
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

function hasApiBaseUrl() {
  return Boolean(import.meta.env.VITE_API_BASE_URL?.trim());
}

function mockSuccessfulFetch() {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    status: 200,
    ok: true,
  });
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, "");
}

function expectAuthorizationHeader(fetchSpy, expectedValue) {
  const headers = fetchSpy.mock.calls[0][1].headers;
  expect(headers.get("Authorization")).toBe(expectedValue);
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
      const token = createToken({ sub: "123", role: "Student" });

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
      expect(decodeJwtPayload("header.invalid!.signature")).toBeNull();
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
      expect(isTokenExpired(createToken({ exp: "later" }))).toBe(false);
    });
  });

  describe("getRoleFromAuthResponse", () => {
    it.each([
      ["response role", { role: "student" }, {}, "Student"],
      ["user object role", { user: { role: "teacher" } }, {}, "Teacher"],
      ["roles array", { roles: ["Admin"] }, {}, "Admin"],
      ["JWT role claim", {}, { role: "Teacher" }, "Teacher"],
      ["JWT roles claim", {}, { roles: ["Admin"] }, "Admin"],
      [
        "Microsoft role claim",
        {},
        {
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role":
            "Teacher",
        },
        "Teacher",
      ],
      [
        "XML SOAP role claim",
        {},
        {
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role":
            "Student",
        },
        "Student",
      ],
      [
        "valid candidate after an invalid role",
        { role: 123, user: { role: "teacher" } },
        {},
        "Teacher",
      ],
    ])("gets the role from the %s", (_description, response, claims, role) => {
      expect(getRoleFromAuthResponse(response, claims)).toBe(role);
    });

    it("returns null for an unsupported role", () => {
      expect(getRoleFromAuthResponse({ role: "Unknown" }, {})).toBeNull();
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
      sessionStorage.setItem("student-auth", JSON.stringify({ token }));
      clearAuthStorage();

      expect(sessionStorage.getItem("student-auth")).toBeNull();
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
      if (hasApiBaseUrl()) return;

      await expect(apiRequest("/Students")).rejects.toThrow(
        "API URL is not configured."
      );
    });

    it("sends a request with the configured API URL", async () => {
      if (!hasApiBaseUrl()) return;

      const fetchSpy = mockSuccessfulFetch();

      await apiRequest("/Students", { auth: false });

      expect(fetchSpy).toHaveBeenCalledWith(
        `${getApiBaseUrl()}/api/Students`,
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
    });

    it.each([
      ["normalizes a path without a leading slash", "Students", "/api/Students"],
      ["does not duplicate the api prefix", "/api/Students", "/api/Students"],
    ])("%s", async (_description, path, expectedPath) => {
      if (!hasApiBaseUrl()) return;

      const fetchSpy = mockSuccessfulFetch();

      await apiRequest(path, { auth: false });

      expect(fetchSpy).toHaveBeenCalledWith(
        `${getApiBaseUrl()}${expectedPath}`,
        expect.any(Object)
      );
    });

    it("adds JSON content type when a request has a body", async () => {
      if (!hasApiBaseUrl()) return;

      const fetchSpy = mockSuccessfulFetch();

      await apiRequest("/Users/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email: "test@example.com" }),
      });

      const headers = fetchSpy.mock.calls[0][1].headers;
      expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("preserves a supplied content type", async () => {
      if (!hasApiBaseUrl()) return;

      const fetchSpy = mockSuccessfulFetch();

      await apiRequest("/Students", {
        auth: false,
        headers: { "Content-Type": "text/plain" },
        body: "test",
      });

      const headers = fetchSpy.mock.calls[0][1].headers;
      expect(headers.get("Content-Type")).toBe("text/plain");
    });

    it("preserves supplied headers", async () => {
      if (!hasApiBaseUrl()) return;

      const fetchSpy = mockSuccessfulFetch();

      await apiRequest("/Students", {
        auth: false,
        headers: { "X-Test": "test-value" },
      });

      const headers = fetchSpy.mock.calls[0][1].headers;
      expect(headers.get("X-Test")).toBe("test-value");
    });

    it("adds a bearer token when authentication is enabled", async () => {
      if (!hasApiBaseUrl()) return;

      const token = createToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      setAuthToken(token);
      const fetchSpy = mockSuccessfulFetch();

      await apiRequest("/Students");

      expectAuthorizationHeader(fetchSpy, `Bearer ${token}`);
    });

    it("does not add authorization when authentication is disabled", async () => {
      if (!hasApiBaseUrl()) return;

      setAuthToken(
        createToken({ exp: Math.floor(Date.now() / 1000) + 3600 })
      );

      const fetchSpy = mockSuccessfulFetch();

      await apiRequest("/Students", { auth: false });

      expectAuthorizationHeader(fetchSpy, null);
    });

    it.each([
      ["returns the response from fetch", 200, true],
      ["returns a 403 response", 403, false],
    ])("%s", async (_description, status, ok) => {
      if (!hasApiBaseUrl()) return;

      const response = { status, ok };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

      await expect(
        apiRequest("/Students", { auth: false })
      ).resolves.toBe(response);
    });

    it("uses a valid token stored in sessionStorage", async () => {
      if (!hasApiBaseUrl()) return;

      const token = createToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      sessionStorage.setItem("student-auth", JSON.stringify({ token }));
      setAuthToken(null);

      const fetchSpy = mockSuccessfulFetch();

      await apiRequest("/Students");

      expectAuthorizationHeader(fetchSpy, `Bearer ${token}`);
    });

    it("clears malformed authentication data", async () => {
      if (!hasApiBaseUrl()) return;

      sessionStorage.setItem("student-auth", "{invalid-json");
      setAuthToken(null);

      const fetchSpy = mockSuccessfulFetch();

      await apiRequest("/Students");

      expect(sessionStorage.getItem("student-auth")).toBeNull();
      expectAuthorizationHeader(fetchSpy, null);
    });

    it("clears an expired token stored in sessionStorage", async () => {
      if (!hasApiBaseUrl()) return;

      const token = createToken({
        exp: Math.floor(Date.now() / 1000) - 3600,
      });

      sessionStorage.setItem("student-auth", JSON.stringify({ token }));
      setAuthToken(null);
      mockSuccessfulFetch();

      await apiRequest("/Students");

      expect(sessionStorage.getItem("student-auth")).toBeNull();
      expect(peekAuthMessage()).toBe(
        "Your session has expired. Please login again."
      );
    });

    it("clears authentication after a 401 response", async () => {
      if (!hasApiBaseUrl()) return;

      const token = createToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      sessionStorage.setItem("student-auth", JSON.stringify({ token }));
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
      if (!hasApiBaseUrl()) return;

      const token = createToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      sessionStorage.setItem("student-auth", JSON.stringify({ token }));
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
