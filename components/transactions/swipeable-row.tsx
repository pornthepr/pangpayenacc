"use client";

import { useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

const REVEAL = 96;

export function SwipeableRow({
  onEdit,
  onDelete,
  onTap,
  children,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onTap: () => void;
  children: React.ReactNode;
}) {
  const [translateX, setTranslateX] = useState(0);
  const baseX = useRef(0);
  const startX = useRef<number | null>(null);
  const dragged = useRef(false);

  function handlePointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    baseX.current = translateX;
    dragged.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (startX.current == null) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 5) dragged.current = true;
    setTranslateX(Math.min(0, Math.max(-REVEAL, baseX.current + delta)));
  }

  function handlePointerUp() {
    startX.current = null;
    setTranslateX((current) => (current < -REVEAL / 2 ? -REVEAL : 0));
  }

  function handleClick() {
    if (dragged.current) return;
    if (translateX !== 0) {
      setTranslateX(0);
      return;
    }
    onTap();
  }

  return (
    <div className="relative overflow-hidden border-b last:border-b-0">
      <div className="absolute inset-y-0 right-0 flex">
        <button
          type="button"
          onClick={() => {
            setTranslateX(0);
            onEdit();
          }}
          className="flex h-full w-12 items-center justify-center bg-muted text-foreground"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setTranslateX(0);
            onDelete();
          }}
          className="flex h-full w-12 items-center justify-center bg-destructive/10 text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        style={{ transform: `translateX(${translateX}px)` }}
        className="relative cursor-pointer touch-pan-y select-none bg-background transition-transform hover:bg-muted/50"
      >
        {children}
      </div>
    </div>
  );
}
