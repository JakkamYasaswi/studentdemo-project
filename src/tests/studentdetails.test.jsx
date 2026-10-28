
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Studentdetails1 from "../studentdetails";

afterEach(() => {
  cleanup();
});

describe("Studentdetails1", () => {
  it("renders the Student Information heading", () => {
    render(<Studentdetails1 />);

    expect(
      screen.getByRole("heading", { name: "Student Information" })
    ).toBeTruthy();
  });

  it("displays all student details passed through props", () => {
    render(
      <Studentdetails1
        Name="Ravi Kumar"
        RollNumber="101"
        Email="ravi@example.com"
        Age="22"
        MobileNo="9876543210"
        Dateofbirth="2004-01-18"
        Gender="Male"
        Course="B.Tech CSE"
      />
    );

    expect(screen.getByText("Name: Ravi Kumar")).toBeTruthy();
    expect(screen.getByText("Roll Number: 101")).toBeTruthy();
    expect(screen.getByText("Email: ravi@example.com")).toBeTruthy();
    expect(screen.getByText("Age: 22")).toBeTruthy();
    expect(screen.getByText("Mobile No: 9876543210")).toBeTruthy();
    expect(screen.getByText("Date of Birth: 2004-01-18")).toBeTruthy();
    expect(screen.getByText("Gender: Male")).toBeTruthy();
    expect(screen.getByText("Course: B.Tech CSE")).toBeTruthy();
  });
});
