import { useState } from "react";
import { createTeacher } from "../services/teachers";

function getErrorMessage(error) {
    if (error.status === 400) {
        return "Please check the teacher details and try again.";
    }
    if (error.status === 401) {
        return "Your session has expired. Please sign in again.";
    }
    if (error.status === 403) {
        return "You do not have permission to create teachers.";
    }
    if (error.status === 404) {
        return "The teacher creation service was not found.";
    }
    if (error.status >= 500) {
        return "Server error. The teacher could not be created.";
    }
    return "Unable to connect to the server. Please try again.";
}

function CreateTeacherPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setFeedback(null);

        try {
            await createTeacher({ fullName: fullName.trim(), email: email.trim(), password });
            setFullName("");
            setEmail("");
            setPassword("");
            setFeedback({ type: "success", message: "Teacher account created successfully." });
        } catch (error) {
            setFeedback({ type: "error", message: getErrorMessage(error) });
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="portal-page">
            <h1>Create teacher</h1>
            <p className="portal-lede">Create a teacher account with the Teacher role.</p>

            <form className="management-form" onSubmit={handleSubmit}>
                <label className="management-field">
    <span>Full name</span>
    <input
        autoComplete="name"
        name="fullName"
        required
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
    />
</label>

<label className="management-field">
    <span>Email</span>
    <input
        autoComplete="email"
        name="email"
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
    />
</label>

<label className="management-field">
    <span>Password</span>
    <input
        autoComplete="new-password"
        minLength={8}
        name="password"
        required
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
    />
</label>
                
                {feedback && (
                    <p className={`management-feedback ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>
                        {feedback.message}
                    </p>
                )}
                <button className="management-primary-button" type="submit" disabled={loading}>
                    {loading ? "Creating teacher..." : "Create teacher"}
                </button>
            </form>
        </section>
    );
}

export default CreateTeacherPage;
