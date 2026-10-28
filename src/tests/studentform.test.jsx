
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import StudentForm from "../studentform";
import { apiRequest } from "../services/api";
import { toast } from "react-toastify";

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../services/api", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  ToastContainer: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("StudentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function fillForm() {
    fireEvent.change(screen.getByLabelText("Student name"), {
      target: { value: "Jakka" },
    });

    fireEvent.change(screen.getByLabelText("Course"), {
      target: { value: "CSE" },
    });

    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Guntur" },
    });

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "jakka@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Mobile number"), {
      target: { value: "9876543210" },
    });

    fireEvent.change(screen.getByLabelText("Create password"), {
      target: { value: "password123" },
    });
  }

  function successfulResponse() {
    return {
      ok: true,
      text: vi.fn().mockResolvedValue(""),
    };
  }

  it("renders all registration fields and buttons", () => {
    render(<StudentForm />);

    expect(screen.getByText("Student registration")).toBeTruthy();
    expect(screen.getByLabelText("Student name")).toBeTruthy();
    expect(screen.getByLabelText("Course")).toBeTruthy();
    expect(screen.getByLabelText("Location")).toBeTruthy();
    expect(screen.getByLabelText("Email address")).toBeTruthy();
    expect(screen.getByLabelText("Mobile number")).toBeTruthy();
    expect(screen.getByLabelText("Create password")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Create student profile" })
    ).toBeTruthy();
  });

  it("shows an error when student name is empty", () => {
    render(<StudentForm />);

    fireEvent.click(
      screen.getByRole("button", { name: "Create student profile" })
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Student name is required"
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("shows an error when course is not selected", () => {
    render(<StudentForm />);
    fillForm();

    fireEvent.change(screen.getByLabelText("Course"), {
      target: { value: "" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create student profile" })
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Please select a course"
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("validates empty location", () => {
    render(<StudentForm />);
    fillForm();

    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: " " },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create student profile" })
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Location is required"
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("validates empty email", () => {
    render(<StudentForm />);
    fillForm();

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: " " },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create student profile" })
    );

    expect(toast.error).toHaveBeenCalledWith("Email is required");
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("validates empty mobile number", () => {
    render(<StudentForm />);
    fillForm();

    fireEvent.change(screen.getByLabelText("Mobile number"), {
      target: { value: " " },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create student profile" })
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Mobile number is required"
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("validates an empty password", () => {
    render(<StudentForm />);
    fillForm();

    fireEvent.change(screen.getByLabelText("Create password"), {
      target: { value: "" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create student profile" })
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Password is required"
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("requires a password of at least eight characters", () => {
    render(<StudentForm />);
    fillForm();

    fireEvent.change(screen.getByLabelText("Create password"), {
      target: { value: "short" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create student profile" })
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Password must contain at least 8 characters"
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("clears all fields when Clear form is clicked", () => {
    render(<StudentForm />);
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Clear form" }));

    expect(screen.getByLabelText("Student name").value).toBe("");
    expect(screen.getByLabelText("Course").value).toBe("");
    expect(screen.getByLabelText("Location").value).toBe("");
    expect(screen.getByLabelText("Email address").value).toBe("");
    expect(screen.getByLabelText("Mobile number").value).toBe("");
    expect(screen.getByLabelText("Create password").value).toBe("");
  });

  it("navigates to login when Back to login is clicked", () => {
    render(<StudentForm />);

    fireEvent.click(screen.getByRole("button", { name: "Back to login" }));

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("registers the user and saves student details successfully", async () => {
    apiRequest
      .mockResolvedValueOnce(successfulResponse())
      .mockResolvedValueOnce(successfulResponse());

    render(<StudentForm />);
    fillForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Create student profile" })
    );

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledTimes(2);
    });

    expect(apiRequest).toHaveBeenNthCalledWith(
      1,
      "/Users/register",
      expect.objectContaining({
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email: "jakka@example.com",
          password: "password123",
        }),
      })
    );

    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      "/Students",
      expect.objectContaining({
        method: "POST",
        auth: false,
        body: JSON.stringify({
          studentName: "Jakka",
          course: "CSE",
          location: "Guntur",
          email: "jakka@example.com",
          mobileNumber: "9876543210",
        }),
      })
    );

    expect(toast.success).toHaveBeenCalledWith(
      "Student registered successfully!"
    );

    expect(screen.getByLabelText("Student name").value).toBe("");
  });

  it("shows an error when user registration fails", async () => {
    apiRequest.mockResolvedValueOnce({
      ok: false,
      text: vi.fn().mockResolvedValue("Email already exists"),
    });

    render(<StudentForm />);
    fillForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Create student profile" })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email already exists");
    });

    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it("shows an error when saving student details fails", async () => {
    apiRequest
      .mockResolvedValueOnce(successfulResponse())
      .mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValue("Database error"),
      });

    render(<StudentForm />);
    fillForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Create student profile" })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Student details could not be saved"
      );
    });

    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it("shows an error when the server request throws an exception", async () => {
    apiRequest.mockRejectedValueOnce(new Error("Network error"));

    render(<StudentForm />);
    fillForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Create student profile" })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Unable to connect to the server"
      );
    });
  });
});
