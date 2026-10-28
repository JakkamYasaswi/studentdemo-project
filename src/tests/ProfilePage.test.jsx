import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ProfilePage from "../pages/ProfilePage";

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

describe("ProfilePage", () => {
  it("renders the title and all profile details", () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: "Test Student",
        email: "student@example.com",
        userId: 101,
      },
      role: "Student",
    });

    render(<ProfilePage title="My Profile" />);

    expect(screen.getByRole("heading", { name: "My Profile" })).toBeTruthy();
    expect(screen.getByText("Test Student")).toBeTruthy();
    expect(screen.getByText("student@example.com")).toBeTruthy();
    expect(screen.getByText("101")).toBeTruthy();
    expect(screen.getByText("Student")).toBeTruthy();
  });

  it("uses the user id when userId is unavailable", () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: "Test Teacher",
        email: "teacher@example.com",
        id: 202,
      },
      role: "Teacher",
    });

    render(<ProfilePage title="Teacher Profile" />);

    expect(screen.getByText("202")).toBeTruthy();
  });

  it("hides profile fields when their values are missing", () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: "Test User",
        email: "",
      },
      role: "",
    });

    render(<ProfilePage title="Profile" />);

    expect(screen.getByText("Test User")).toBeTruthy();
    expect(screen.queryByText("Email")).toBeNull();
    expect(screen.queryByText("User ID")).toBeNull();
    expect(screen.queryByText("Role")).toBeNull();
  });

  it("renders the title when user information is unavailable", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      role: null,
    });

    render(<ProfilePage title="Profile Details" />);

    expect(screen.getByRole("heading", { name: "Profile Details" })).toBeTruthy();
    expect(document.querySelector(".profile-details").children.length).toBe(0);
  });
});