"use client";

type TopActionButtonProps = {
  children: React.ReactNode;
  top: number;
  left?: number;
  right?: number;
  onClick: () => void;
};

export function TopActionButton({
  children,
  top,
  left,
  right,
  onClick,
}: TopActionButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top,
        left,
        right,
        zIndex: 10,
        padding: "12px 18px",
        background: "white",
        color: "black",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}
