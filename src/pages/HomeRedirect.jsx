import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { DASHBOARD_PATH_BY_ROLE } from "../constants/roles";

function HomeRedirect() {
    const { isAuthenticated, role } = useAuth();
    const destination = DASHBOARD_PATH_BY_ROLE[role];

    return (
        <Navigate
            to={isAuthenticated && destination ? destination : "/login"}
            replace
        />
    );
}

export default HomeRedirect;