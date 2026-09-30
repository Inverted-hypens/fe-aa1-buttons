"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Ref } from "react";
import { Check, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import "./stateful-button.css";

export type ButtonStatus = "idle" | "loading" | "success" | "error";

type Labels = Record<ButtonStatus, string>;

const DEFAULT_LABELS: Labels = {
  idle: "Generate direction",
  loading: "Generating",
  success: "Direction ready",
  error: "Try again",
};

const SR_MESSAGES: Record<ButtonStatus, string> = {
  idle: "",
  loading: "Working, please wait.",
  success: "Done.",
  error: "Something went wrong. Activate the button to try again.",
};

export type StatefulButtonProps = {
  /** Resolve = success, reject/throw = error. */
  action: () => Promise<unknown>;
  labels?: Partial<Labels>;
  disabled?: boolean;
  /** How long the success state is held before returning to idle. */
  successHoldMs?: number;
  /** Loading is shown at least this long, so fast responses don't flicker. */
  minLoadingMs?: number;
  onStatusChange?: (status: ButtonStatus) => void;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function StatefulButton({
  action,
  labels,
  disabled = false,
  successHoldMs = 1200,
  minLoadingMs = 400,
  onStatusChange,
  className,
  ref,
}: StatefulButtonProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const [status, setStatus] = useState<ButtonStatus>("idle");

  // The ref is the source of truth so rapid clicks in the same tick can't
  // both slip past a stale `status` closure.
  const statusRef = useRef<ButtonStatus>("idle");
  const runId = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  });

  const transition = useCallback((next: ButtonStatus) => {
    statusRef.current = next;
    setStatus(next);
    onStatusChangeRef.current?.(next);
  }, []);

  useEffect(() => {
    return () => {
      // Invalidate any in-flight run and pending timer on unmount.
      runId.current += 1;
      clearTimeout(holdTimer.current);
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (disabled) return;
    // Ignored while working or celebrating; error click = retry.
    if (statusRef.current === "loading" || statusRef.current === "success") {
      return;
    }

    clearTimeout(holdTimer.current);
    const id = ++runId.current;
    transition("loading");

    const startedAt = Date.now();
    let ok = true;
    try {
      await action();
    } catch {
      ok = false;
    }

    const remaining = minLoadingMs - (Date.now() - startedAt);
    if (remaining > 0) await sleep(remaining);
    if (id !== runId.current) return; // unmounted or superseded

    if (ok) {
      transition("success");
      holdTimer.current = setTimeout(() => {
        if (id === runId.current) transition("idle");
      }, successHoldMs);
    } else {
      transition("error");
    }
  }, [action, disabled, minLoadingMs, successHoldMs, transition]);

  const isLoading = status === "loading";

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={className ? `sb ${className}` : "sb"}
        data-state={status}
        disabled={disabled}
        aria-busy={isLoading}
        aria-disabled={isLoading || undefined}
        onClick={handleClick}
      >
        <span className="sb__inner">
          <span className="sb__shadow" aria-hidden="true" />
          <span className="sb__fills" aria-hidden="true">
            <span className="sb__fill sb__fill--idle" />
            <span className="sb__fill sb__fill--success" />
            <span className="sb__fill sb__fill--error" />
          </span>

          <span className="sb__layer sb__layer--idle" aria-hidden="true">
            <Sparkles className="sb__icon" />
            {text.idle}
          </span>
          <span className="sb__layer sb__layer--loading" aria-hidden="true">
            <LoaderCircle className="sb__icon sb__spinner" />
            {text.loading}
          </span>
          <span className="sb__layer sb__layer--success" aria-hidden="true">
            <Check className="sb__icon sb__check" />
            {text.success}
          </span>
          <span className="sb__layer sb__layer--error" aria-hidden="true">
            <RotateCcw className="sb__icon" />
            {text.error}
          </span>

          {/* Accessible name always reflects the current state. */}
          <span className="sb-sr-only">{text[status]}</span>
        </span>
      </button>
      <span role="status" className="sb-sr-only">
        {SR_MESSAGES[status]}
      </span>
    </>
  );
}
