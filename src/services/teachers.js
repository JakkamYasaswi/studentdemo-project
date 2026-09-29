import { apiRequest } from "./api";

export async function createTeacher(teacher) {
    const response = await apiRequest("/Users/create-teacher", {
        method: "POST",
        body: JSON.stringify({
            fullName: teacher.fullName,
            email: teacher.email,
            password: teacher.password
        })
    });

    if (!response.ok) {
        const error = new Error(`Teacher creation failed with status ${response.status}.`);
        error.status = response.status;
        throw error;
    }
}