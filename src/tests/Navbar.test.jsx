
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
  function renderNavbar(role, user = {}, logout = vi.fn(), path = "/") {
    useAuth.mockReturnValue({ role, user, logout });

    return render(
      <MemoryRouter initialEntries={[path]}>
        <Navbar />
        <Routes>
          <Route path="*" element={<div>Page content</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  function expectLinks(links) {
  links.forEach(([name, href]) => {
    expect(
      screen.getByRole("link", { name }).getAttribute("href")
    ).toBe(href);
  });

  expect(screen.getAllByRole("link")).toHaveLength(links.length);
}

  it("renders the portal brand and user name", () => {
    renderNavbar("Student", { name: "Jakka" });

    ["STUDENT PORTAL", "SIGNED IN AS", "Jakka", "Student"].forEach((text) => {
      expect(screen.getByText(text)).toBeTruthy();
    });
  });

  it.each([
    [
      "Student",
      { name: "Jakka" },
      [["Dashboard", "/student-dashboard"]],
    ],
    [
      "Teacher",
      { name: "Ravi" },
      [
        ["Dashboard", "/teacher-dashboard"],
        ["Students", "/teacher-students"],
        ["Profile", "/teacher-profile"],
      ],
    ],
    [
      "Admin",
      { name: "Admin User" },
      [
        ["Dashboard", "/admin-dashboard"],
        ["Manage Students", "/admin-students"],
        ["Create Teacher", "/admin-create-teacher"],
      ],
    ],
  ])("shows the correct %s navigation links", (role, user, links) => {
    renderNavbar(role, user);
    expectLinks(links);
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
