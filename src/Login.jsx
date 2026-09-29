import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./context/useAuth";
import { consumeAuthMessage, peekAuthMessage } from "./services/api";
import { DASHBOARD_PATH_BY_ROLE } from "./constants/roles";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionMessage] = useState(peekAuthMessage);
    const { login, isAuthenticated, role } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        consumeAuthMessage();

        if (isAuthenticated && DASHBOARD_PATH_BY_ROLE[role]) {
            navigate(DASHBOARD_PATH_BY_ROLE[role], { replace: true });
        }
    }, [isAuthenticated, navigate, role]);

    async function handleSubmit(event) {
        event.preventDefault();

        if (email.trim() === "") {
            toast.error("Email is required");
            return;
        }

        if (password === "") {
            toast.error("Password is required");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must contain at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            const auth = await login(email.trim(), password);
            navigate(DASHBOARD_PATH_BY_ROLE[auth.role], { replace: true });
        } catch (error) {
            console.error(error);
            toast.error(
                error instanceof TypeError
                    ? "Unable to connect to the server"
                    : error.message || "Login failed"
            );

        } finally {
            setLoading(false);
        }
    }

    function handleRegister() {
        navigate("/studentform");
    }

    return (
        <div className="login-page">

            <ToastContainer
                position="top-center"
                autoClose={3000}
                toastClassName="custom-toast"
            />

            {sessionMessage && (
                <div className="session-expired-message" role="alert">
                    {sessionMessage}
                </div>
            )}

            <div className="login-card">

                {/* Header */}
                <div className="login-header">

                    <div className="portal-title">
                        STUDENT PORTAL
                    </div>

                    <h1>Welcome back</h1>

                    <p>
                        Sign in to continue to your student account.
                    </p>

                </div>

                {/* Login Form */}
                <div className="login-body">

                    <form onSubmit={handleSubmit}>

                        {/* Email */}
                        <div className="login-field">

                            <label htmlFor="login-email">Email address</label>

                            <input
                                type="email"
                                id="login-email"
                                name="email"
                                value={email}
                                autoComplete="email"
                                placeholder="Enter your email"
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                            />

                        </div>

                        {/* Password */}
                        <div className="login-field">

                            <label htmlFor="login-password">Password</label>

                            <input
                                type="password"
                                id="login-password"
                                name="password"
                                value={password}
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                            />

                        </div>

                        {/* Bottom section */}
                        <div className="login-action">

                            <p>
                                Enter your registered email and
                                password.
                            </p>

                            <button
                                type="submit"
                                disabled={loading}
                                className="login-button"
                            >
                                {loading
                                    ? "LOGGING IN..."
                                    : "LOGIN"}
                            </button>

                        </div>

                    </form>

                </div>

                {/* Register */}
                <div className="register-section">

                    <span>New student?</span>

                    <button
                        type="button"
                        onClick={handleRegister}
                    >
                        Create an account
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Login;