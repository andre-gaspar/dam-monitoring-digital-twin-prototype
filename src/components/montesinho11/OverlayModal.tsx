"use client";

import { useEffect, useRef, type ReactNode } from "react";

type OverlayModalProps = {
  children: ReactNode;
  width: string;
  height?: string;
  padded?: boolean;
  mobileMode?: boolean;
  zIndex?: number;
  closeLabel?: string;
  onClose: () => void;
};

export function OverlayModal({
  children,
  width,
  height,
  padded = false,
  mobileMode = false,
  zIndex = 1000,
  closeLabel = "Close",
  onClose,
}: OverlayModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  closeRef.current = onClose;

  useEffect(() => {
    if (!mobileMode) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusableSelector =
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getExternalScopes = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          "[data-overlay-focus-scope]:not([inert])"
        )
      );

    const getFocusable = () => {
      const candidates = [
        ...Array.from(
          dialog.querySelectorAll<HTMLElement>(focusableSelector)
        ),
        ...getExternalScopes().flatMap((scope) =>
          Array.from(scope.querySelectorAll<HTMLElement>(focusableSelector))
        ),
      ];

      return Array.from(new Set(candidates)).filter(
        (element) => !element.closest("[inert]")
      );
    };

    const isInsideFocusScope = (element: Element | null) =>
      dialog.contains(element) ||
      getExternalScopes().some((scope) => scope.contains(element));

    const frameId = window.requestAnimationFrame(() => {
      getFocusable()[0]?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      const dialogs = Array.from(
        document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')
      );
      if (dialogs[dialogs.length - 1] !== dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const activeIndex = active ? focusable.indexOf(active) : -1;

      event.preventDefault();

      if (!isInsideFocusScope(active) || activeIndex < 0) {
        (event.shiftKey ? last : first).focus();
        return;
      }

      const nextIndex = event.shiftKey
        ? activeIndex === 0
          ? focusable.length - 1
          : activeIndex - 1
        : activeIndex === focusable.length - 1
          ? 0
          : activeIndex + 1;

      focusable[nextIndex].focus();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [mobileMode]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: mobileMode ? 0 : undefined,
        zIndex,
      }}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role={mobileMode ? "dialog" : undefined}
        aria-modal={mobileMode ? "true" : undefined}
        tabIndex={mobileMode ? -1 : undefined}
        style={{
          width: mobileMode ? "100vw" : width,
          height: mobileMode ? "100dvh" : height,
          background: "white",
          borderRadius: mobileMode ? 0 : "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          position: "relative",
          overflow: mobileMode || height ? "hidden" : undefined,
          padding: padded ? (mobileMode ? "12px" : "24px") : undefined,
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: mobileMode
              ? "calc(env(safe-area-inset-top, 0px) + 8px)"
              : 12,
            right: mobileMode
              ? "calc(env(safe-area-inset-right, 0px) + 8px)"
              : 12,
            zIndex: zIndex + 1,
            border: "none",
            background: "#111",
            color: "white",
            borderRadius: "8px",
            padding: "8px 12px",
            minWidth: mobileMode ? 44 : undefined,
            minHeight: mobileMode ? 44 : undefined,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {closeLabel}
        </button>

        {children}
      </div>
    </div>
  );
}
