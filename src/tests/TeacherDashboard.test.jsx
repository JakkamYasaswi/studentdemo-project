
import {
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import {
  render,
  screen,
  cleanup,
} from "@testing-library/react";
import TeacherDashboard from "../TeacherDashboard";

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

describe("TeacherDashboard", () => {
  it("renders the welcome title and description", () => {
    render(<TeacherDashboard />);

    expect(
      screen.getByRole("heading", { name: "Welcome" })
    ).toBeTruthy();

    expect(
      screen.getByText(
        "Your teaching workspace and authorized student resources."
      )
    ).toBeTruthy();
  });

  it("renders the Students link details", () => {
    render(<TeacherDashboard />);

    expect(screen.getByText("Students")).toBeTruthy();
    expect(screen.getByText("Student information")).toBeTruthy();
    expect(screen.getByText("/teacher-students")).toBeTruthy();
  });

  it("renders the Profile link details", () => {
    render(<TeacherDashboard />);

    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("Your account details")).toBeTruthy();
    expect(screen.getByText("/teacher-profile")).toBeTruthy();
  });
});
