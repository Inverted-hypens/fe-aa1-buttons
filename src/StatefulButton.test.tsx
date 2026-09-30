import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import StatefulButton from "./StatefulButton";

const button = () => screen.getByRole("button");

describe("StatefulButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle with the idle label as its accessible name", () => {
    render(<StatefulButton action={() => Promise.resolve()} />);
    expect(button()).toHaveAttribute("data-state", "idle");
    expect(button()).toHaveAccessibleName("Generate direction");
  });

  it("goes idle -> loading -> success -> idle", async () => {
    render(<StatefulButton action={() => Promise.resolve()} />);

    fireEvent.click(button());
    expect(button()).toHaveAttribute("data-state", "loading");
    expect(button()).toHaveAttribute("aria-busy", "true");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(button()).toHaveAttribute("data-state", "success");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(button()).toHaveAttribute("data-state", "idle");
  });

  it("shows the retry label on failure and retries on click", async () => {
    const action = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(undefined);
    render(<StatefulButton action={action} />);

    fireEvent.click(button());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(button()).toHaveAttribute("data-state", "error");
    expect(button()).toHaveAccessibleName("Try again");

    fireEvent.click(button());
    expect(button()).toHaveAttribute("data-state", "loading");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(button()).toHaveAttribute("data-state", "success");
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("ignores spam clicks while loading and during the success hold", async () => {
    const action = vi.fn(() => Promise.resolve());
    render(<StatefulButton action={action} />);

    fireEvent.click(button());
    fireEvent.click(button());
    fireEvent.click(button());
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(button()).toHaveAttribute("data-state", "success");
    fireEvent.click(button());
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", () => {
    const action = vi.fn(() => Promise.resolve());
    render(<StatefulButton action={action} disabled />);
    fireEvent.click(button());
    expect(button()).toBeDisabled();
    expect(action).not.toHaveBeenCalled();
  });

  it("does not update state after unmount", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onStatusChange = vi.fn();
    const { unmount } = render(
      <StatefulButton
        action={() => Promise.resolve()}
        onStatusChange={onStatusChange}
      />,
    );

    fireEvent.click(button());
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // only the "loading" transition from before unmount
    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
