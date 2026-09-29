import PortalDashboard from "./pages/PortalDashboard";

function TeacherDashboard() {
    return (
        <>
            <PortalDashboard
                title="Welcome"
                description="Your teaching workspace and authorized student resources."
                links={[
                    { label: "Students", description: "Student information", to: "/teacher-students" },
                    { label: "Profile", description: "Your account details", to: "/teacher-profile" }
                ]}
            />
        </>
    );
}

export default TeacherDashboard;