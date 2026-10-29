
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TeacherDashboard from "../TeacherDashboard";
import PortalDashboardMock from "./PortalDashboardMock";

vi.mock("../pages/PortalDashboard", async () => {
  const { default: PortalDashboardMock } = await import(
    "./PortalDashboardMock"
  );

  return { default: PortalDashboardMock };
});

afterEach(() => {
  cleanup();
});

describe("TeacherDashboard", () => {
  it("renders the welcome title, description, and Students and Profile links", () => {
    render(<TeacherDashboard />);

    expect(
      screen.getByRole("heading", { name: "Welcome" })
    ).toBeTruthy();

    expect(
      screen.getByText(
        "Your teaching workspace and authorized student resources."
      )
    ).toBeTruthy();

    expect(screen.getByText("Students")).toBeTruthy();
    expect(screen.getByText("Student information")).toBeTruthy();
    expect(screen.getByText("/teacher-students")).toBeTruthy();

    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("Your account details")).toBeTruthy();
    expect(screen.getByText("/teacher-profile")).toBeTruthy();
  });
});
