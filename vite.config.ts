import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

// vite-plugin-cesium copies Cesium's static Workers/Assets/Widgets into the
// build output and sets window.CESIUM_BASE_URL automatically (it joins
// Vite's `base` with the cesium path, so setting `base` below is enough).
//
// `base: "./"` (relative) instead of an absolute "/sitio/": GitHub Pages
// project sites already prepend "/sitio/" when routing a request to the
// deployed artifact, so an absolute base would make vite-plugin-cesium
// copy its files to "dist/sitio/cesium/..." while the server looks for
// them at "dist/cesium/..." (double-prefixed → 404 on Cesium.js/widgets.css).
// A relative base sidesteps this entirely and also works under any
// subpath without hardcoding the repo name. Only applied on `vite build`,
// so local `vite dev` keeps serving from `/`.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  plugins: [react(), cesium()],
  server: {
    host: true,
  },
}));
