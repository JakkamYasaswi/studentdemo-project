import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { DASHBOARD_PATH_BY_ROLE } from "../constants/roles";

function Unauthorized() {
    const { isAuthenticated, role } = useAuth();
    const navigate = useNavigate();
    const destination = isAuthenticated
        ? DASHBOARD_PATH_BY_ROLE[role] ?? "/login"
        : "/login";

    return (
        <main className="unauthorized-page">
            <div className="unauthorized-panel">
                <span className="portal-eyebrow">STUDENT PORTAL</span>
                <h1>Access Denied</h1>
                <p>You do not have permission to access this page.</p>
                <button
                    className="login-button"
                    type="button"
                    onClick={() => navigate(destination, { replace: true })}
                >
                    Return to your dashboard
                </button>
            </div>
        </main>
    );
}

export default Unauthorized;