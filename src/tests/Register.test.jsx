
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

import { MemoryRouter } from "react-router-dom";
import { toast } from "react-toastify";
import Register from "../Register.jsx";

const mockNavigate = vi.fn();

vi.mock("react-toastify", () => ({
  ToastContainer: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Register component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function renderRegister() {
    return render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
  }

  function fillForm(
    username = "testuser",
    password = "Password123"
  ) {
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: username },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: password },
    });
  }

  function submitForm() {
    fireEvent.submit(
      screen.getByRole("button", {
        name: /register/i,
      }).closest("form")
    );
  }

  it("renders the registration form", () => {
    renderRegister();

    expect(
      screen.getByRole("heading", {
        name: /new student registration/i,
      })
    ).toBeTruthy();

    expect(screen.getByLabelText(/username/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
  });

  it("prevents registration when username is empty", () => {
    renderRegister();

    fillForm("", "Password123");
    submitForm();

    expect(toast.error).toHaveBeenCalledWith(
      "Username is required"
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it("prevents registration when password is empty", () => {
    renderRegister();

    fillForm("testuser", "");
    submitForm();

    expect(toast.error).toHaveBeenCalledWith(
      "Password is required"
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only username", () => {
    renderRegister();

    fillForm("   ", "Password123");
    submitForm();

    expect(toast.error).toHaveBeenCalledWith(
      "Username is required"
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only password", () => {
    renderRegister();

    fillForm("testuser", "        ");
    submitForm();

    expect(toast.error).toHaveBeenCalledWith(
      "Password is required"
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than 8 characters", () => {
    renderRegister();

    fillForm("testuser", "Pass12");
    submitForm();

    expect(toast.error).toHaveBeenCalledWith(
      "Password must contain at least 8 characters"
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it("registers successfully and resets the form", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          '{"message":"Registration successful"}'
        ),
    });

    renderRegister();
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Student registered successfully!"
      );

      expect(
        screen.getByLabelText(/username/i).value
      ).toBe("");

      expect(
        screen.getByLabelText(/password/i).value
      ).toBe("");
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/Users/register"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "testuser",
          password: "Password123",
        }),
      })
    );
  });

  it("navigates to login after successful registration", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("{}"),
    });

    renderRegister();
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Student registered successfully!"
      );
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      },
      { timeout: 3000 }
    );
  });

  it("shows the API message for a failed request", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: () =>
        Promise.resolve(
          '{"message":"Username already exists"}'
        ),
    });

    renderRegister();
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Username already exists"
      );
    });
  });

  it("uses the API title when the message is missing", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: () =>
        Promise.resolve(
          '{"title":"Invalid registration details"}'
        ),
    });

    renderRegister();
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Invalid registration details"
      );
    });
  });

  it("uses the API detail when message and title are missing", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: () =>
        Promise.resolve(
          '{"detail":"Invalid registration details"}'
        ),
    });

    renderRegister();
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Invalid registration details"
      );
    });
  });

  it("handles a plain-text API error", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve("Invalid request"),
    });

    renderRegister();
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Invalid request"
      );
    });
  });

  it("uses the HTTP status when the error response is empty", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(""),
    });

    renderRegister();
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Registration failed (HTTP 500)"
      );
    });
  });

  it("uses the HTTP status when the JSON has no error message", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: () => Promise.resolve("{}"),
    });

    renderRegister();
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Registration failed (HTTP 422)"
      );
    });
  });

  it("shows a network error when fetch fails", async () => {
    fetch.mockRejectedValue(new Error("Network error"));

    renderRegister();
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Unable to connect to the server. Check your network or CORS settings."
      );
    });
  });

  it("navigates to login when Back to Login is clicked", () => {
    renderRegister();

    fireEvent.click(
      screen.getByRole("button", {
        name: /back to login/i,
      })
    );

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("disables the Register button while the request is pending", async () => {
    let resolveRequest;

    fetch.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    renderRegister();
    fillForm();
    submitForm();

    expect(
      await screen.findByRole("button", {
        name: /registering/i,
      })
    ).toHaveProperty("disabled", true);

    resolveRequest({
      ok: true,
      status: 200,
      text: () => Promise.resolve("{}"),
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
