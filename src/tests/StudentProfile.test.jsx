
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
} from "@testing-library/react";
import StudentProfile from "../pages/StudentProfile";
import { getMyStudentDetails } from "../services/students";

vi.mock("../services/students", () => ({
  getMyStudentDetails: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StudentProfile", () => {
  it("shows loading message while fetching student details", () => {
    getMyStudentDetails.mockReturnValue(new Promise(() => {}));

    render(<StudentProfile />);

    expect(
      screen.getByText("Loading your details...")
    ).toBeTruthy();
  });

  it("displays student details after a successful API response", async () => {
    getMyStudentDetails.mockResolvedValue({
      id: 1,
      studentName: "Jakka",
      email: "jakka@example.com",
      mobileNumber: "9876543210",
      course: "CSE",
      location: "Guntur",
      role: "Student",
    });

    render(<StudentProfile />);

    expect(await screen.findByText("Jakka")).toBeTruthy();
    expect(screen.getByText("jakka@example.com")).toBeTruthy();
    expect(screen.getByText("9876543210")).toBeTruthy();
    expect(screen.getByText("CSE")).toBeTruthy();
    expect(screen.getByText("Guntur")).toBeTruthy();
    expect(screen.getByText("Student")).toBeTruthy();
  });

  it("displays details when the response contains a nested student object", async () => {
    getMyStudentDetails.mockResolvedValue({
      student: {
        id: 2,
        studentName: "Ravi",
        email: "ravi@example.com",
      },
    });

    render(<StudentProfile />);

    expect(await screen.findByText("Ravi")).toBeTruthy();
    expect(screen.getByText("ravi@example.com")).toBeTruthy();
  });

  it("shows an empty message when no student details are available", async () => {
    getMyStudentDetails.mockResolvedValue(null);

    render(<StudentProfile />);

    expect(
      await screen.findByText("No student details found.")
    ).toBeTruthy();
  });

  it("shows an authorization message for a 403 error", async () => {
    const error = new Error("Forbidden");
    error.status = 403;

    getMyStudentDetails.mockRejectedValue(error);

    render(<StudentProfile />);

    expect(
      await screen.findByText(
        "You are not authorized to view this student record."
      )
    ).toBeTruthy();
  });

  it("shows a general error message when the API request fails", async () => {
    getMyStudentDetails.mockRejectedValue(
      new Error("Network error")
    );

    render(<StudentProfile />);

    expect(
      await screen.findByText(
        "Unable to load your student details. Please try again."
      )
    ).toBeTruthy();
  });

  it("does not show an error message when the request is aborted", async () => {
    const error = new Error("Aborted");
    error.name = "AbortError";

    getMyStudentDetails.mockRejectedValue(error);

    render(<StudentProfile />);

    expect(
      await screen.findByText("No student details found.")
    ).toBeTruthy();

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
