import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const navigationByRole = {
    Student: [
        { label: "Dashboard", to: "/student-dashboard" }
    ],
    Teacher: [
        { label: "Dashboard", to: "/teacher-dashboard" },
        { label: "Students", to: "/teacher-students" },
        { label: "Profile", to: "/teacher-profile" }
    ],
    Admin: [
        { label: "Dashboard", to: "/admin-dashboard" },
        { label: "Manage Students", to: "/admin-students" },
        { label: "Create Teacher", to: "/admin-create-teacher" }
    ]
};

function Navbar() {
    const { role, user, logout } = useAuth();
    const navigation = navigationByRole[role] ?? [];

    return (
        <aside className="portal-sidebar">
            <div className="portal-brand">
                <span className="portal-brand-mark" aria-hidden="true">S</span>
                <span>STUDENT PORTAL</span>
            </div>

            <div className="portal-identity">
                <span className="portal-identity-label">SIGNED IN AS</span>
                <strong>{user?.name || user?.email || role}</strong>
                <span>{role}</span>
            </div>

            <nav className="portal-navigation" aria-label={`${role} navigation`}>
                {navigation.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        className={({ isActive }) => isActive ? "portal-nav-link active" : "portal-nav-link"}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <button className="portal-logout" type="button" onClick={logout}>
                Log out
            </button>
        </aside>
    );
}

export default Navbar;