
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";

vi.mock("../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Navbar", () => {
  const renderNavbar = (role, user = {}, logout = vi.fn(), path = "/") => {
    useAuth.mockReturnValue({ role, user, logout });

    return render(
      <MemoryRouter initialEntries={[path]}>
        <Navbar />
        <Routes>
          <Route path="*" element={<div>Page content</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders the portal brand and user name", () => {
    renderNavbar("Student", { name: "Jakka" });

    expect(screen.getByText("STUDENT PORTAL")).toBeTruthy();
    expect(screen.getByText("SIGNED IN AS")).toBeTruthy();
    expect(screen.getByText("Jakka")).toBeTruthy();
    expect(screen.getByText("Student")).toBeTruthy();
  });

  it("shows Student navigation links", () => {
    renderNavbar("Student", { name: "Jakka" });

    expect(
      screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")
    ).toBe("/student-dashboard");

    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows Teacher navigation links", () => {
    renderNavbar("Teacher", { name: "Ravi" });

    expect(
      screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")
    ).toBe("/teacher-dashboard");

    expect(
      screen.getByRole("link", { name: "Students" }).getAttribute("href")
    ).toBe("/teacher-students");

    expect(
      screen.getByRole("link", { name: "Profile" }).getAttribute("href")
    ).toBe("/teacher-profile");

    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("shows Admin navigation links", () => {
    renderNavbar("Admin", { name: "Admin User" });

    expect(
      screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")
    ).toBe("/admin-dashboard");

    expect(
      screen.getByRole("link", { name: "Manage Students" }).getAttribute("href")
    ).toBe("/admin-students");

    expect(
      screen.getByRole("link", { name: "Create Teacher" }).getAttribute("href")
    ).toBe("/admin-create-teacher");

    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("uses email when the user name is unavailable", () => {
    renderNavbar("Student", { email: "student@example.com" });

    expect(screen.getByText("student@example.com")).toBeTruthy();
  });

 it("uses the role when name and email are unavailable", () => {
  renderNavbar("Student", {});

  expect(screen.getAllByText("Student")).toHaveLength(2);
});

  it("calls logout when the Log out button is clicked", () => {
    const logout = vi.fn();

    renderNavbar("Student", { name: "Jakka" }, logout);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("renders no navigation links for an unknown role", () => {
    renderNavbar("Unknown", { name: "Test User" });

    expect(screen.queryByRole("link")).toBeNull();
    expect(
      screen.getByRole("navigation", { name: "Unknown navigation" })
    ).toBeTruthy();
  });

  it("marks the current navigation link as active", () => {
    renderNavbar("Student", { name: "Jakka" }, vi.fn(), "/student-dashboard");

    expect(
      screen.getByRole("link", { name: "Dashboard" }).className
    ).toContain("active");
  });
});
