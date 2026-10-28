
import { useContext } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  act,
  cleanup,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { AuthProvider } from "../context/AuthContext";
import { AuthContext } from "../context/auth-context";

import {
  apiRequest,
  clearAuthStorage,
  decodeJwtPayload,
  getRoleFromAuthResponse,
  isTokenExpired,
  setAuthMessage,
  setAuthToken,
} from "../services/api";

vi.mock("../services/api", () => ({
  apiRequest: vi.fn(),
  clearAuthStorage: vi.fn(),
  decodeJwtPayload: vi.fn(),
  getRoleFromAuthResponse: vi.fn(),
  isTokenExpired: vi.fn(),
  setAuthMessage: vi.fn(),
  setAuthToken: vi.fn(),
}));

let contextValue;

function TestConsumer() {
  const auth = useContext(AuthContext);

  contextValue = auth;

  return (
    <div>
      <div data-testid="token">{auth.token ?? ""}</div>
      <div data-testid="role">{auth.role ?? ""}</div>
      <div data-testid="email">{auth.user?.email ?? ""}</div>
      <div data-testid="user-id">{auth.user?.id ?? ""}</div>
      <div data-testid="name">{auth.user?.name ?? ""}</div>
      <div data-testid="authenticated">
        {String(auth.isAuthenticated)}
      </div>

      <button
        onClick={() =>
          auth.login("test@example.com", "password123")
        }
      >
        Login
      </button>

      <button onClick={auth.logout}>Logout</button>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    </MemoryRouter>
  );
}

function saveSession(session) {
  window.sessionStorage.setItem(
    "student-auth",
    JSON.stringify(session)
  );
}

function mockSuccessfulLogin(data = {}) {
  apiRequest.mockResolvedValue({
    ok: true,
    json: async () => ({
      token: "test-token",
      ...data,
    }),
  });

  decodeJwtPayload.mockReturnValue({});
  getRoleFromAuthResponse.mockReturnValue("Student");
}

async function loginAndUpdate(
  email = "test@example.com",
  password = "password123"
) {
  await act(async () => {
    await contextValue.login(email, password);
  });
}

beforeEach(() => {
  contextValue = null;
  window.sessionStorage.clear();

  vi.clearAllMocks();

  isTokenExpired.mockReturnValue(false);
  decodeJwtPayload.mockReturnValue({});
  getRoleFromAuthResponse.mockReturnValue("Student");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("AuthProvider", () => {
  it("starts unauthenticated when no saved session exists", () => {
    renderAuthProvider();

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(contextValue.token).toBeNull();
    expect(contextValue.role).toBeNull();
    expect(contextValue.user).toBeNull();
  });

  it("clears an expired stored session", () => {
    saveSession({
      token: "expired-token",
      role: "Student",
      user: { email: "test@example.com" },
    });

    isTokenExpired.mockReturnValue(true);

    renderAuthProvider();

    expect(contextValue.isAuthenticated).toBe(false);
    expect(clearAuthStorage).toHaveBeenCalled();
    expect(setAuthMessage).toHaveBeenCalledWith(
      "Your session has expired. Please login again."
    );
  });

  it("clears invalid stored session data", () => {
    window.sessionStorage.setItem(
      "student-auth",
      "{invalid-json"
    );

    renderAuthProvider();

    expect(contextValue.isAuthenticated).toBe(false);
    expect(clearAuthStorage).toHaveBeenCalled();
  });

  it("clears a stored session without a token", () => {
    saveSession({
      role: "Student",
      user: { email: "test@example.com" },
    });

    renderAuthProvider();

    expect(contextValue.isAuthenticated).toBe(false);
    expect(clearAuthStorage).toHaveBeenCalled();
  });

  it("clears a stored session without a role", () => {
    saveSession({
      token: "test-token",
      user: { email: "test@example.com" },
    });

    renderAuthProvider();

    expect(contextValue.isAuthenticated).toBe(false);
    expect(clearAuthStorage).toHaveBeenCalled();
  });

  it("restores a valid stored session", () => {
    saveSession({
      token: "saved-token",
      role: "Student",
      user: {
        id: 1,
        email: "saved@example.com",
        name: "Saved User",
      },
    });

    renderAuthProvider();

    expect(contextValue.token).toBe("saved-token");
    expect(contextValue.role).toBe("Student");
    expect(contextValue.user.email).toBe("saved@example.com");
    expect(contextValue.isAuthenticated).toBe(true);
  });

  it("logs in and saves the session", async () => {
    mockSuccessfulLogin({
      user: {
        id: 1,
        email: "test@example.com",
        name: "Test User",
      },
    });

    renderAuthProvider();

    await loginAndUpdate();

    expect(contextValue.token).toBe("test-token");
    expect(contextValue.role).toBe("Student");
    expect(contextValue.user.email).toBe("test@example.com");
    expect(contextValue.isAuthenticated).toBe(true);
    expect(setAuthToken).toHaveBeenCalledWith("test-token");

    expect(
      JSON.parse(window.sessionStorage.getItem("student-auth"))
    ).toMatchObject({
      token: "test-token",
      role: "Student",
    });
  });

  it("throws an error when login response is unsuccessful", async () => {
    apiRequest.mockResolvedValue({
      ok: false,
      text: async () => "Invalid credentials",
    });

    renderAuthProvider();

    await expect(
      act(async () => {
        await contextValue.login(
          "test@example.com",
          "wrong-password"
        );
      })
    ).rejects.toThrow("Invalid credentials");
  });

  it("uses the default error when an unsuccessful response has no message", async () => {
    apiRequest.mockResolvedValue({
      ok: false,
      text: async () => "",
    });

    renderAuthProvider();

    await expect(
      contextValue.login(
        "test@example.com",
        "wrong-password"
      )
    ).rejects.toThrow("Invalid email or password.");
  });

  it("throws an error when the response has no token", async () => {
    apiRequest.mockResolvedValue({
      ok: true,
      json: async () => ({
        role: "Student",
      }),
    });

    renderAuthProvider();

    await expect(
      contextValue.login(
        "test@example.com",
        "password123"
      )
    ).rejects.toThrow(
      "The login response did not include an access token."
    );
  });

  it("accepts the accessToken field", async () => {
    apiRequest.mockResolvedValue({
      ok: true,
      json: async () => ({
        accessToken: "access-token",
      }),
    });

    renderAuthProvider();

    await loginAndUpdate();

    expect(contextValue.token).toBe("access-token");
    expect(setAuthToken).toHaveBeenCalledWith("access-token");
  });

  it("accepts the jwtToken field", async () => {
    apiRequest.mockResolvedValue({
      ok: true,
      json: async () => ({
        jwtToken: "jwt-token",
      }),
    });

    renderAuthProvider();

    await loginAndUpdate();

    expect(contextValue.token).toBe("jwt-token");
  });

  it("throws an error when the response has no supported role", async () => {
    mockSuccessfulLogin();
    getRoleFromAuthResponse.mockReturnValue(null);

    renderAuthProvider();

    await expect(
      contextValue.login(
        "test@example.com",
        "password123"
      )
    ).rejects.toThrow(
      "The login response did not include a supported role."
    );
  });

  it("creates user details from top-level response fields", async () => {
    apiRequest.mockResolvedValue({
      ok: true,
      json: async () => ({
        token: "test-token",
        userId: 25,
        email: "top@example.com",
        name: "Top User",
      }),
    });

    renderAuthProvider();

    await loginAndUpdate();

    expect(contextValue.user).toEqual({
      id: 25,
      userId: 25,
      email: "top@example.com",
      name: "Top User",
      role: "Student",
    });
  });

  it("uses userId and userName from the user object", async () => {
    mockSuccessfulLogin({
      user: {
        userId: 45,
        email: "user@example.com",
        userName: "User Name",
      },
    });

    renderAuthProvider();

    await loginAndUpdate();

    expect(contextValue.user).toEqual({
      id: 45,
      userId: 45,
      email: "user@example.com",
      name: "User Name",
      role: "Student",
    });
  });

  it("uses JWT claims when user fields are missing", async () => {
    mockSuccessfulLogin({ user: {} });

    decodeJwtPayload.mockReturnValue({
      sub: "99",
      email: "claims@example.com",
      name: "JWT User",
    });

    renderAuthProvider();

    await loginAndUpdate();

    expect(contextValue.user).toEqual({
      id: "99",
      userId: "99",
      email: "claims@example.com",
      name: "JWT User",
      role: "Student",
    });
  });

  it("uses empty strings when email and name are unavailable", async () => {
    mockSuccessfulLogin({ user: {} });
    decodeJwtPayload.mockReturnValue({});

    renderAuthProvider();

    await loginAndUpdate();

    expect(contextValue.user.email).toBe("");
    expect(contextValue.user.name).toBe("");
  });

  it("handles a non-object user field", async () => {
    mockSuccessfulLogin({
      user: "not-an-object",
      userId: 77,
      email: "fallback@example.com",
      name: "Fallback User",
    });

    renderAuthProvider();

    await loginAndUpdate();

    expect(contextValue.user.id).toBe(77);
    expect(contextValue.user.email).toBe("fallback@example.com");
    expect(contextValue.user.name).toBe("Fallback User");
  });

  it("logs out and clears the session", () => {
    saveSession({
      token: "saved-token",
      role: "Student",
      user: { email: "test@example.com" },
    });

    renderAuthProvider();

    act(() => {
      contextValue.logout();
    });

    expect(contextValue.isAuthenticated).toBe(false);
    expect(contextValue.token).toBeNull();
    expect(clearAuthStorage).toHaveBeenCalled();
  });

  it("does not schedule a timer when the token has no numeric expiration", () => {
    vi.useFakeTimers();

    saveSession({
      token: "saved-token",
      role: "Student",
      user: {},
    });

    decodeJwtPayload.mockReturnValue({});

    renderAuthProvider();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("schedules a timer for a token with an expiration", () => {
    vi.useFakeTimers();

    saveSession({
      token: "saved-token",
      role: "Student",
      user: {},
    });

    decodeJwtPayload.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    renderAuthProvider();

    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });

  it("cleans up the expiration timer when the provider unmounts", () => {
    vi.useFakeTimers();

    saveSession({
      token: "saved-token",
      role: "Student",
      user: {},
    });

    decodeJwtPayload.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    const { unmount } = renderAuthProvider();

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("expires the session and clears authentication when the timer fires", async () => {
    vi.useFakeTimers();

    const expiration = Math.floor(Date.now() / 1000) + 10;

    saveSession({
      token: "saved-token",
      role: "Student",
      user: {},
    });

    decodeJwtPayload.mockReturnValue({ exp: expiration });

    renderAuthProvider();

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    expect(clearAuthStorage).toHaveBeenCalled();
    expect(setAuthMessage).toHaveBeenCalledWith(
      "Your session has expired. Please login again."
    );
    expect(contextValue.isAuthenticated).toBe(false);
  });

  it("clears the expiration timer when the user logs out", async () => {
    vi.useFakeTimers();

    saveSession({
      token: "saved-token",
      role: "Student",
      user: {},
    });

    decodeJwtPayload.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    renderAuthProvider();

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    await act(async () => {
      contextValue.logout();
    });

    expect(contextValue.isAuthenticated).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
