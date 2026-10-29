
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
  const { pathname } = useLocation();
  return <div>Current path: {pathname}</div>;
}

function DashboardPage({ title }) {
  return (
    <>
      <div>{title}</div>
      <CurrentPath />
    </>
  );
}

function renderUnauthorized(authValue) {
  mockUseAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter initialEntries={["/unauthorized"]}>
      <Routes>
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/login"
          element={<DashboardPage title="Login Page" />}
        />
        <Route
          path="/admin-dashboard"
          element={<DashboardPage title="Admin Dashboard" />}
        />
        <Route
          path="/student-dashboard"
          element={<DashboardPage title="Student Dashboard" />}
        />
        <Route
          path="/teacher-dashboard"
          element={<DashboardPage title="Teacher Dashboard" />}
        />
      </Routes>
    </MemoryRouter>
  );
}

function returnToDashboard(authValue) {
  renderUnauthorized(authValue);
  fireEvent.click(
    screen.getByRole("button", { name: "Return to your dashboard" })
  );
}

describe("Unauthorized", () => {
  it("displays the access denied message", () => {
    renderUnauthorized({ isAuthenticated: false, role: null });

    expect(screen.getByText("Access Denied")).toBeTruthy();
    expect(
      screen.getByText("You do not have permission to access this page.")
    ).toBeTruthy();
  });

  it.each([
    ["unauthenticated users", false, null, "/login"],
    ["Admin users", true, "Admin", "/admin-dashboard"],
    ["Student users", true, "Student", "/student-dashboard"],
    ["Teacher users", true, "Teacher", "/teacher-dashboard"],
    ["users with an unknown role", true, "Unknown", "/login"],
  ])("navigates %s to the correct page", (_, isAuthenticated, role, path) => {
    returnToDashboard({ isAuthenticated, role });

    expect(screen.getByText(`Current path: ${path}`)).toBeTruthy();
  });
});
