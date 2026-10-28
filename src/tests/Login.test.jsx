
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

function fillForm(
    email = "student@example.com",
    password = "Password123"
) {
    fireEvent.change(
        screen.getByLabelText(/email address/i),
        { target: { value: email } }
    );

    fireEvent.change(
        screen.getByLabelText(/^password$/i),
        { target: { value: password } }
    );
}

function submitForm() {
    fireEvent.submit(
        screen.getByRole("button", {
            name: /^login$/i,
        }).closest("form")
    );
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
        expect(
            screen.getByRole("button", { name: /^login$/i })
        ).toBeTruthy();
    });

    it("shows the session message when one exists", () => {
        peekAuthMessage.mockReturnValue(
            "Your session has expired."
        );

        renderLogin();

        expect(
            screen.getByRole("alert").textContent
        ).toContain("Your session has expired.");
    });

    it("consumes the session message on render", () => {
        renderLogin();

        expect(consumeAuthMessage).toHaveBeenCalled();
    });

    it("shows an error when email is empty", () => {
        renderLogin();
        fillForm("", "Password123");
        submitForm();

        expect(toast.error).toHaveBeenCalledWith(
            "Email is required"
        );
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it("shows an error when email contains only spaces", () => {
        renderLogin();
        fillForm("   ", "Password123");
        submitForm();

        expect(toast.error).toHaveBeenCalledWith(
            "Email is required"
        );
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it("shows an error when password is empty", () => {
        renderLogin();
        fillForm("student@example.com", "");
        submitForm();

        expect(toast.error).toHaveBeenCalledWith(
            "Password is required"
        );
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it("shows an error when password has fewer than eight characters", () => {
        renderLogin();
        fillForm("student@example.com", "short");
        submitForm();

        expect(toast.error).toHaveBeenCalledWith(
            "Password must contain at least 8 characters"
        );
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it("logs in successfully and navigates to the role dashboard", async () => {
        mockLogin.mockResolvedValue({ role: "Student" });

        renderLogin();
        fillForm("  student@example.com  ", "Password123");
        submitForm();

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

    it("shows the error message when login fails", async () => {
        mockLogin.mockRejectedValue(
            new Error("Invalid credentials")
        );

        renderLogin();
        fillForm();
        submitForm();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "Invalid credentials"
            );
        });
    });

    it("shows a connection error for a TypeError", async () => {
        mockLogin.mockRejectedValue(
            new TypeError("Failed to fetch")
        );

        renderLogin();
        fillForm();
        submitForm();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "Unable to connect to the server"
            );
        });
    });

    it("shows the default login error when no error message exists", async () => {
        mockLogin.mockRejectedValue({});

        renderLogin();
        fillForm();
        submitForm();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "Login failed"
            );
        });
    });

    it("redirects an already authenticated user to the role dashboard", () => {
        renderLogin({
            isAuthenticated: true,
            role: "Student",
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            expect.any(String),
            { replace: true }
        );
    });

    it("navigates to the registration page when Create an account is clicked", () => {
        renderLogin();

        fireEvent.click(
            screen.getByRole("button", {
                name: /create an account/i,
            })
        );

        expect(mockNavigate).toHaveBeenCalledWith(
            "/studentform"
        );
    });

    it("disables the login button while login is pending", async () => {
        let resolveLogin;

        mockLogin.mockReturnValue(
            new Promise((resolve) => {
                resolveLogin = resolve;
            })
        );

        renderLogin();
        fillForm();
        submitForm();

        const button = await screen.findByRole(
            "button",
            { name: /logging in/i }
        );

        expect(button.disabled).toBe(true);

        resolveLogin({ role: "Student" });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });
});
