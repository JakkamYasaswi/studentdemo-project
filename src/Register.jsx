
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
        if (Password.trim() === "") {
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
    `${import.meta.env.VITE_API_BASE_URL}/api/Users/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: UserName,
                        password: Password
                    })
                }
            );

            // Read the response safely
            const responseText = await response.text();

            let result = {};

            if (responseText) {
                try {
                    result = JSON.parse(responseText);
                } catch {
                    result = { message: responseText };
                }
            }

            console.log("Registration status:", response.status);
            console.log("Registration response:", result);

            // Handle API errors
            if (!response.ok) {
                const errorMessage =
                    result.message ||
                    result.title ||
                    result.detail ||
                    `Registration failed (HTTP ${response.status})`;

                toast.error(errorMessage);
                return;
            }

            // Registration successful
            toast.success("Student registered successfully!");

            setUserName("");
            setPassword("");

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            console.error("Registration error:", error);
            toast.error(
                "Unable to connect to the server. Check your network or CORS settings."
            );
        } finally {
            setLoading(false);
        }
    }
    return (
        <div>
            <ToastContainer
                position="top-center"
                autoClose={3000}
                toastClassName="custom-toast"
            />
            <form onSubmit={handleSubmit} autoComplete="off">
                <div>
                    <h1>New Student Registration</h1>

                    
<label htmlFor="username">Username:</label>
<input
    id="username"
    type="text"
    value={UserName}
    onChange={(event) =>
        setUserName(event.target.value)
    }
    autoComplete="off"
    required
/>


                    <br />
                    <br />

                   
<label htmlFor="password">Password:</label>
<input
    id="password"
    type="password"
    value={Password}
    onChange={(event) =>
        setPassword(event.target.value)
    }
    autoComplete="new-password"
    required
/>


                    <br />
                    <br />
                    <button type="submit" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>

                    <br />
                    <br />

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                    >
                        Back to Login
                    </button>
                </div>
            </form>
        </div>
    );
}
export default Register;
