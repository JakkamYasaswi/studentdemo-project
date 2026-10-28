
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from "vitest";

import { apiRequest } from "../services/api";

import {
  getStudents,
  getMyStudentDetails,
  updateStudent,
  deleteStudent,
} from "../services/students";

vi.mock("../services/api", () => ({
  apiRequest: vi.fn(),
}));

describe("Student service functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStudents", () => {
    it("fetches and returns the student list", async () => {
      const students = [
        {
          id: 1,
          studentName: "Test Student",
          course: "CSE",
          location: "Hyderabad",
          email: "student@example.com",
          mobileNumber: "9876543210",
          role: "Student",
          extraField: "ignored",
        },
      ];

      apiRequest.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(students),
      });

      const result = await getStudents();

      expect(apiRequest).toHaveBeenCalledWith(
        "/Students",
        { signal: undefined }
      );

      expect(result).toEqual([
        {
          id: 1,
          studentName: "Test Student",
          course: "CSE",
          location: "Hyderabad",
          email: "student@example.com",
          mobileNumber: "9876543210",
          role: "Student",
        },
      ]);
    });

    it("passes the abort signal to the API", async () => {
      const signal = { testSignal: true };

      apiRequest.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      await getStudents({ signal });

      expect(apiRequest).toHaveBeenCalledWith(
        "/Students",
        { signal }
      );
    });

    it("throws an error when the student response is not an array", async () => {
      apiRequest.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ studentName: "Test" }),
      });

      await expect(getStudents()).rejects.toThrow(
        "The student list response was not an array."
      );
    });

    it("throws an error when the API request fails", async () => {
      apiRequest.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(getStudents()).rejects.toMatchObject({
        message: "Student API request failed with status 500.",
        status: 500,
      });
    });
  });

  describe("getMyStudentDetails", () => {
    it("fetches the current student's details", async () => {
      const student = {
        id: 1,
        studentName: "Test Student",
        email: "student@example.com",
      };

      apiRequest.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(student),
      });

      const result = await getMyStudentDetails();

      expect(apiRequest).toHaveBeenCalledWith(
        "/Students/my-details",
        { signal: undefined }
      );

      expect(result).toEqual(student);
    });

    it("passes the abort signal to the API", async () => {
      const signal = { testSignal: true };

      apiRequest.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 1 }),
      });

      await getMyStudentDetails({ signal });

      expect(apiRequest).toHaveBeenCalledWith(
        "/Students/my-details",
        { signal }
      );
    });

    it("throws an error when the API request fails", async () => {
      apiRequest.mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(getMyStudentDetails()).rejects.toMatchObject({
        message: "Student API request failed with status 401.",
        status: 401,
      });
    });
  });

  describe("updateStudent", () => {
    it("updates a student successfully", async () => {
      apiRequest.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const student = {
        id: 1,
        studentName: "Updated Student",
        course: "CSE",
        location: "Hyderabad",
        email: "student@example.com",
        mobileNumber: "9876543210",
        role: "Student",
      };

      await expect(updateStudent(student)).resolves.toBeUndefined();

      expect(apiRequest).toHaveBeenCalledWith(
        "/Students/1",
        {
          method: "PUT",
          body: JSON.stringify(student),
        }
      );
    });

    it("encodes the student ID in the URL", async () => {
      apiRequest.mockResolvedValue({
        ok: true,
        status: 200,
      });

      await updateStudent({
        id: "student/1",
        studentName: "Test",
        course: "CSE",
        location: "Hyderabad",
        email: "student@example.com",
        mobileNumber: "9876543210",
        role: "Student",
      });

      expect(apiRequest).toHaveBeenCalledWith(
        "/Students/student%2F1",
        expect.objectContaining({
          method: "PUT",
        })
      );
    });

    it("throws an error when the update fails", async () => {
      apiRequest.mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(
        updateStudent({ id: 1 })
      ).rejects.toMatchObject({
        message: "Student update failed with status 400.",
        status: 400,
      });
    });
  });

  describe("deleteStudent", () => {
    it("deletes a student successfully", async () => {
      apiRequest.mockResolvedValue({
        ok: true,
        status: 200,
      });

      await expect(deleteStudent(1)).resolves.toBeUndefined();

      expect(apiRequest).toHaveBeenCalledWith(
        "/Students/1",
        { method: "DELETE" }
      );
    });

    it("encodes the student ID in the URL", async () => {
      apiRequest.mockResolvedValue({
        ok: true,
        status: 200,
      });

      await deleteStudent("student/1");

      expect(apiRequest).toHaveBeenCalledWith(
        "/Students/student%2F1",
        { method: "DELETE" }
      );
    });

    it("throws an error when deletion fails", async () => {
      apiRequest.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(deleteStudent(99)).rejects.toMatchObject({
        message: "Student deletion failed with status 404.",
        status: 404,
      });
    });
  });
});
