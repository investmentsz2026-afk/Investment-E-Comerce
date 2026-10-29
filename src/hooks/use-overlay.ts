"use client";

import { useEffect } from "react";

/** Bloquea el scroll del documento mientras `locked` sea verdadero (menús y overlays). */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const scrollbarGap = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (scrollbarGap > 0) root.style.paddingRight = `${scrollbarGap}px`;
    return () => {
      root.style.overflow = previousOverflow;
      root.style.paddingRight = "";
    };
  }, [locked]);
}

/** Ejecuta `onEscape` al presionar Escape mientras `active` sea verdadero. */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onEscape]);
}
