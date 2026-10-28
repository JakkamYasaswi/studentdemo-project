
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/useAuth";

vi.mock("../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

function LocationDisplay() {
  const location = useLocation();

  return <div data-testid="location">{location.pathname}</div>;
}

describe("ProtectedRoute component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      role: null,
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <div>Admin content</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <div>Login page</div>
                <LocationDisplay />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login page")).toBeTruthy();
    expect(screen.getByTestId("location").textContent).toBe("/login");
  });

  it("redirects users without an allowed role to unauthorized", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      role: "Student",
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <div>Admin content</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/unauthorized"
            element={<div>Unauthorized page</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Unauthorized page")).toBeTruthy();
    expect(screen.queryByText("Admin content")).toBeNull();
  });

  it("renders children for an authenticated user with an allowed role", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      role: "Admin",
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <div>Admin content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Admin content")).toBeTruthy();
  });

  it("renders children when allowedRoles is not provided", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      role: "Student",
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard content")).toBeTruthy();
  });

  it("renders Outlet when children are not provided", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      role: "Admin",
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/admin" element={<div>Outlet content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Outlet content")).toBeTruthy();
  });
});
