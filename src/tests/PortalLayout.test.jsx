import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PortalLayout from "../pages/PortalLayout";

vi.mock("../components/Navbar", () => ({
  default: () => <nav>Mock Navbar</nav>,
}));

afterEach(() => {
  cleanup();
});

describe("PortalLayout", () => {
  it("renders the Navbar component", () => {
    render(
      <MemoryRouter initialEntries={["/portal"]}>
        <Routes>
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<div>Portal Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Mock Navbar")).toBeTruthy();
  });

  it("renders the child page inside the Outlet", () => {
    render(
      <MemoryRouter initialEntries={["/portal"]}>
        <Routes>
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<div>Portal Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Portal Home")).toBeTruthy();
  });
});