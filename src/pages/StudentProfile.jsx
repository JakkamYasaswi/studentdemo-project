import { useEffect, useState } from "react";
import { getMyStudentDetails } from "../services/students";

function StudentProfile() {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        let isActive = true;

        async function loadStudent() {
            try {
                const details = await getMyStudentDetails({ signal: controller.signal });
                if (isActive) {
                    setStudent(details);
                }
            } catch (error) {
                if (isActive && error.name !== "AbortError") {
                    setErrorMessage(
                        error.status === 403
                            ? "You are not authorized to view this student record."
                            : "Unable to load your student details. Please try again."
                    );
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }

        loadStudent();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, []);

    const details = student?.student ?? student;
    const fields = [
        ["ID", details?.id],
        ["Name", details?.studentName],
        ["Email", details?.email],
        ["Mobile Number", details?.mobileNumber],
        ["Course", details?.course],
        ["Location", details?.location],
        ["Role", details?.role]
    ].filter(([, value]) => value !== undefined && value !== null && value !== "");

    return (
        <section className="portal-page">
            <h1>Student details</h1>
            {loading && <p className="students-feedback" role="status">Loading your details...</p>}
            {!loading && errorMessage && <p className="students-feedback students-error" role="alert">{errorMessage}</p>}
            {!loading && !errorMessage && fields.length === 0 && (
                <p className="students-feedback" role="status">No student details found.</p>
            )}
            {!loading && !errorMessage && fields.length > 0 && (
                <dl className="profile-details">
                    {fields.map(([label, value]) => (
                        <div className="profile-detail" key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </section>
    );
}
export default StudentProfile;