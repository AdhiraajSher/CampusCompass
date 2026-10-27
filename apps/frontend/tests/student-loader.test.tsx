import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import students from "../../../shared/fixtures/students.json";
import { StudentLoader } from "@/components/student-loader";
import { identities } from "@/lib/domain";

describe("student API integration", () => {
  it("fetches students and renders the educator dashboard using the shared seed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => students });
    vi.stubGlobal("fetch", fetchMock);
    render(<StudentLoader identity={identities[0]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading students");
    expect((await screen.findAllByText("Aarav Shah")).length).toBeGreaterThan(
      0,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/students",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(
      screen.getByRole("heading", { name: "Priority queue" }),
    ).toBeInTheDocument();
  });
  it("shows an actionable error if the backend is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502 }),
    );
    render(<StudentLoader identity={identities[0]} />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("backend is running"),
    );
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
  it("handles an empty caseload without rendering an invalid student detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );
    render(<StudentLoader identity={identities[2]} />);
    expect(
      await screen.findByRole("heading", { name: "No assigned students yet." }),
    ).toBeInTheDocument();
  });
});
