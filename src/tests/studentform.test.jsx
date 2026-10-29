
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
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
    const fields = [
      ["Student name", "Jakka"],
      ["Course", "CSE"],
      ["Location", "Guntur"],
      ["Email address", "jakka@example.com"],
      ["Mobile number", "9876543210"],
      ["Create password", "password123"],
    ];

    fields.forEach(([label, value]) => {
      fireEvent.change(screen.getByLabelText(label), {
        target: { value },
      });
    });
  }

  function submitForm() {
    fireEvent.click(
      screen.getByRole("button", {
        name: "Create student profile",
      })
    );
  }

  function expectValidationError(label, value, message) {
    render(<StudentForm />);
    fillForm();

    fireEvent.change(screen.getByLabelText(label), {
      target: { value },
    });

    submitForm();

    expect(toast.error).toHaveBeenCalledWith(message);
    expect(apiRequest).not.toHaveBeenCalled();
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
      screen.getByRole("button", {
        name: "Create student profile",
      })
    ).toBeTruthy();
  });

  it("shows an error when student name is empty", () => {
    render(<StudentForm />);
    submitForm();

    expect(toast.error).toHaveBeenCalledWith(
      "Student name is required"
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("shows an error when course is not selected", () => {
    expectValidationError(
      "Course",
      "",
      "Please select a course"
    );
  });

  it("validates empty location", () => {
    expectValidationError(
      "Location",
      " ",
      "Location is required"
    );
  });

  it("validates empty email", () => {
    expectValidationError(
      "Email address",
      " ",
      "Email is required"
    );
  });

  it("validates empty mobile number", () => {
    expectValidationError(
      "Mobile number",
      " ",
      "Mobile number is required"
    );
  });

  it("validates an empty password", () => {
    expectValidationError(
      "Create password",
      "",
      "Password is required"
    );
  });

  it("requires a password of at least eight characters", () => {
    expectValidationError(
      "Create password",
      "short",
      "Password must contain at least 8 characters"
    );
  });

  it("clears all fields when Clear form is clicked", () => {
    render(<StudentForm />);
    fillForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Clear form" })
    );

    const fields = [
      "Student name",
      "Course",
      "Location",
      "Email address",
      "Mobile number",
      "Create password",
    ];

    fields.forEach((label) => {
      expect(screen.getByLabelText(label).value).toBe("");
    });
  });

  it("navigates to login when Back to login is clicked", () => {
    render(<StudentForm />);

    fireEvent.click(
      screen.getByRole("button", { name: "Back to login" })
    );

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("registers the user and saves student details successfully", async () => {
    apiRequest
      .mockResolvedValueOnce(successfulResponse())
      .mockResolvedValueOnce(successfulResponse());

    render(<StudentForm />);
    fillForm();
    submitForm();

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
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Email already exists"
      );
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
    submitForm();

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
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Unable to connect to the server"
      );
    });
  });
});
