import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./Login";
import StudentForm from "./studentform";
import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./AdminDashboard";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PortalLayout from "./pages/PortalLayout";
import ProfilePage from "./pages/ProfilePage";
import Unauthorized from "./pages/Unauthorized";
import HomeRedirect from "./pages/HomeRedirect";
import StudentsTable from "./components/StudentsTable";
import CreateTeacherPage from "./pages/CreateTeacherPage";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/studentform" element={<StudentForm />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="/" element={<HomeRedirect />} />

                    <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
                        <Route element={<PortalLayout />}>
                            <Route path="/student-dashboard" element={<StudentDashboard />} />
                        </Route>
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={["Teacher"]} />}>
                        <Route element={<PortalLayout />}>
                            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                            <Route
                                path="/teacher-students"
                                element={<StudentsTable allowEdit />}
                            />
                            <Route path="/teacher-profile" element={<ProfilePage title="Profile" />} />
                        </Route>
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
                        <Route element={<PortalLayout />}>
                            <Route path="/admin-dashboard" element={<AdminDashboard />} />
                            <Route
                                path="/admin-students"
                                element={<StudentsTable allowEdit allowDelete />}
                            />
                            <Route path="/admin-create-teacher" element={<CreateTeacherPage />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<HomeRedirect />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
