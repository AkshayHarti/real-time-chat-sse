import {defineConfig} from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
    plugins: [react()],
    esbuild: {
        loader: "tsx",
        include: /.*\.[tj]sx?$/,
    },
    server: {
        port: 5000,
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
});
