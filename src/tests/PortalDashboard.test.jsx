
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PortalDashboard from "../pages/PortalDashboard";
import { useAuth } from "../context/useAuth";

vi.mock("../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PortalDashboard", () => {
  const defaultProps = {
    eyebrow: "Student Portal",
    title: "Welcome",
    description: "Manage your student details.",
    links: [
      {
        to: "/profile",
        label: "My Profile",
        description: "View your profile details.",
      },
      {
        to: "/courses",
        label: "My Courses",
        description: "View your courses.",
      },
    ],
  };

  it("renders the title, description, and eyebrow", () => {
    useAuth.mockReturnValue({
      user: { name: "Jakka" },
    });

    render(
      <MemoryRouter>
        <PortalDashboard {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByText("Student Portal")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Welcome, Jakka" })
    ).toBeTruthy();
    expect(
      screen.getByText("Manage your student details.")
    ).toBeTruthy();
  });

  it("renders dashboard links with correct destinations", () => {
    useAuth.mockReturnValue({ user: null });

    render(
      <MemoryRouter>
        <PortalDashboard {...defaultProps} />
      </MemoryRouter>
    );

    const profileLink = screen.getByRole("link", {
      name: /My Profile/,
    });
    const coursesLink = screen.getByRole("link", {
      name: /My Courses/,
    });

    expect(profileLink.getAttribute("href")).toBe("/profile");
    expect(coursesLink.getAttribute("href")).toBe("/courses");
    expect(
      screen.getByText("View your profile details.")
    ).toBeTruthy();
    expect(screen.getByText("View your courses.")).toBeTruthy();
  });

  it("does not render the eyebrow when it is not provided", () => {
    useAuth.mockReturnValue({ user: null });

    render(
      <MemoryRouter>
        <PortalDashboard
          {...defaultProps}
          eyebrow={undefined}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText("Student Portal")).toBeNull();
  });

  it("renders the title without a name when the user has no name", () => {
    useAuth.mockReturnValue({
      user: {},
    });

    render(
      <MemoryRouter>
        <PortalDashboard {...defaultProps} />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Welcome" })
    ).toBeTruthy();
  });

  it("does not render the link grid when links are empty", () => {
    useAuth.mockReturnValue({ user: null });

    render(
      <MemoryRouter>
        <PortalDashboard {...defaultProps} links={[]} />
      </MemoryRouter>
    );

    expect(screen.queryByRole("link")).toBeNull();
  });
});
