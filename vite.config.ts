import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

// Horizon needs cross-origin isolation (SharedArrayBuffer / wasm threads).
const crossOriginIsolationHeaders = {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
    // Relative asset URLs: the build works under any subpath.
    base: "./",
    plugins: [tailwindcss(), vue(), vueDevTools()],
    server: { headers: crossOriginIsolationHeaders },
    preview: { headers: crossOriginIsolationHeaders },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
});
