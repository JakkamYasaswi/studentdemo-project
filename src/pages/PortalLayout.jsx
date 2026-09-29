import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

function PortalLayout() {
    return (
        <div className="portal-app">
            <Navbar />
            <main className="portal-main">
                <Outlet />
            </main>
        </div>
    );
}

export default PortalLayout;