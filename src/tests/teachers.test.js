
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiRequest } from "../services/api";
import { createTeacher } from "../services/teachers";

vi.mock("../services/api", () => ({
  apiRequest: vi.fn(),
}));

describe("createTeacher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a teacher successfully", async () => {
    apiRequest.mockResolvedValue({
      ok: true,
      status: 201,
    });

    const teacher = {
      fullName: "Test Teacher",
      email: "teacher@example.com",
      password: "Password123",
    };

    await expect(createTeacher(teacher)).resolves.toBeUndefined();

    expect(apiRequest).toHaveBeenCalledWith(
      "/Users/create-teacher",
      {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test Teacher",
          email: "teacher@example.com",
          password: "Password123",
        }),
      }
    );
  });

  it("throws an error when teacher creation fails", async () => {
    apiRequest.mockResolvedValue({
      ok: false,
      status: 400,
    });

    const teacher = {
      fullName: "Test Teacher",
      email: "teacher@example.com",
      password: "Password123",
    };

    await expect(createTeacher(teacher)).rejects.toMatchObject({
      message: "Teacher creation failed with status 400.",
      status: 400,
    });
  });

  it("throws an error when the server returns status 500", async () => {
    apiRequest.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      createTeacher({
        fullName: "Test Teacher",
        email: "teacher@example.com",
        password: "Password123",
      })
    ).rejects.toMatchObject({
      message: "Teacher creation failed with status 500.",
      status: 500,
    });
  });
});
