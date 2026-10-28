
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
import CreateTeacherPage from "../pages/CreateTeacherPage";
import { createTeacher } from "../services/teachers";

vi.mock("../services/teachers", () => ({
  createTeacher: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe("CreateTeacherPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function fillForm({
    fullName = "  Ravi Kumar  ",
    email = "  ravi@example.com  ",
    password = "password123",
  } = {}) {
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: fullName },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: email },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: password },
    });
  }

  it("renders the form fields and button", () => {
    render(<CreateTeacherPage />);

    expect(
      screen.getByRole("heading", { name: "Create teacher" })
    ).toBeTruthy();

    expect(screen.getByLabelText("Full name")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();

    expect(
      screen.getByRole("button", { name: "Create teacher" })
    ).toBeTruthy();
  });

  it("marks fields as required and sets password minimum length", () => {
    render(<CreateTeacherPage />);

    expect(screen.getByLabelText("Full name").required).toBe(true);
    expect(screen.getByLabelText("Email").required).toBe(true);
    expect(screen.getByLabelText("Password").required).toBe(true);

    expect(screen.getByLabelText("Password").minLength).toBe(8);
    expect(screen.getByLabelText("Email").type).toBe("email");
    expect(screen.getByLabelText("Password").type).toBe("password");
  });

  it("creates a teacher with trimmed name and email", async () => {
    createTeacher.mockResolvedValueOnce();

    render(<CreateTeacherPage />);
    fillForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Create teacher" })
    );

    await waitFor(() => {
      expect(createTeacher).toHaveBeenCalledWith({
        fullName: "Ravi Kumar",
        email: "ravi@example.com",
        password: "password123",
      });
    });

    const status = await screen.findByRole("status");

    expect(status.textContent).toBe(
      "Teacher account created successfully."
    );

    expect(screen.getByLabelText("Full name").value).toBe("");
    expect(screen.getByLabelText("Email").value).toBe("");
    expect(screen.getByLabelText("Password").value).toBe("");
  });

  it("shows the loading state while creating a teacher", async () => {
    let resolveRequest;

    createTeacher.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    render(<CreateTeacherPage />);
    fillForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Create teacher" })
    );

    const loadingButton = screen.getByRole("button", {
      name: "Creating teacher...",
    });

    expect(loadingButton.disabled).toBe(true);

    resolveRequest();

    await screen.findByRole("status");

    expect(
      screen.getByRole("button", { name: "Create teacher" }).disabled
    ).toBe(false);
  });

  it.each([
    [400, "Please check the teacher details and try again."],
    [401, "Your session has expired. Please sign in again."],
    [403, "You do not have permission to create teachers."],
    [404, "The teacher creation service was not found."],
    [500, "Server error. The teacher could not be created."],
    [503, "Server error. The teacher could not be created."],
    [0, "Unable to connect to the server. Please try again."],
  ])(
    "shows the correct error message for status %i",
    async (status, message) => {
      createTeacher.mockRejectedValueOnce(
        Object.assign(new Error("Request failed"), { status })
      );

      render(<CreateTeacherPage />);
      fillForm();

      fireEvent.click(
        screen.getByRole("button", { name: "Create teacher" })
      );

      const alert = await screen.findByRole("alert");

      expect(alert.textContent).toBe(message);

      expect(
        screen.getByRole("button", { name: "Create teacher" }).disabled
      ).toBe(false);
    }
  );

  it("shows the connection error when the error has no status", async () => {
    createTeacher.mockRejectedValueOnce(new Error("Network error"));

    render(<CreateTeacherPage />);
    fillForm();

    fireEvent.click(
      screen.getByRole("button", { name: "Create teacher" })
    );

    const alert = await screen.findByRole("alert");

    expect(alert.textContent).toBe(
      "Unable to connect to the server. Please try again."
    );
  });

  it("does not call createTeacher when required fields are empty", () => {
    render(<CreateTeacherPage />);

    const form = screen
      .getByRole("button", { name: "Create teacher" })
      .closest("form");

    expect(form.checkValidity()).toBe(false);
    expect(createTeacher).not.toHaveBeenCalled();
  });
});
