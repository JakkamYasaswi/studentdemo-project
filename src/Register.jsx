import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Register() {
    const [UserName, setUserName] = useState("");
    const [Password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();

        // Username validation
        if (UserName.trim() === "") {
            toast.error("Username is required");
            return;
        }

        // Password validation
        if (Password === "") {
            toast.error("Password is required");
            return;
        }
        if (Password.length < 8) {
            toast.error("Password must contain at least 8 characters");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(
                "https://localhost:7155/api/Users/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: UserName,
                        password: Password
                    })
                }
            );

            const result = await response.text();

            if (!response.ok) {
                toast.error(result || "Registration failed");
                return;
            }

            toast.success("Student registered successfully!");

            // Clear fields
            setUserName("");
            setPassword("");

            // Go back to Login after successful registration
            setTimeout(() => {
                navigate("/login");
            }, 1500);
        }
        catch (error) {
            console.error(error);
            toast.error("Unable to connect to the server");
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div>

            <ToastContainer
                position="top-center"
                autoClose={3000}
                toastClassName="custom-toast"/>
            <form
                onSubmit={handleSubmit} autoComplete="off" >
                <div>
                    <h1>New Student Registration</h1>
                    <label>Username: </label>
                    <input
                        type="text"
                        value={UserName}
                        onChange={(event) => setUserName(event.target.value)}
                        autoComplete="off"
                    />
                    <br />
                    <br />
                    <label>Password: </label>
                    <input
                        type="password"
                        value={Password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                    />
                    <br />
                    <br />
                    <button
                        type="submit"
                        disabled={loading} >
                        {loading ? "Registering..." : "Register"}
                    </button>
                    <br />
                    <br />
                    <button
                        type="button"
                        onClick={() => navigate("/login")}>
                        Back to Login
                    </button>
                </div>
            </form>
        </div>
    );
}
export default Register;