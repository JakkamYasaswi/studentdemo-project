import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import HomeRedirect from "../pages/HomeRedirect";

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock("../context/useAuth", () => ({
  useAuth: mockUseAuth,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderHomeRedirect(authValue) {
  mockUseAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/admin-dashboard" element={<div>Admin Dashboard</div>} />
        <Route path="/student-dashboard" element={<div>Student Dashboard</div>} />
        <Route path="/teacher-dashboard" element={<div>Teacher Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("HomeRedirect", () => {
  it("redirects unauthenticated users to login", () => {
    renderHomeRedirect({ isAuthenticated: false, role: "Admin" });

    expect(screen.getByText("Login Page")).toBeTruthy();
  });

  it.each([
    ["Admin", "Admin Dashboard"],
    ["Student", "Student Dashboard"],
    ["Teacher", "Teacher Dashboard"],
  ])(
    "redirects authenticated %s users to their dashboard",
    (role, dashboard) => {
      renderHomeRedirect({ isAuthenticated: true, role });

      expect(screen.getByText(dashboard)).toBeTruthy();
    }
  );

  it("redirects authenticated users with an unknown role to login", () => {
    renderHomeRedirect({ isAuthenticated: true, role: "Unknown" });

    expect(screen.getByText("Login Page")).toBeTruthy();
  });
});