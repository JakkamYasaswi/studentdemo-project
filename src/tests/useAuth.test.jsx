
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { AuthContext } from "../context/auth-context";
import { useAuth } from "../context/useAuth";

describe("useAuth", () => {
  it("returns the authentication context when it exists", () => {
    const mockAuth = {
      token: "test-token",
      role: "Student",
      user: { email: "test@example.com" },
      isAuthenticated: true,
    };

    const wrapper = ({ children }) => (
      <AuthContext.Provider value={mockAuth}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBe(mockAuth);
    expect(result.current.token).toBe("test-token");
    expect(result.current.role).toBe("Student");
  });

  it("throws an error when used outside AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used inside an AuthProvider."
    );
  });
});
