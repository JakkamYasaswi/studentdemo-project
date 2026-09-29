import { apiRequest } from "./api";

async function readStudentResponse(response) {
    if (!response.ok) {
        const error = new Error(`Student API request failed with status ${response.status}.`);
        error.status = response.status;
        throw error;
    }

    return response.json();
}

export async function getStudents({ signal } = {}) {
    const response = await apiRequest("/Students", { signal });
    const students = await readStudentResponse(response);

    if (!Array.isArray(students)) {
        throw new Error("The student list response was not an array.");
    }

    return students.map((student) => ({
        id: student.id,
        studentName: student.studentName,
        course: student.course,
        location: student.location,
        email: student.email,
        mobileNumber: student.mobileNumber,
        role: student.role
    }));
}

export async function getMyStudentDetails({ signal } = {}) {
    const response = await apiRequest("/Students/my-details", { signal });
    return readStudentResponse(response);
}

export async function updateStudent(student) {
    const response = await apiRequest(`/Students/${encodeURIComponent(student.id)}`, {
        method: "PUT",
        body: JSON.stringify({
            id: student.id,
            studentName: student.studentName,
            course: student.course,
            location: student.location,
            email: student.email,
            mobileNumber: student.mobileNumber,
            role: student.role
        })
    });

    if (!response.ok) {
        const error = new Error(`Student update failed with status ${response.status}.`);
        error.status = response.status;
        throw error;
    }
}

export async function deleteStudent(id) {
    const response = await apiRequest(`/Students/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        const error = new Error(`Student deletion failed with status ${response.status}.`);
        error.status = response.status;
        throw error;
    }
}