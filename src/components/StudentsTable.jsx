import { useEffect, useMemo, useState } from "react";
import { deleteStudent, getStudents, updateStudent } from "../services/students";

function getLoadErrorMessage(error) {
    if (error.status === 401) {
        return "Authentication required. Please sign in again.";
    }
    if (error.status === 403) {
        return "You are not authorized to view students.";
    }
    if (error.status >= 500) {
        return "Server error. Unable to load students. Please try again.";
    }
    if (error instanceof TypeError) {
        return "Unable to load students. Please try again.";
    }
    return "Unable to load students. Please try again.";
}

function getActionErrorMessage(error, action) {
    if (error.status === 400) {
        return "Some details are invalid. Check the form and try again.";
    }
    if (error.status === 401) {
        return "Your session has expired. Please sign in again.";
    }
    if (error.status === 403) {
        return "You do not have permission to perform this action.";
    }
    if (error.status === 404) {
        return "This student record could not be found. Refresh the list and try again.";
    }
    if (error.status >= 500) {
        return `Server error. The student could not be ${action}.`;
    }
    return `Unable to ${action} this student. Please try again.`;
}

function StudentsTable({ allowEdit = false, allowDelete = false }) {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [actionFeedback, setActionFeedback] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        let isActive = true;

        async function loadStudents() {
            setLoading(true);
            setErrorMessage("");

            try {
                const records = await getStudents({ signal: controller.signal });
                if (isActive) {
                    setStudents(records);
                }
            } catch (error) {
                if (isActive && error.name !== "AbortError") {
                    setErrorMessage(getLoadErrorMessage(error));
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }

        void loadStudents();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [refreshKey]);

    function beginEdit(student) {
        setActionFeedback(null);
        setSelectedStudent(student);
        setEditForm({
            studentName: student.studentName ?? "",
            email: student.email ?? "",
            mobileNumber: student.mobileNumber ?? "",
            course: student.course ?? "",
            location: student.location ?? ""
        });
    }

    async function handleEditSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setActionFeedback(null);

        try {
            await updateStudent({
                ...editForm,
                id: selectedStudent.id,
                role: selectedStudent.role
            });
            setSelectedStudent(null);
            setEditForm(null);
            setActionFeedback({ type: "success", message: "Student details updated successfully." });
            setRefreshKey((current) => current + 1);
        } catch (error) {
            setActionFeedback({ type: "error", message: getActionErrorMessage(error, "update") });
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(student) {
        const confirmed = window.confirm(`Are you sure you want to delete ${student.studentName || "this student"}?`);
        if (!confirmed) {
            return;
        }

        setActionFeedback(null);
        try {
            await deleteStudent(student.id);
            setActionFeedback({ type: "success", message: "Student deleted successfully." });
            setRefreshKey((current) => current + 1);
        } catch (error) {
            setActionFeedback({ type: "error", message: getActionErrorMessage(error, "delete") });
        }
    }

    const filteredStudents = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        if (!query) {
            return students;
        }

        return students.filter((student) =>
            [student.studentName, student.email, student.course]
                .some((value) => String(value ?? "").toLocaleLowerCase().includes(query))
        );
    }, [search, students]);

    return (
        <section className="students-panel" aria-labelledby="students-title">
            <div className="students-panel-heading">
                <div>
                    <h2 id="students-title">Students</h2>
                </div>
                <button
                    className="students-refresh-button"
                    type="button"
                    onClick={() => setRefreshKey((current) => current + 1)}
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            <label className="students-search-label" htmlFor="student-search">
                Search students
            </label>
            <input
                id="student-search"
                className="students-search"
                type="search"
                placeholder="Search students..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />

            {loading && (
                <output className="students-feedback">
                    Loading students...
                </output>
            )}

            {!loading && errorMessage && (
                <p className="students-feedback students-error" role="alert">
                    {errorMessage}
                </p>
            )}

            {actionFeedback && (
                actionFeedback.type === "error" ? (
                    <p className="students-feedback students-error" role="alert">
                        {actionFeedback.message}
                    </p>
                ) : (
                    <output className="students-feedback students-success">
                        {actionFeedback.message}
                    </output>
                )
            )}

            {!loading && !errorMessage && filteredStudents.length === 0 && (
                <output className="students-feedback">
                    No students found.
                </output>
            )}

            {!loading && !errorMessage && filteredStudents.length > 0 && (
                <div className="students-table-scroll">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Name</th>
                                <th scope="col">Email</th>
                                <th scope="col">Mobile Number</th>
                                <th scope="col">Course</th>
                                <th scope="col">Location</th>
                                <th scope="col">Role</th>
                                {(allowEdit || allowDelete) && <th scope="col">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr key={student.id}>
                                    <td>{student.id ?? "-"}</td>
                                    <td>{student.studentName ?? "-"}</td>
                                    <td>{student.email ?? "-"}</td>
                                    <td>{student.mobileNumber ?? "-"}</td>
                                    <td>{student.course ?? "-"}</td>
                                    <td>{student.location ?? "-"}</td>
                                    <td>{student.role ?? "-"}</td>
                                    {(allowEdit || allowDelete) && (
                                        <td className="students-actions">
                                            {allowEdit && (
                                                <button className="table-action-button" type="button" onClick={() => beginEdit(student)}>
                                                    Edit
                                                </button>
                                            )}
                                            {allowDelete && (
                                                <button className="table-action-button danger" type="button" onClick={() => handleDelete(student)}>
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedStudent && editForm && (
                <div className="management-modal-backdrop">
                    <section className="management-modal" role="dialog" aria-modal="true" aria-labelledby="edit-student-title">
                        <div className="management-modal-heading">
                            <div>
                                <p className="portal-eyebrow">STUDENT RECORD</p>
                                <h2 id="edit-student-title">Edit student</h2>
                            </div>
                            <button className="modal-close-button" type="button" onClick={() => setSelectedStudent(null)} aria-label="Close edit form">
                                ×
                            </button>
                        </div>
                        <form className="management-form" onSubmit={handleEditSubmit}>
                            {[
                                ["Full name", "studentName", "text"],
                                ["Email", "email", "email"],
                                ["Mobile number", "mobileNumber", "tel"],
                                ["Course", "course", "text"],
                                ["Location", "location", "text"]
                            ].map(([label, name, type]) => (
                                <label className="management-field" key={name}>
                                    {label}
                                    <input
                                        required
                                        type={type}
                                        value={editForm[name]}
                                        onChange={(event) => setEditForm((current) => ({ ...current, [name]: event.target.value }))}
                                    />
                                </label>
                            ))}
                            {actionFeedback?.type === "error" && (
                                <p className="management-feedback error" role="alert">{actionFeedback.message}</p>
                            )}
                            <div className="management-form-actions">
                                <button className="management-secondary-button" type="button" onClick={() => setSelectedStudent(null)}>
                                    Cancel
                                </button>
                                <button className="management-primary-button" type="submit" disabled={saving}>
                                    {saving ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </section>
    );
}

export default StudentsTable;
