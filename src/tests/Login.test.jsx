
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
import Login from "../Login";
import { useAuth } from "../context/useAuth";
import {
  consumeAuthMessage,
  peekAuthMessage,
} from "../services/api";
import { toast } from "react-toastify";

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../services/api", () => ({
  consumeAuthMessage: vi.fn(),
  peekAuthMessage: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  ToastContainer: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function renderLogin(auth = {}) {
  useAuth.mockReturnValue({
    login: mockLogin,
    isAuthenticated: false,
    role: "",
    ...auth,
  });

  return render(<Login />);
}

function fillForm(email = "student@example.com", password = "Password123") {
  [
    [/email address/i, email],
    [/^password$/i, password],
  ].forEach(([label, value]) => {
    fireEvent.change(screen.getByLabelText(label), {
      target: { value },
    });
  });
}

function submitForm() {
  fireEvent.submit(
    screen.getByRole("button", { name: /^login$/i }).closest("form")
  );
}

function attemptLogin(email, password) {
  renderLogin();
  fillForm(email, password);
  submitForm();
}

async function expectLoginError(message) {
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(message);
  });
}

describe("Login component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockReset();
    peekAuthMessage.mockReturnValue(null);
    consumeAuthMessage.mockReturnValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the login form", () => {
    renderLogin();

    expect(screen.getByText("STUDENT PORTAL")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /welcome back/i })
    ).toBeTruthy();
    expect(screen.getByLabelText(/email address/i)).toBeTruthy();
    expect(screen.getByLabelText(/^password$/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /^login$/i })).toBeTruthy();
  });

  it("shows the session message when one exists", () => {
    peekAuthMessage.mockReturnValue("Your session has expired.");

    renderLogin();

    expect(screen.getByRole("alert").textContent).toContain(
      "Your session has expired."
    );
  });

  it("consumes the session message on render", () => {
    renderLogin();

    expect(consumeAuthMessage).toHaveBeenCalled();
  });

  it.each([
    ["empty email", "", "Password123", "Email is required"],
    ["whitespace-only email", "   ", "Password123", "Email is required"],
    ["empty password", "student@example.com", "", "Password is required"],
    [
      "short password",
      "student@example.com",
      "short",
      "Password must contain at least 8 characters",
    ],
  ])("shows a validation error for %s", (_, email, password, message) => {
    attemptLogin(email, password);

    expect(toast.error).toHaveBeenCalledWith(message);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("logs in successfully and navigates to the role dashboard", async () => {
    mockLogin.mockResolvedValue({ role: "Student" });

    attemptLogin("  student@example.com  ", "Password123");

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "student@example.com",
        "Password123"
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.any(String),
        { replace: true }
      );
    });
  });

  it.each([
    ["invalid credentials", new Error("Invalid credentials"), "Invalid credentials"],
    ["a connection failure", new TypeError("Failed to fetch"), "Unable to connect to the server"],
    ["an error without a message", {}, "Login failed"],
  ])("handles login failure caused by %s", async (_, error, message) => {
    mockLogin.mockRejectedValue(error);

    attemptLogin();

    await expectLoginError(message);
  });

  it("redirects an already authenticated user to the role dashboard", () => {
    renderLogin({ isAuthenticated: true, role: "Student" });

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.any(String),
      { replace: true }
    );
  });

  it("navigates to the registration page when Create an account is clicked", () => {
    renderLogin();

    fireEvent.click(
      screen.getByRole("button", { name: /create an account/i })
    );

    expect(mockNavigate).toHaveBeenCalledWith("/studentform");
  });

  it("disables the login button while login is pending", async () => {
    let resolveLogin;

    mockLogin.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    attemptLogin();

    const button = await screen.findByRole("button", {
      name: /logging in/i,
    });

    expect(button.disabled).toBe(true);

    resolveLogin({ role: "Student" });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
