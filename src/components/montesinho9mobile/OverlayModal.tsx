"use client";

type OverlayModalProps = {
  children: React.ReactNode;
  width: string;
  height?: string;
  padded?: boolean;
  zIndex?: number;
  onClose: () => void;
};

export function OverlayModal({
  children,
  width,
  height,
  padded = false,
  zIndex = 1000,
  onClose,
}: OverlayModalProps) {
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
        padding: 12,
        zIndex,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          height,
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          position: "relative",
          overflow: height ? "hidden" : undefined,
          padding: padded ? "24px" : undefined,
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: zIndex + 1,
            border: "none",
            background: "#111",
            color: "white",
            borderRadius: "999px",
            padding: "7px 11px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Close
        </button>

        {children}
      </div>
    </div>
  );
}
