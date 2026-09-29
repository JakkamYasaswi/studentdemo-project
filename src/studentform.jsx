import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiRequest } from "./services/api";

function StudentForm() {
    const [studentName, setStudentName] = useState("");
    const [course, setCourse] = useState("");
    const [location, setLocation] = useState("");
    const [email, setEmail] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    function handleReset() {
        setStudentName("");
        setCourse("");
        setLocation("");
        setEmail("");
        setMobileNumber("");
        setPassword("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (studentName.trim() === "") {
            toast.error("Student name is required");
            return;
        }

        if (course === "") {
            toast.error("Please select a course");
            return;
        }

        if (location.trim() === "") {
            toast.error("Location is required");
            return;
        }

        if (email.trim() === "") {
            toast.error("Email is required");
            return;
        }

        if (mobileNumber.trim() === "") {
            toast.error("Mobile number is required");
            return;
        }

        if (password === "") {
            toast.error("Password is required");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must contain at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            // STEP 1: CREATE USER LOGIN ACCOUNT

            const registerUserResponse = await apiRequest("/Users/register", {
                method: "POST",
                auth: false,
                body: JSON.stringify({ email, password })
            });

            if (!registerUserResponse.ok) {
                const errorText =
                    await registerUserResponse.text();

                console.error(
                    "User registration error:",
                    errorText
                );

                toast.error(
                    errorText || "User registration failed"
                );

                return;
            }

            // STEP 2: SAVE STUDENT DETAILS

            const studentResponse = await apiRequest("/Students", {
                method: "POST",
                auth: false,
                body: JSON.stringify({
                    studentName,
                    course,
                    location,
                    email,
                    mobileNumber
                })
            });

            if (!studentResponse.ok) {
                const errorText =
                    await studentResponse.text();

                console.error(
                    "Student registration error:",
                    errorText
                );

                toast.error(
                    "Student details could not be saved"
                );

                return;
            }

            // STEP 3: SUCCESS

            toast.success(
                "Student registered successfully!"
            );

            handleReset();

            // STEP 4: GO TO LOGIN PAGE

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            toast.error(
                "Unable to connect to the server"
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="registration-page">
            <ToastContainer
                position="top-center"
                autoClose={3000}
            />

            <div className="registration-layout">
                <section className="registration-panel" aria-labelledby="registration-title">
                    <div className="registration-heading">
                        <h2 id="registration-title">Student registration</h2>
                    </div>

                    <form className="registration-form" onSubmit={handleSubmit} autoComplete="off">
                        <div className="registration-field">
                            <label htmlFor="student-name">Student name</label>
                            <input
                                id="student-name"
                                type="text"
                                name="studentName"
                                autoComplete="name"
                                placeholder="Enter name"
                                value={studentName}
                                onChange={(event) => setStudentName(event.target.value)}
                            />
                        </div>

                        <div className="registration-field">
                            <label htmlFor="student-course">Course</label>
                            <select
                                id="student-course"
                                name="course"
                                value={course}
                                onChange={(event) => setCourse(event.target.value)}
                            >
                                <option value="">Choose a course</option>
                                <option value="CSE">CSE</option>
                                <option value="ECE">ECE</option>
                                <option value="IT">IT</option>
                            </select>
                        </div>

                        <div className="registration-field">
                            <label htmlFor="student-location">Location</label>
                            <input
                                id="student-location"
                                type="text"
                                name="location"
                                autoComplete="address-level2"
                                placeholder="City or campus"
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                            />
                        </div>

                        <div className="registration-field">
                            <label htmlFor="student-email">Email address</label>
                            <input
                                id="student-email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                        </div>

                        <div className="registration-field">
                            <label htmlFor="student-mobile">Mobile number</label>
                            <input
                                id="student-mobile"
                                type="tel"
                                name="mobileNumber"
                                autoComplete="tel"
                                placeholder="Your contact number"
                                value={mobileNumber}
                                onChange={(event) => setMobileNumber(event.target.value)}
                            />
                        </div>

                        <div className="registration-field">
                            <label htmlFor="student-password">Create password</label>
                            <input
                                id="student-password"
                                type="password"
                                name="new-password"
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                        </div>

                        <div className="registration-actions">
                            <button className="secondary-button" type="button" onClick={handleReset}>
                                Clear form
                            </button>
                            <button className="primary-button" type="submit" disabled={loading}>
                                {loading ? "Creating profile..." : "Create student profile"}
                            </button>
                        </div>
                    </form>

                    <p className="registration-login">
                        Already registered? <button type="button" onClick={() => navigate("/login")}>Back to login</button>
                    </p>
                </section>
            </div>
        </main>
    );
}

export default StudentForm;
