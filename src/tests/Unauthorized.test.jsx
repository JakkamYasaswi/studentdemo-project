import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import Unauthorized from "../pages/Unauthorized";

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

function CurrentPath() {
  const location = useLocation();
  return <div>Current path: {location.pathname}</div>;
}

function renderUnauthorized(authValue) {
  mockUseAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter initialEntries={["/unauthorized"]}>
      <Routes>
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/login" element={<><div>Login Page</div><CurrentPath /></>} />
        <Route path="/admin-dashboard" element={<><div>Admin Dashboard</div><CurrentPath /></>} />
        <Route path="/student-dashboard" element={<><div>Student Dashboard</div><CurrentPath /></>} />
        <Route path="/teacher-dashboard" element={<><div>Teacher Dashboard</div><CurrentPath /></>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Unauthorized", () => {
  it("displays the access denied message", () => {
    renderUnauthorized({ isAuthenticated: false, role: null });

    expect(screen.getByText("Access Denied")).toBeTruthy();
    expect(screen.getByText("You do not have permission to access this page.")).toBeTruthy();
  });

  it("navigates unauthenticated users to login", () => {
    renderUnauthorized({ isAuthenticated: false, role: null });

    fireEvent.click(screen.getByRole("button", { name: "Return to your dashboard" }));

    expect(screen.getByText("Current path: /login")).toBeTruthy();
  });

  it("navigates Admin users to the admin dashboard", () => {
    renderUnauthorized({ isAuthenticated: true, role: "Admin" });

    fireEvent.click(screen.getByRole("button", { name: "Return to your dashboard" }));

    expect(screen.getByText("Current path: /admin-dashboard")).toBeTruthy();
  });

  it("navigates Student users to the student dashboard", () => {
    renderUnauthorized({ isAuthenticated: true, role: "Student" });

    fireEvent.click(screen.getByRole("button", { name: "Return to your dashboard" }));

    expect(screen.getByText("Current path: /student-dashboard")).toBeTruthy();
  });

  it("navigates Teacher users to the teacher dashboard", () => {
    renderUnauthorized({ isAuthenticated: true, role: "Teacher" });

    fireEvent.click(screen.getByRole("button", { name: "Return to your dashboard" }));

    expect(screen.getByText("Current path: /teacher-dashboard")).toBeTruthy();
  });

  it("navigates authenticated users with an unknown role to login", () => {
    renderUnauthorized({ isAuthenticated: true, role: "Unknown" });

    fireEvent.click(screen.getByRole("button", { name: "Return to your dashboard" }));

    expect(screen.getByText("Current path: /login")).toBeTruthy();
  });
});