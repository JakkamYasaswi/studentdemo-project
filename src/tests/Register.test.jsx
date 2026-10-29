
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
  return { ...actual, useNavigate: () => mockNavigate };
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

  function fillForm(username = "testuser", password = "Password123") {
    [
      [/username/i, username],
      [/password/i, password],
    ].forEach(([label, value]) => {
      fireEvent.change(screen.getByLabelText(label), {
        target: { value },
      });
    });
  }

  function submitForm() {
    fireEvent.submit(
      screen.getByRole("button", { name: /register/i }).closest("form")
    );
  }

  function registerWith(username, password) {
    renderRegister();
    fillForm(username, password);
    submitForm();
  }

  function mockResponse({ ok = false, status = 400, body = "" } = {}) {
    fetch.mockResolvedValue({
      ok,
      status,
      text: () => Promise.resolve(body),
    });
  }

  async function expectErrorMessage(message) {
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(message);
    });
  }

  it("renders the registration form", () => {
    renderRegister();

    expect(
      screen.getByRole("heading", { name: /new student registration/i })
    ).toBeTruthy();
    expect(screen.getByLabelText(/username/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
  });

  it.each([
    ["empty username", "", "Password123", "Username is required"],
    ["empty password", "testuser", "", "Password is required"],
    ["whitespace-only username", "   ", "Password123", "Username is required"],
    ["whitespace-only password", "testuser", "        ", "Password is required"],
    [
      "short password",
      "testuser",
      "Pass12",
      "Password must contain at least 8 characters",
    ],
  ])("rejects registration with %s", (_, username, password, message) => {
    registerWith(username, password);

    expect(toast.error).toHaveBeenCalledWith(message);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("registers successfully and resets the form", async () => {
    mockResponse({
      ok: true,
      status: 200,
      body: '{"message":"Registration successful"}',
    });

    registerWith("testuser", "Password123");

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Student registered successfully!"
      );
      expect(screen.getByLabelText(/username/i).value).toBe("");
      expect(screen.getByLabelText(/password/i).value).toBe("");
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/Users/register"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "testuser",
          password: "Password123",
        }),
      })
    );
  });

  it("navigates to login after successful registration", async () => {
    mockResponse({ ok: true, status: 200, body: "{}" });

    registerWith("testuser", "Password123");

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Student registered successfully!"
      );
    });

    await waitFor(
      () => expect(mockNavigate).toHaveBeenCalledWith("/login"),
      { timeout: 3000 }
    );
  });

  it.each([
    [
      "API message",
      400,
      '{"message":"Username already exists"}',
      "Username already exists",
    ],
    [
      "API title",
      400,
      '{"title":"Invalid registration details"}',
      "Invalid registration details",
    ],
    [
      "API detail",
      400,
      '{"detail":"Invalid registration details"}',
      "Invalid registration details",
    ],
    ["plain-text response", 400, "Invalid request", "Invalid request"],
    ["empty response", 500, "", "Registration failed (HTTP 500)"],
    ["JSON without an error message", 422, "{}", "Registration failed (HTTP 422)"],
  ])("handles failed registration using the %s", async (_, status, body, message) => {
    mockResponse({ status, body });

    registerWith("testuser", "Password123");

    await expectErrorMessage(message);
  });

  it("shows a network error when fetch fails", async () => {
    fetch.mockRejectedValue(new Error("Network error"));

    registerWith("testuser", "Password123");

    await expectErrorMessage(
      "Unable to connect to the server. Check your network or CORS settings."
    );
  });

  it("navigates to login when Back to Login is clicked", () => {
    renderRegister();

    fireEvent.click(
      screen.getByRole("button", { name: /back to login/i })
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

    registerWith("testuser", "Password123");

    expect(
      await screen.findByRole("button", { name: /registering/i })
    ).toHaveProperty("disabled", true);

    resolveRequest({
      ok: true,
      status: 200,
      text: () => Promise.resolve("{}"),
    });

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });
});
