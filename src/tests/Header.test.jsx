
import { describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import Header1 from "../Header";

afterEach(() => {
  cleanup();
});

describe("Header1", () => {
  it("renders the Student Registration Form heading", () => {
    render(<Header1 />);

    expect(
      screen.getByRole("heading", {
        name: "Student Registration Form",
      })
    ).toBeTruthy();
  });

  it("renders the heading as an h1 element", () => {
    render(<Header1 />);

    const heading = screen.getByRole("heading", {
      level: 1,
    });

    expect(heading.textContent).toBe("Student Registration Form");
  });
});
