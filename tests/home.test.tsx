import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home", () => {
  it("renders the Alpha foundation", () => {
    render(<Home />);
    expect(screen.getByText("Alpha foundation")).toBeInTheDocument();
    expect(screen.getByText("System status:")).toBeInTheDocument();
  });
});
