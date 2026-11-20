// Device profile, decided once at load.
// A phone (touch screen, small side under 600 px) gets no graphics-level warning:
// the engine picks a lower level there on purpose.
export const PHONE =
    matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 600;

/**
 * CSS pixels → the engine's pixel unit for draped overlays. Horizon 26.1 draws
 * them devicePixelRatio times too wide (a 2 px line is ~5 CSS px on a phone),
 * so sizes are divided by the ratio. To remove once the engine is fixed.
 */
export const px = (cssPx: number) => cssPx / (window.devicePixelRatio || 1);

/**
 * Horizon 26.1 applies the device pixel ratio twice to pointer positions: on a
 * phone (ratio ~2.6) a gesture below the top third of the view falls "outside"
 * it and is ignored (same with a mouse on a HiDPI screen). The engine reads
 * `offsetX/Y` in its `canvas.onpointer*` handlers: hand it CSS pixels divided
 * by the ratio. To remove once the engine is fixed.
 */
export function fixPointerScale(canvas: HTMLCanvasElement): void {
    for (const key of ["onpointerdown", "onpointermove", "onpointerup", "onpointercancel"] as const) {
        const handler = canvas[key];
        if (!handler) continue;
        canvas[key] = (event: PointerEvent) =>
            handler.call(
                canvas,
                new Proxy(event, {
                    get(target, prop) {
                        if (prop === "offsetX") return target.offsetX / devicePixelRatio;
                        if (prop === "offsetY") return target.offsetY / devicePixelRatio;
                        const value = Reflect.get(target, prop, target);
                        return typeof value === "function" ? value.bind(target) : value;
                    },
                }),
            );
    }
}
