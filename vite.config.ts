import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

// vite-plugin-cesium copies Cesium's static Workers/Assets/Widgets into the
// build output and sets window.CESIUM_BASE_URL automatically (it joins
// Vite's `base` with the cesium path, so setting `base` below is enough).
//
// `base` is the GitHub Pages project-site subpath (https://<user>.github.io/sitio/).
// Only applied on `vite build`, so local `vite dev` keeps serving from `/`.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/sitio/" : "/",
  plugins: [react(), cesium()],
  server: {
    host: true,
  },
}));
