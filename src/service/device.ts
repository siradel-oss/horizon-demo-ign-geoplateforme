// Device profile, decided once at load.
// A phone (touch screen, small side under 600 px) gets no graphics-level warning:
// the engine picks a lower level there on purpose.
export const PHONE =
    matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 600;
