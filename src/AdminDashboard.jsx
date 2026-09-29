import PortalDashboard from "./pages/PortalDashboard";

function AdminDashboard() {
    return (
        <>
            <PortalDashboard
                title="Welcome"
                description="Manage student records and create teacher accounts."
                links={[
                    { label: "Manage students", description: "View and update student records", to: "/admin-students" },
                    { label: "Create teacher", description: "Add a teacher account", to: "/admin-create-teacher" }
                ]}
            />
            </>
    );
}

export default AdminDashboard;