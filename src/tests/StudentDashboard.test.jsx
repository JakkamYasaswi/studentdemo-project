
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import StudentDashboard from "../StudentDashboard";

vi.mock("../pages/StudentProfile", () => ({
  default: () => <h1>Student Profile Mock</h1>,
}));

afterEach(() => {
  cleanup();
});

describe("StudentDashboard", () => {
  it("renders the StudentProfile component", () => {
    render(<StudentDashboard />);

    expect(
      screen.getByRole("heading", { name: "Student Profile Mock" })
    ).toBeTruthy();
  });
});
