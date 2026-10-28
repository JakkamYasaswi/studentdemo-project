
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import StudentsTable from "../components/StudentsTable";
import {
  getStudents,
  updateStudent,
  deleteStudent,
} from "../services/students";

vi.mock("../services/students", () => ({
  getStudents: vi.fn(),
  updateStudent: vi.fn(),
  deleteStudent: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("StudentsTable", () => {
  const students = [
    {
      id: 1,
      studentName: "Jakka",
      email: "jakka@example.com",
      mobileNumber: "9876543210",
      course: "CSE",
      location: "Guntur",
      role: "Student",
    },
    {
      id: 2,
      studentName: "Ravi",
      email: "ravi@example.com",
      mobileNumber: "9876501234",
      course: "ECE",
      location: "Hyderabad",
      role: "Student",
    },
  ];

  it("shows the loading message", () => {
    getStudents.mockReturnValue(new Promise(() => {}));
    render(<StudentsTable />);
    expect(screen.getByText("Loading students...")).toBeTruthy();
  });

  it("displays student records after successful loading", async () => {
    getStudents.mockResolvedValue(students);
    render(<StudentsTable />);

    expect(await screen.findByText("Jakka")).toBeTruthy();
    expect(screen.getByText("jakka@example.com")).toBeTruthy();
    expect(screen.getByText("9876543210")).toBeTruthy();
    expect(screen.getByText("CSE")).toBeTruthy();
    expect(screen.getByText("Guntur")).toBeTruthy();
    expect(screen.getByText("Ravi")).toBeTruthy();
  });

  it("shows a message when no students are available", async () => {
    getStudents.mockResolvedValue([]);
    render(<StudentsTable />);
    expect(await screen.findByText("No students found.")).toBeTruthy();
  });

  it("filters students by name, email, and course", async () => {
    getStudents.mockResolvedValue(students);
    render(<StudentsTable />);
    await screen.findByText("Jakka");

    const search = screen.getByRole("searchbox", {
      name: "Search students",
    });

    fireEvent.change(search, { target: { value: "ravi" } });
    expect(screen.getByText("Ravi")).toBeTruthy();
    expect(screen.queryByText("Jakka")).toBeNull();

    fireEvent.change(search, { target: { value: "ECE" } });
    expect(screen.getByText("Ravi")).toBeTruthy();

    fireEvent.change(search, {
      target: { value: "jakka@example.com" },
    });
    expect(screen.getByText("Jakka")).toBeTruthy();
    expect(screen.queryByText("Ravi")).toBeNull();
  });

  it("shows no matching students for an unmatched search", async () => {
    getStudents.mockResolvedValue(students);
    render(<StudentsTable />);
    await screen.findByText("Jakka");

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search students" }),
      { target: { value: "notfound" } }
    );

    expect(screen.getByText("No students found.")).toBeTruthy();
  });

  it("shows the default load error", async () => {
    getStudents.mockRejectedValue(new TypeError("Network error"));
    render(<StudentsTable />);

    expect(
      await screen.findByText(
        "Unable to load students. Please try again."
      )
    ).toBeTruthy();
  });

  it("shows the authentication error for status 401", async () => {
    getStudents.mockRejectedValue({ status: 401 });
    render(<StudentsTable />);

    expect(
      await screen.findByText(
        "Authentication required. Please sign in again."
      )
    ).toBeTruthy();
  });

  it("shows the authorization error for status 403", async () => {
    getStudents.mockRejectedValue({ status: 403 });
    render(<StudentsTable />);

    expect(
      await screen.findByText(
        "You are not authorized to view students."
      )
    ).toBeTruthy();
  });

  it("shows the server error for status 500", async () => {
    getStudents.mockRejectedValue({ status: 500 });
    render(<StudentsTable />);

    expect(
      await screen.findByText(
        "Server error. Unable to load students. Please try again."
      )
    ).toBeTruthy();
  });

  it("shows the default load error for an unknown status", async () => {
    getStudents.mockRejectedValue({ status: 400 });
    render(<StudentsTable />);

    expect(
      await screen.findByText(
        "Unable to load students. Please try again."
      )
    ).toBeTruthy();
  });

  it("refreshes the student list", async () => {
    getStudents.mockResolvedValue(students);
    render(<StudentsTable />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(getStudents).toHaveBeenCalledTimes(2);
    });
  });

  it("shows Edit and Delete buttons when permitted", async () => {
    getStudents.mockResolvedValue(students);
    render(<StudentsTable allowEdit allowDelete />);
    await screen.findByText("Jakka");

    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
  });

  it("hides Edit and Delete buttons by default", async () => {
    getStudents.mockResolvedValue(students);
    render(<StudentsTable />);
    await screen.findByText("Jakka");

    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("opens the edit form", async () => {
    getStudents.mockResolvedValue(students);
    render(<StudentsTable allowEdit />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);

    expect(screen.getByText("Edit student")).toBeTruthy();
    expect(screen.getByLabelText("Full name")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });

  it("closes the edit form with the close button", async () => {
    getStudents.mockResolvedValue(students);
    render(<StudentsTable allowEdit />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Close edit form" }));

    expect(screen.queryByText("Edit student")).toBeNull();
  });

  it("closes the edit form with Cancel", async () => {
    getStudents.mockResolvedValue(students);
    render(<StudentsTable allowEdit />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Edit student")).toBeNull();
  });

  it("updates student details successfully", async () => {
    getStudents.mockResolvedValue(students);
    updateStudent.mockResolvedValue({});

    render(<StudentsTable allowEdit />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Jakka Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateStudent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          studentName: "Jakka Updated",
          role: "Student",
        })
      );
    });

    expect(
      await screen.findByText("Student details updated successfully.")
    ).toBeTruthy();
  });

  it("shows an error when updating a student fails", async () => {
    getStudents.mockResolvedValue(students);
    updateStudent.mockRejectedValue({ status: 403 });

    render(<StudentsTable allowEdit />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText(
        "You do not have permission to perform this action.",
        { selector: ".management-feedback" }
      )
    ).toBeTruthy();
  });

  it("shows the invalid-details error when updating fails with status 400", async () => {
    getStudents.mockResolvedValue(students);
    updateStudent.mockRejectedValue({ status: 400 });

    render(<StudentsTable allowEdit />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText(
        "Some details are invalid. Check the form and try again.",
        { selector: ".management-feedback" }
      )
    ).toBeTruthy();
  });

  it("shows the session-expired error when updating fails with status 401", async () => {
    getStudents.mockResolvedValue(students);
    updateStudent.mockRejectedValue({ status: 401 });

    render(<StudentsTable allowEdit />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText(
        "Your session has expired. Please sign in again.",
        { selector: ".management-feedback" }
      )
    ).toBeTruthy();
  });

  it("shows the server error when updating fails with status 500", async () => {
    getStudents.mockResolvedValue(students);
    updateStudent.mockRejectedValue({ status: 500 });

    render(<StudentsTable allowEdit />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText(
        "Server error. The student could not be update.",
        { selector: ".management-feedback" }
      )
    ).toBeTruthy();
  });

  it("shows the saving state while updating", async () => {
    getStudents.mockResolvedValue(students);

    let resolveUpdate;
    updateStudent.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      })
    );

    render(<StudentsTable allowEdit />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeTruthy();

    resolveUpdate({});
    await screen.findByText("Student details updated successfully.");
  });

  it("deletes a student after confirmation", async () => {
    getStudents.mockResolvedValue(students);
    deleteStudent.mockResolvedValue({});
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<StudentsTable allowDelete />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    await waitFor(() => {
      expect(deleteStudent).toHaveBeenCalledWith(1);
    });

    expect(
      await screen.findByText("Student deleted successfully.")
    ).toBeTruthy();
  });

  it("does not delete a student when confirmation is cancelled", async () => {
    getStudents.mockResolvedValue(students);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<StudentsTable allowDelete />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(deleteStudent).not.toHaveBeenCalled();
  });

  it("shows an error when deleting a student fails", async () => {
    getStudents.mockResolvedValue(students);
    deleteStudent.mockRejectedValue({ status: 404 });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<StudentsTable allowDelete />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(
      await screen.findByText(
        "This student record could not be found. Refresh the list and try again."
      )
    ).toBeTruthy();
  });

  it("shows the default error when deleting fails with status 400", async () => {
    getStudents.mockResolvedValue(students);
    deleteStudent.mockRejectedValue({ status: 400 });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<StudentsTable allowDelete />);
    await screen.findByText("Jakka");

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(
      await screen.findByText(
       "Some details are invalid. Check the form and try again."
      )
    ).toBeTruthy();
  });
});

