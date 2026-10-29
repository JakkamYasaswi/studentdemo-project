import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import AdminDashboard from "../AdminDashboard";

vi.mock("../pages/PortalDashboard", () => ({
  default: ({ title, description, links }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      {links.map((link) => (
        <div key={link.to}>
          <span>{link.label}</span>
          <span>{link.description}</span>
          <span>{link.to}</span>
        </div>
      ))}
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("AdminDashboard", () => {
  it("renders the welcome message and all admin links", () => {
    render(<AdminDashboard />);

    expect(
      screen.getByRole("heading", { name: "Welcome" })
    ).toBeTruthy();

    expect(
      screen.getByText(
        "Manage student records and create teacher accounts."
      )
    ).toBeTruthy();

    expect(screen.getByText("Manage students")).toBeTruthy();
    expect(
      screen.getByText("View and update student records")
    ).toBeTruthy();
    expect(screen.getByText("/admin-students")).toBeTruthy();

    expect(screen.getByText("Create teacher")).toBeTruthy();
    expect(screen.getByText("Add a teacher account")).toBeTruthy();
    expect(screen.getByText("/admin-create-teacher")).toBeTruthy();
  });
});