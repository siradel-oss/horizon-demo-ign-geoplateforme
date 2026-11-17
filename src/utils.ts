import type { HrzProtocol } from "@siradel-oss/horizon-protocol";

export function rateLimit<T extends (...args: any[]) => void>(
    fn: T,
    delayMs: number,
): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;

        const callFunction = () => {
            lastCall = Date.now();
            fn(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        if (timeSinceLastCall >= delayMs) {
            callFunction();
        } else {
            timeout = setTimeout(callFunction, delayMs - timeSinceLastCall);
        }
    };
}

export function hexToColor(hex: string, alpha: number): HrzProtocol.Color.$Properties {
    const int = parseInt(hex.replace("#", ""), 16) || 0;
    return {
        r: ((int >> 16) & 0xff) / 255,
        g: ((int >> 8) & 0xff) / 255,
        b: (int & 0xff) / 255,
        a: alpha,
    };
}
