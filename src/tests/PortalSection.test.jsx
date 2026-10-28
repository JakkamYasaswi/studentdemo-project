import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PortalSection from "../pages/PortalSection";

describe("PortalSection", () => {
  it("renders the eyebrow, title, and description", () => {
    render(
      <PortalSection
        eyebrow="STUDENT PORTAL"
        title="Student Dashboard"
        description="Manage your student information here."
      />
    );

    expect(screen.getByText("STUDENT PORTAL")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Student Dashboard" })).toBeTruthy();
    expect(screen.getByText("Manage your student information here.")).toBeTruthy();
  });

  it("renders the provided props correctly", () => {
    render(
      <PortalSection
        eyebrow="ADMIN PORTAL"
        title="Admin Dashboard"
        description="Manage portal settings."
      />
    );

    expect(screen.getByText("ADMIN PORTAL")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Admin Dashboard" })).toBeTruthy();
    expect(screen.getByText("Manage portal settings.")).toBeTruthy();
  });
});